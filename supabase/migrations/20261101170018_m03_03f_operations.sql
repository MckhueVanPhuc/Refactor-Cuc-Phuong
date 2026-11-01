-- M03 migration 3f — close, reopen, archive (tasks M03 T188; admin-command C-09–C-15, Q-09; research R-07, R-08, R-10;
-- Physical §8; BR-M03-A03, D10, G10, H01–H09, T05, T07, X02, X03, X06).
-- Closing is never blocked by the offline ceiling; reopening is. A route never reopens by itself.

-- Close a route row: TAM_DONG with source, reason, who and when (DAC-M03-007)
create function app.close_route_row(p_route_id text, p_source text, p_reason text, p_actor text) returns void
language sql
set search_path = ''
as $$
  update app.routes
  set status = 'TAM_DONG', closure_source = p_source, closure_reason = app.trim_text(p_reason), closed_at = now(),
      closed_by_user_id = p_actor, concurrency_revision = concurrency_revision + 1
  where route_id = p_route_id
$$;

-- Lock set of an operation at a checkpoint: the checkpoint and every affected route (R-08)
create function app.checkpoint_lock_items(p_checkpoint_id text) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || p_checkpoint_id, 'name', app.checkpoint_name(p_checkpoint_id)))
    || coalesce((select jsonb_agg(jsonb_build_object('key', 'route:' || r.route_id, 'name', app.route_name(r.route_id)))
                 from app.affected_routes(p_checkpoint_id) r), '[]')
$$;

create function app.route_refs(p_route_ids text[]) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('routeId', r, 'routeName', app.route_name(r)) order by n), '[]')
  from unnest(p_route_ids) with ordinality u(r, n)
$$;

-- HOAT_DONG routes left without an active checkpoint once this one closes (BR-M03-H02, T05)
create function app.auto_closing_routes(p_checkpoint_id text) returns text[]
language sql stable
set search_path = ''
as $$
  select coalesce(array_agg(r.route_id order by r.route_id), '{}')
  from app.affected_routes(p_checkpoint_id) r
  join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version
  where r.status = 'HOAT_DONG'
    and not exists (select 1 from jsonb_array_elements(s.checkpoints) k where k ->> 'checkpointId' <> p_checkpoint_id)
$$;

-- What must be fixed before reopening a route, as filled sentences (BR-M03-H07)
create function app.route_reopen_blockers(p_route_id text) returns text[]
language sql stable
set search_path = ''
as $$
  select coalesce(array_agg(m.message order by m.first_at), '{}')
  from (select i ->> 'message' as message, min(n) as first_at
        from jsonb_array_elements(app.route_publish_issues(p_route_id, coalesce((app.published_of('ROUTE', p_route_id)).content, '{}')))
             with ordinality x(i, n)
        group by i ->> 'message') m
$$;

-- What must be fixed before reopening a checkpoint, on its published data (BR-M03-H06)
create function app.checkpoint_reopen_blockers(p_checkpoint_id text) returns text[]
language plpgsql stable
set search_path = ''
as $$
declare
  v_content jsonb := coalesce((app.published_of('CHECKPOINT', p_checkpoint_id)).content, '{}');
  v_active text[];
  v_issues jsonb;
  v_qr text;
  v_qr_content jsonb;
  v_blockers text[] := '{}';
