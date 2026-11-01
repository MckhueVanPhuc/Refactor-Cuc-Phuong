-- M03 migration 4d — session intake and reports (tasks M03 T194; session-intake-contract §1–§4; admin-command Q-12,
-- Q-13; Physical §7.2, §7.3, §14 O-2, O-3; research R-17; BR-M03-J01–J08, X05; SC-M03-007, 035, 038).
-- api.ingest_session is executable by service_role only (the Edge Function session-intake). An invalid record raises
-- SQLSTATE 22023 and stores nothing; the Edge Function answers INVALID. Intake writes no audit (not an admin action).

create function app.try_timestamptz(p_value jsonb) returns timestamptz
language plpgsql immutable
set search_path = ''
as $$
begin
  if jsonb_typeof(p_value) <> 'string' or (p_value #>> '{}') !~ '(Z|[+-]00:?00)$' then
    return null;
  end if;
  return (p_value #>> '{}')::timestamptz;
exception when others then
  return null;
end;
$$;

-- Visits as a set keyed by checkpointId, timestamps as instants (Physical §14 O-3)
create function app.normalized_visits(p_visits jsonb) returns jsonb
language sql immutable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(v ->> 'checkpointId', jsonb_build_object('checkpointName', v -> 'checkpointName',
    'sequence', v -> 'sequence', 'checkedInAt', extract(epoch from app.try_timestamptz(v -> 'checkedInAt')))), '{}')
  from jsonb_array_elements(coalesce(p_visits, '[]')) v
$$;

create function app.invalid_session(p_why text) returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'INVALID_SESSION_RECORD' using errcode = 'invalid_parameter_value', detail = p_why;
end;
$$;

create function api.ingest_session(p_record jsonb) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_started timestamptz := app.try_timestamptz(p_record -> 'startedAt');
  v_ended timestamptz := app.try_timestamptz(p_record -> 'endedAt');
  v_version integer;
  v_snapshot app.journey_snapshots;
  v_existing app.session_records;
  v_inserted integer;
begin
  -- allowlist and shape (BR-M03-J01): exactly these keys, at the root and in every visit
  if jsonb_typeof(p_record) <> 'object'
     or (select array_agg(k order by k) from jsonb_object_keys(p_record) k)
        is distinct from array['contentVersion', 'endedAt', 'routeId', 'sessionId', 'startedAt', 'status', 'visitedCheckpoints'] then
    perform app.invalid_session('keys');
  end if;
  if (p_record ->> 'sessionId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or not app.non_empty_text(p_record -> 'routeId')
     or jsonb_typeof(p_record -> 'contentVersion') <> 'number'
     or (p_record ->> 'contentVersion') !~ '^[1-9][0-9]*$'
     or p_record ->> 'status' not in ('HOAN_TAT', 'BO_DO')
     or v_started is null or v_ended is null or v_ended < v_started
     or not app.visits_ok(p_record -> 'visitedCheckpoints') then
    perform app.invalid_session('shape');
  end if;
  v_session_id := (p_record ->> 'sessionId')::uuid;
  v_version := (p_record ->> 'contentVersion')::integer;
  if exists (select 1 from jsonb_array_elements(p_record -> 'visitedCheckpoints') v
             where app.try_timestamptz(v -> 'checkedInAt') is null
                or app.try_timestamptz(v -> 'checkedInAt') not between v_started and v_ended) then
    perform app.invalid_session('checkedInAt');
  end if;
  -- the journey version exists, whatever the route's status now (BR-M03-J04); visits equal it (J02)
  select * into v_snapshot from app.journey_snapshots where route_id = p_record ->> 'routeId' and content_version = v_version;
  if v_snapshot.route_id is null then
    perform app.invalid_session('snapshot');
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_record -> 'visitedCheckpoints') v
    where not exists (select 1 from jsonb_array_elements(v_snapshot.checkpoints) k
                      where k ->> 'checkpointId' = v ->> 'checkpointId'
                        and k #>> '{checkpointName,vi}' = v ->> 'checkpointName'
                        and k -> 'sequence' = v -> 'sequence')) then
    perform app.invalid_session('visits');
  end if;

  insert into app.session_records (session_id, route_id, content_version, started_at, ended_at, status, visited_checkpoints)
  values (v_session_id, p_record ->> 'routeId', v_version, v_started, v_ended, p_record ->> 'status', p_record -> 'visitedCheckpoints')
  on conflict (session_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted = 1 then
    return '{"result": "ACCEPTED"}';
  end if;
  -- a retry: the first record is kept; identical after normalization or a conflict (BR-M03-J03)
  select * into v_existing from app.session_records where session_id = v_session_id;
  return case when v_existing.route_id = p_record ->> 'routeId' and v_existing.content_version = v_version
                and v_existing.started_at = v_started and v_existing.ended_at = v_ended and v_existing.status = p_record ->> 'status'
                and app.normalized_visits(v_existing.visited_checkpoints) = app.normalized_visits(p_record -> 'visitedCheckpoints')
              then '{"result": "IDENTICAL"}'::jsonb else '{"result": "CONFLICT"}'::jsonb end;
end;
$$;

grant execute on function api.ingest_session(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Q-12 RPT-01, Q-13 RPT-02 (on demand; R-17)
-- ---------------------------------------------------------------------------

-- The report window as UTC instants: both dates or none, from ≤ to, at most REPORT_MAX_SPAN_DAYS days counting both
-- ends, default the last 30 calendar days ending today in Asia/Ho_Chi_Minh (BR-M03-J05). A wrong window raises 22023.
create function app.report_window(p_from_date date, p_to_date date, out from_at timestamptz, out to_at timestamptz)
language plpgsql stable
set search_path = ''
as $$
declare
  v_from date := p_from_date;
  v_to date := p_to_date;
begin
  if v_from is null and v_to is null then
    v_to := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    v_from := v_to - (app.limit('REPORT_DEFAULT_SPAN_DAYS') - 1);
  elsif v_from is null or v_to is null or v_from > v_to then
    raise exception 'MSG-REPORT-DATES-INVALID' using errcode = 'invalid_parameter_value';
  elsif v_to - v_from + 1 > app.limit('REPORT_MAX_SPAN_DAYS') then
    raise exception 'MSG-REPORT-SPAN' using errcode = 'invalid_parameter_value';
  end if;
  from_at := v_from::timestamp at time zone 'Asia/Ho_Chi_Minh';
  to_at := (v_to + 1)::timestamp at time zone 'Asia/Ho_Chi_Minh';
end;
$$;

create function app.last_ingestion() returns jsonb
language sql stable
set search_path = ''
as $$ select app.jsonb_opt('lastSuccessfulIngestionAt', to_jsonb(app.iso(max(ingested_at)))) from app.session_records $$;

create function api.report_rpt01(p_route_id text default null, p_from_date date default null, p_to_date date default null) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_window record;
  v_total integer;
  v_completed integer;
begin
  perform app.require_reader();
  select * into v_window from app.report_window(p_from_date, p_to_date);
  select count(*), count(*) filter (where s.status = 'HOAN_TAT') into v_total, v_completed
  from app.session_records s
  where s.ended_at >= v_window.from_at and s.ended_at < v_window.to_at and (p_route_id is null or s.route_id = p_route_id);
  return jsonb_build_object(
      'totalSessionCount', v_total,
      'completedCount', v_completed,
      'completedRate', case when v_total = 0 then 0 else v_completed::double precision / v_total end,
      'abandonedCount', v_total - v_completed,
      'abandonedRate', case when v_total = 0 then 0 else (v_total - v_completed)::double precision / v_total end)
    || app.last_ingestion();
end;
$$;

-- Distinct sessions per (route, checkpoint); name and sequence from the record with the latest endedAt in the period,
-- session id as the tie-break; route name = Vietnamese name of the published route at query time (BR-M03-J07)
create function api.report_rpt02(p_route_id text default null, p_from_date date default null, p_to_date date default null) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_window record;
begin
  perform app.require_reader();
  select * into v_window from app.report_window(p_from_date, p_to_date);
  return jsonb_build_object('items', coalesce((
      select jsonb_agg(jsonb_build_object('routeId', g.route_id, 'routeName', g.route_name, 'checkpointId', g.checkpoint_id,
               'checkpointName', g.checkpoint_name, 'sequence', g.sequence, 'uniqueSessionCount', g.sessions)
             order by g.route_name, g.sequence, g.checkpoint_id)
      from (
        select v.route_id, v.checkpoint_id,
               coalesce(nullif(app.trim_text((app.published_of('ROUTE', v.route_id)).content #>> '{name,vi}'), ''), 'Tuyến chưa đặt tên') as route_name,
               (array_agg(v.checkpoint_name order by v.ended_at desc, v.session_id::text desc))[1] as checkpoint_name,
               (array_agg(v.sequence order by v.ended_at desc, v.session_id::text desc))[1] as sequence,
               count(distinct v.session_id)::integer as sessions
        from (select s.route_id, s.session_id, s.ended_at, e ->> 'checkpointId' as checkpoint_id, e ->> 'checkpointName' as checkpoint_name,
                     (e ->> 'sequence')::integer as sequence
              from app.session_records s
              cross join lateral jsonb_array_elements(s.visited_checkpoints) e
              where s.ended_at >= v_window.from_at and s.ended_at < v_window.to_at
                and (p_route_id is null or s.route_id = p_route_id)) v
        group by v.route_id, v.checkpoint_id) g), '[]'))
    || app.last_ingestion();
end;
$$;

grant execute on function api.report_rpt01(text, date, date) to authenticated;
grant execute on function api.report_rpt02(text, date, date) to authenticated;