begin
  select coalesce(array_agg(q.qr_identifier order by q.created_at, q.qr_identifier), '{}') into v_active
  from app.qr_codes q where q.checkpoint_id = p_checkpoint_id and q.status = 'HOAT_DONG';
  v_issues := app.check_required_bilingual('CHECKPOINT', p_checkpoint_id, 'checkpointName', v_content -> 'checkpointName')
    || app.check_required('CHECKPOINT', p_checkpoint_id, 'connectivityMode', v_content -> 'connectivityMode');
  foreach v_qr in array v_active loop
    v_qr_content := coalesce((app.published_of('QRCODE', v_qr)).content, '{}');
    v_issues := v_issues || app.visit_point_publish_issues(v_qr,
      app.visit_point_name(v_qr_content #>> '{objectName,vi}', app.qr_creation_order(v_qr)), v_qr_content, app.qr_media_list(v_qr_content));
  end loop;
  if v_content ->> 'connectivityMode' = 'OFFLINE_REQUIRED' then
    v_issues := v_issues || app.unreadable_published_images(v_active);
  end if;
  if cardinality(v_active) = 0 then
    v_blockers := array[app.render_message('MSG-MISSING-FIELD', '{"tên ô": "ít nhất một điểm tham quan đang hoạt động"}')];
  end if;
  select v_blockers || coalesce(array_agg(m.message order by m.first_at), '{}') into v_blockers
  from (select i ->> 'message' as message, min(n) as first_at from jsonb_array_elements(v_issues) with ordinality x(i, n)
        group by i ->> 'message') m;
  if v_content ->> 'connectivityMode' = 'ONLINE_AVAILABLE' and (v_content ->> 'fieldVerificationConfirmed')::boolean is not true then
    v_blockers := v_blockers || app.render_message('MSG-ONLINE-NOT-VERIFIED',
      jsonb_build_object('tên', coalesce(app.trim_text(v_content #>> '{checkpointName,vi}'), '')));
  end if;
  return (select coalesce(array_agg(b order by n), '{}')
          from (select b, min(n) as n from unnest(v_blockers) with ordinality u(b, n) group by b) d);
end;
$$;

create function app.reopen_blocked(p_blockers text[]) returns jsonb
language sql immutable
set search_path = ''
as $$ select app.cr_blocked('MSG-REOPEN-BLOCKED', jsonb_build_object('danh sách', array_to_string(p_blockers, ' '))) $$;

-- ---------------------------------------------------------------------------
-- C-09 close route, C-12 reopen route, C-14 archive route
-- ---------------------------------------------------------------------------

create function api.close_route(p_route_id text, p_reason text default null, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_route app.routes;
  v_problem jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    perform app.lock_connected_set(jsonb_build_array(jsonb_build_object('key', 'route:' || p_route_id, 'name', app.route_name(p_route_id))));
    select * into v_route from app.routes where route_id = p_route_id for update;
    if v_route.status is distinct from 'HOAT_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_route.concurrency_revision,
      app.entity_last_editor('ROUTE', p_route_id), v_route.updated_at);
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    -- the active journey version stays; no new version (BR-M03-H03)
    perform app.close_route_row(p_route_id, 'MANUAL', p_reason, v_actor.user_id);
    perform app.audit(v_actor.user_id, 'ROUTE_CLOSED', 'ROUTE', p_route_id, 'SUCCESS', p_reason, null, null,
      '{"status": "HOAT_DONG"}', '{"status": "TAM_DONG"}');
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', 'TAM_DONG', 'concurrencyRevision', v_route.concurrency_revision + 1));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'ROUTE_CLOSED', 'ROUTE', coalesce(p_route_id, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

create function api.reopen_route(p_route_id text, p_safety_note text default null, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_route app.routes;
  v_problem jsonb;
  v_blockers text[];
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('R');
    perform app.lock_connected_set(jsonb_build_array(jsonb_build_object('key', 'route:' || p_route_id, 'name', app.route_name(p_route_id))));
    select * into v_route from app.routes where route_id = p_route_id for update;
    if v_route.status is distinct from 'TAM_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_route.concurrency_revision,
      app.entity_last_editor('ROUTE', p_route_id), v_route.updated_at);
    v_problem := app.reason_problem(p_safety_note, true, 'Ghi chú xác nhận an toàn');
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    -- at least one active checkpoint in the journey (BR-M03-H07, T05)
    if coalesce((select jsonb_array_length(s.checkpoints) from app.journey_snapshots s
                 where s.route_id = p_route_id and s.content_version = v_route.active_content_version), 0) = 0 then
      perform app.reject(app.cr_blocked('MSG-NO-ACTIVE-CHECKPOINT'));
    end if;
    v_blockers := app.route_reopen_blockers(p_route_id);
    if cardinality(v_blockers) > 0 then
      perform app.reject(app.reopen_blocked(v_blockers));
    end if;
    update app.routes
    set status = 'HOAT_DONG', closure_source = null, closure_reason = null, closed_at = null, closed_by_user_id = null,
        concurrency_revision = concurrency_revision + 1
    where route_id = p_route_id;
    perform app.audit(v_actor.user_id, 'ROUTE_REOPENED', 'ROUTE', p_route_id, 'SUCCESS', p_safety_note, null, null,
      '{"status": "TAM_DONG"}', '{"status": "HOAT_DONG"}');
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', 'HOAT_DONG', 'concurrencyRevision', v_route.concurrency_revision + 1));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'ROUTE_REOPENED', 'ROUTE', coalesce(p_route_id, ''), 'FAILURE', p_safety_note);
  return v_result;
end;
$$;

create function api.archive_route(p_route_id text, p_reason text default null, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_route app.routes;
  v_problem jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('R');
    perform app.lock_connected_set(jsonb_build_array(jsonb_build_object('key', 'route:' || p_route_id, 'name', app.route_name(p_route_id))));
    select * into v_route from app.routes where route_id = p_route_id for update;
    -- only a closed route; terminal; its checkpoints do not change (BR-M03-H09, T07)
    if v_route.status is distinct from 'TAM_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_route.concurrency_revision,
      app.entity_last_editor('ROUTE', p_route_id), v_route.updated_at);
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    update app.routes set status = 'LUU_TRU', concurrency_revision = concurrency_revision + 1 where route_id = p_route_id;
    perform app.audit(v_actor.user_id, 'ROUTE_ARCHIVED', 'ROUTE', p_route_id, 'SUCCESS', p_reason, null, null,
      '{"status": "TAM_DONG"}', '{"status": "LUU_TRU"}');
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', 'LUU_TRU', 'concurrencyRevision', v_route.concurrency_revision + 1));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'ROUTE_ARCHIVED', 'ROUTE', coalesce(p_route_id, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-10 close checkpoint, C-11 close the routes listing it, C-13 reopen checkpoint, C-15 archive checkpoint
-- ---------------------------------------------------------------------------

create function api.close_checkpoint(p_checkpoint_id text, p_reason text default null, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_checkpoint app.checkpoints;
  v_problem jsonb;
  v_affected text[];
  v_auto text[];
  v_route text;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    perform app.lock_connected_set(app.checkpoint_lock_items(p_checkpoint_id));
    select * into v_checkpoint from app.checkpoints where checkpoint_id = p_checkpoint_id for update;
    if v_checkpoint.status is distinct from 'HOAT_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_checkpoint.concurrency_revision,
      app.entity_last_editor('CHECKPOINT', p_checkpoint_id), v_checkpoint.updated_at);
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    select coalesce(array_agg(r.route_id order by r.route_id), '{}') into v_affected from app.affected_routes(p_checkpoint_id) r;
    v_auto := app.auto_closing_routes(p_checkpoint_id);
    update app.checkpoints
    set status = 'TAM_DONG', closure_reason = app.trim_text(p_reason), closed_at = now(), closed_by_user_id = v_actor.user_id,
        concurrency_revision = concurrency_revision + 1
    where checkpoint_id = p_checkpoint_id;
    -- the checkpoint leaves the journey of every listing route at once; never blocked by the ceiling (H02, X02, G10)
    perform app.commit_rebuilds(app.rebuild_routes(p_checkpoint_id));
    foreach v_route in array v_auto loop
      perform app.close_route_row(v_route, 'AUTO_NO_ACTIVE_CHECKPOINT', p_reason, v_actor.user_id);
    end loop;
    perform app.audit(v_actor.user_id, 'CHECKPOINT_CLOSED', 'CHECKPOINT', p_checkpoint_id, 'SUCCESS', p_reason, null, null,
      '{"status": "HOAT_DONG"}', jsonb_build_object('status', 'TAM_DONG',
        'affectedRoutes', (select coalesce(jsonb_agg(app.route_name(r) order by r), '[]') from unnest(v_affected) r)));
    -- each automatic route closure has its own audit line (BR-M03-H02 "with an audit line")
    foreach v_route in array v_auto loop
      perform app.audit(v_actor.user_id, 'ROUTE_AUTO_CLOSED', 'ROUTE', v_route, 'SUCCESS', p_reason, null, null,
        '{"status": "HOAT_DONG"}', '{"status": "TAM_DONG", "closureSource": "AUTO_NO_ACTIVE_CHECKPOINT"}');
    end loop;
    return app.cr_ok('MSG-SAVED', jsonb_build_object('autoClosedRoutes', app.route_refs(v_auto)));
  exception when others then
    -- the action to offer next is "close the related routes" (C-11)
    v_result := app.result_from_error(sqlstate, sqlerrm, 'MSG-CLOSE-FAILED');
  end;
  perform app.audit(auth.uid()::text, 'CHECKPOINT_CLOSED', 'CHECKPOINT', coalesce(p_checkpoint_id, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

-- When C-10 fails: close every HOAT_DONG route listing the checkpoint; the checkpoint stays active; one audit line
-- on the checkpoint naming the routes (BR-M03-H04, X06)
create function api.close_routes_listing_checkpoint(p_checkpoint_id text, p_reason text default null) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_problem jsonb;
  v_targets text[];
  v_route text;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    if not exists (select 1 from app.checkpoints where checkpoint_id = p_checkpoint_id) then
      perform app.reject(app.cr_failed());
    end if;
    select coalesce(array_agg(r.route_id order by r.route_id), '{}') into v_targets
    from app.affected_routes(p_checkpoint_id) r where r.status = 'HOAT_DONG';
    perform app.lock_connected_set(coalesce((select jsonb_agg(jsonb_build_object('key', 'route:' || r, 'name', app.route_name(r)))
                                             from unnest(v_targets) r), '[]'));
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    foreach v_route in array v_targets loop
      perform app.close_route_row(v_route, 'MANUAL', p_reason, v_actor.user_id);
    end loop;
    perform app.audit(v_actor.user_id, 'RELATED_ROUTES_CLOSED', 'CHECKPOINT', p_checkpoint_id, 'SUCCESS', p_reason, null, null, null,
      jsonb_build_object('affectedRoutes', (select coalesce(jsonb_agg(app.route_name(r) order by r), '[]') from unnest(v_targets) r)));
    return app.cr_ok('MSG-SAVED', jsonb_build_object('closedRoutes', app.route_refs(v_targets)));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'RELATED_ROUTES_CLOSED', 'CHECKPOINT', coalesce(p_checkpoint_id, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

create function api.reopen_checkpoint(p_checkpoint_id text, p_safety_note text default null, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_checkpoint app.checkpoints;
  v_problem jsonb;
  v_blockers text[];
  v_affected text[];
  v_rebuilds jsonb;
  v_impact jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('R');
    perform app.lock_connected_set(app.checkpoint_lock_items(p_checkpoint_id));
    select * into v_checkpoint from app.checkpoints where checkpoint_id = p_checkpoint_id for update;
    if v_checkpoint.status is distinct from 'TAM_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_checkpoint.concurrency_revision,
      app.entity_last_editor('CHECKPOINT', p_checkpoint_id), v_checkpoint.updated_at);
    v_problem := app.reason_problem(p_safety_note, true, 'Ghi chú xác nhận an toàn');
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    v_blockers := app.checkpoint_reopen_blockers(p_checkpoint_id);
    if cardinality(v_blockers) > 0 then
      perform app.reject(app.reopen_blocked(v_blockers));
    end if;
    select coalesce(array_agg(r.route_id order by r.route_id), '{}') into v_affected from app.affected_routes(p_checkpoint_id) r;
    update app.checkpoints
    set status = 'HOAT_DONG', closure_reason = null, closed_at = null, closed_by_user_id = null,
        concurrency_revision = concurrency_revision + 1
    where checkpoint_id = p_checkpoint_id;
    -- back into every listing route's journey; the ceiling applies; a closed route stays closed (H06, H07, G10)
    v_rebuilds := app.rebuild_routes(p_checkpoint_id);
    v_impact := app.rebuild_impact(v_rebuilds);
    if jsonb_typeof(v_impact -> 'size') = 'object' then
      perform app.reject(v_impact #> '{size,blocked}');
    end if;
    perform app.commit_rebuilds(v_rebuilds);
    perform app.audit(v_actor.user_id, 'CHECKPOINT_REOPENED', 'CHECKPOINT', p_checkpoint_id, 'SUCCESS', p_safety_note, null, null,
      '{"status": "TAM_DONG"}', jsonb_build_object('status', 'HOAT_DONG',
        'affectedRoutes', (select coalesce(jsonb_agg(app.route_name(r) order by r), '[]') from unnest(v_affected) r)));
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', 'HOAT_DONG', 'concurrencyRevision', v_checkpoint.concurrency_revision + 1));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'CHECKPOINT_REOPENED', 'CHECKPOINT', coalesce(p_checkpoint_id, ''), 'FAILURE', p_safety_note);
  return v_result;
end;
$$;

create function api.archive_checkpoint(p_checkpoint_id text, p_reason text default null, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_checkpoint app.checkpoints;
  v_problem jsonb;
  v_using text[];
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('R');
    perform app.lock_connected_set(jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || p_checkpoint_id,
      'name', app.checkpoint_name(p_checkpoint_id))));
    select * into v_checkpoint from app.checkpoints where checkpoint_id = p_checkpoint_id for update;
    if v_checkpoint.status is distinct from 'TAM_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_checkpoint.concurrency_revision,
      app.entity_last_editor('CHECKPOINT', p_checkpoint_id), v_checkpoint.updated_at);
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    -- no non-archived route may list it, draft lists included (BR-M03-D10)
    select coalesce(array_agg(r order by app.route_name(r)), '{}') into v_using from app.routes_listing(p_checkpoint_id) r;
    if cardinality(v_using) > 0 then
      perform app.reject(app.cr_blocked('MSG-CHECKPOINT-IN-USE', jsonb_build_object('danh sách',
        (select string_agg(app.route_name(r), ', ' order by n) from unnest(v_using) with ordinality u(r, n)))));
    end if;
    -- it left every journey when it closed: no new version; its visit points are revoked
    update app.qr_codes set status = 'THU_HOI', concurrency_revision = concurrency_revision + 1
    where checkpoint_id = p_checkpoint_id and status <> 'THU_HOI';
    update app.checkpoints set status = 'LUU_TRU', concurrency_revision = concurrency_revision + 1 where checkpoint_id = p_checkpoint_id;
    perform app.audit(v_actor.user_id, 'CHECKPOINT_ARCHIVED', 'CHECKPOINT', p_checkpoint_id, 'SUCCESS', p_reason, null, null,
      '{"status": "TAM_DONG"}', '{"status": "LUU_TRU"}');
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', 'LUU_TRU', 'concurrencyRevision', v_checkpoint.concurrency_revision + 1));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'CHECKPOINT_ARCHIVED', 'CHECKPOINT', coalesce(p_checkpoint_id, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Q-09 impact of a close or reopen (reopen: Reviewer only)
-- ---------------------------------------------------------------------------

create function api.get_operation_impact(p_operation text, p_subject_id text) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_admin app.admin_accounts := app.require_reader();
  v_route app.routes;
  v_affected text[];
begin
  if p_operation like 'REOPEN_%' and v_admin.role <> 'REVIEWER' then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  if p_operation in ('CLOSE_ROUTE', 'REOPEN_ROUTE') then
    select * into v_route from app.routes where route_id = p_subject_id;
    if v_route.route_id is null then
      raise exception 'not found' using errcode = 'no_data_found';
    end if;
    return jsonb_build_object('affectedRoutes', '[]'::jsonb, 'autoClosingRoutes', '[]'::jsonb,
      'reopenBlockers', case when p_operation = 'REOPEN_ROUTE' then to_jsonb(
        (select coalesce(array_agg(b order by n), '{}') from (
          select b, min(n) as n from unnest(
            case when coalesce((select jsonb_array_length(s.checkpoints) from app.journey_snapshots s
                                where s.route_id = p_subject_id and s.content_version = v_route.active_content_version), 0) = 0
                 then array[app.render_message('MSG-NO-ACTIVE-CHECKPOINT')] else '{}'::text[] end
            || app.route_reopen_blockers(p_subject_id)) with ordinality u(b, n) group by b) d))
        else '[]'::jsonb end);
  end if;
  if p_operation not in ('CLOSE_CHECKPOINT', 'REOPEN_CHECKPOINT')
     or not exists (select 1 from app.checkpoints where checkpoint_id = p_subject_id) then
    raise exception 'not found' using errcode = 'no_data_found';
  end if;
  select coalesce(array_agg(r.route_id order by r.route_id), '{}') into v_affected from app.affected_routes(p_subject_id) r;
  return jsonb_build_object(
    'affectedRoutes', app.route_refs(v_affected),
    'autoClosingRoutes', case when p_operation = 'CLOSE_CHECKPOINT' then app.route_refs(app.auto_closing_routes(p_subject_id)) else '[]'::jsonb end,
    'reopenBlockers', case when p_operation = 'REOPEN_CHECKPOINT' then to_jsonb(app.checkpoint_reopen_blockers(p_subject_id)) else '[]'::jsonb end);
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (admin-command §7: close for both roles; reopen and archive checked as Reviewer inside)
-- ---------------------------------------------------------------------------
grant execute on function api.close_route(text, text, jsonb) to authenticated;
grant execute on function api.reopen_route(text, text, jsonb) to authenticated;
grant execute on function api.archive_route(text, text, jsonb) to authenticated;
grant execute on function api.close_checkpoint(text, text, jsonb) to authenticated;
grant execute on function api.close_routes_listing_checkpoint(text, text) to authenticated;
grant execute on function api.reopen_checkpoint(text, text, jsonb) to authenticated;
grant execute on function api.archive_checkpoint(text, text, jsonb) to authenticated;
grant execute on function api.get_operation_impact(text, text) to authenticated;
