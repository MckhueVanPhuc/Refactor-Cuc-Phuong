-- M03 migration 3e — publishing revisions of published items (tasks M03 T186; admin-command C-05, Q-08;
-- publication-public-contract §4; research R-08, R-10; BR-M03-B05, C05, C09, C15, C16, D04, D06, F02–F06, G03–G06,
-- G10, T03, T05, T06, X02, X03).
-- Adds the ROUTE_INFORMATION and CHECKPOINT_REVISION units. The units of migration 3d keep their code: the
-- dispatcher below calls them under their new name.

alter function app.publication_unit(text, text, text, boolean, integer, boolean) rename to publication_unit_first;

-- Images of the given visit points' *published* content that are no longer in Storage (BR-M03-D04 condition 4 when
-- a checkpoint switches to OFFLINE_REQUIRED)
create function app.unreadable_published_images(p_qr_identifiers text[]) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce((
    select jsonb_agg(app.issue('BLOCKS_PUBLISH', 'QRCODE', i.qr, 'images.' || (i.k - 1), 'MSG-IMAGE-NOT-READABLE',
      jsonb_build_object('tên tệp', app.visit_point_name(i.name, app.qr_creation_order(i.qr)) || ' – ảnh ' || i.k)) order by i.qord, i.k)
    from (select q.qr, q.qord, m.source_ref, p.content #>> '{objectName,vi}' as name,
                 row_number() over (partition by q.qr order by x.n) as k
          from unnest(p_qr_identifiers) with ordinality q(qr, qord)
          cross join lateral (select (app.published_of('QRCODE', q.qr)).content as content) p
          cross join lateral jsonb_array_elements(coalesce(p.content -> 'mediaItems', '[]')) with ordinality x(e, n)
          join app.media m on m.media_id::text = x.e ->> 'mediaId' and m.type = 'IMAGE') i
    where not exists (select 1 from storage.objects o where o.bucket_id = 'quest-media' and o.name = i.source_ref)), '[]'::jsonb)
$$;

-- ROUTE_INFORMATION: a published route's pending draft (information and checkpoint list). A new journey version only
-- when the journey changes: list, order, offline map (BR-M03-C15, C16, T06, G04, G05).
create function app.route_information_unit(
  p_subject_id text, p_actor text, p_publish boolean, p_reviewed integer, p_no_safety boolean
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_route app.routes;
  v_draft app.revisions;
  v_published app.revisions;
  v_before jsonb;
  v_after jsonb;
  v_listed text[];
  v_parts integer;
  v_revision integer;
  v_name text;
  v_journey jsonb;
  v_changed boolean;
  v_issues jsonb;
  v_last_removed boolean;
  v_size jsonb;
  v_safety boolean;
  v_changes jsonb;
  v_review jsonb;
  v_versions jsonb := '[]';
begin
  select * into v_route from app.routes where route_id = p_subject_id;
  v_draft := app.draft_of('ROUTE', p_subject_id);
  if v_route.route_id is null or v_draft.revision_id is null or v_route.status not in ('HOAT_DONG', 'TAM_DONG') then
    raise exception 'publication unit not found' using errcode = 'no_data_found';
  end if;
  v_before := (app.published_of('ROUTE', p_subject_id)).content;
  v_after := v_draft.content;
  -- connected set: the route and every checkpoint of its published and draft lists (BR-M03-F05; R-08)
  select coalesce(array_agg(k.checkpoint_id order by k.checkpoint_id), '{}'), coalesce(sum(k.concurrency_revision), 0)
    into v_listed, v_parts
  from app.checkpoints k
  where k.checkpoint_id in (
    select c ->> 'checkpointId' from jsonb_array_elements(coalesce(v_before -> 'checkpointList', '[]') || coalesce(v_after -> 'checkpointList', '[]')) c);
  if p_publish then
    perform app.lock_connected_set(
      jsonb_build_array(jsonb_build_object('key', 'route:' || p_subject_id, 'name', coalesce(app.trim_text(v_before #>> '{name,vi}'), '')))
      || coalesce((select jsonb_agg(jsonb_build_object('key', 'checkpoint:' || k, 'name', app.checkpoint_name(k))) from unnest(v_listed) k), '[]'));
  end if;
  v_revision := v_route.concurrency_revision + v_draft.concurrency_revision + v_parts;
  v_name := coalesce(app.trim_text(v_after #>> '{name,vi}'), '');
  v_journey := app.build_journey(p_subject_id, v_after);
  v_changed := (v_journey -> 'candidate') is distinct from app.active_journey(p_subject_id);
  -- the "no warning" tick is on the review; a lost last active checkpoint is its own BLOCKED (BR-M03-C09, T05)
  v_issues := coalesce((select jsonb_agg(i order by n) from jsonb_array_elements(app.route_publish_issues(p_subject_id, v_after))
                        with ordinality x(i, n) where i ->> 'messageKey' not in ('MSG-SAFETY-CONFIRM', 'MSG-NO-ACTIVE-CHECKPOINT')), '[]');
  v_last_removed := v_route.status = 'HOAT_DONG' and jsonb_array_length(v_journey #> '{candidate,checkpoints}') = 0;
  if v_changed and (v_journey ->> 'sizeBytes')::bigint > app.limit('OFFLINE_PACKAGE_MAX_MB')::bigint * app.limit('BYTES_PER_MB') then
    v_size := app.size_block(p_subject_id, v_name, v_journey);
  end if;
  v_safety := not app.has_text(v_after -> 'safetyWarning') and (v_after ->> 'noSafetyWarningConfirmed')::boolean is not true;
  v_changes := app.route_changes(v_before, v_after);
  v_review := app.empty_review('ROUTE_INFORMATION', v_revision) || jsonb_build_object(
    'blockingIssues', v_issues || case when v_size is null then '[]'::jsonb else jsonb_build_array(v_size -> 'issue') end,
    'noSafetyWarningConfirmationRequired', v_safety,
    'leftOutCheckpoints', v_journey -> 'leftOut',
    'affectedRoutes', jsonb_build_array(jsonb_build_object('routeId', p_subject_id, 'routeName', v_name, 'routeStatus', v_route.status,
      'createsNewJourneyVersion', v_changed, 'estimatedOfflineSizeBytes', (v_journey ->> 'sizeBytes')::bigint, 'closesAutomatically', false)),
    'changes', v_changes,
    'sensitiveChanges', app.sensitive_changes(v_changes));
  if not p_publish then
    return jsonb_build_object('review', v_review);
  end if;
  if p_reviewed is distinct from v_revision then
    perform app.reject(app.stale_for('ROUTE', p_subject_id, v_route.updated_at, v_draft));
  end if;
  if jsonb_array_length(v_issues) > 0 then
    perform app.reject(app.cr_validation(v_issues));
  end if;
  if v_last_removed then
    perform app.reject(app.cr_blocked('MSG-ROUTE-LAST-CHECKPOINT'));
  end if;
  if v_size is not null then
    perform app.reject(v_size -> 'blocked');
  end if;
  if v_safety and p_no_safety is not true then
    perform app.reject(app.cr_blocked('MSG-SAFETY-CONFIRM'));
  end if;
  if v_safety then
    update app.revisions set content = content || '{"noSafetyWarningConfirmed": true}', concurrency_revision = concurrency_revision + 1
    where revision_id = v_draft.revision_id;
  end if;
  v_published := app.promote_draft('ROUTE', p_subject_id, p_actor);
  if v_changed then
    v_versions := jsonb_build_array(jsonb_build_object('routeId', p_subject_id,
      'contentVersion', app.commit_snapshot(p_subject_id, v_journey -> 'candidate')));
  else
    update app.routes set concurrency_revision = concurrency_revision + 1 where route_id = p_subject_id;
  end if;
  return jsonb_build_object('review', v_review, 'subjectType', 'ROUTE',
    'revisionNumber', v_published.revision_number, 'selfPublished', v_published.self_published,
    'data', jsonb_build_object('publishedRevisionNumber', v_published.revision_number, 'newJourneyVersions', v_versions));
end;
$$;

-- CHECKPOINT_REVISION: name or mode of a published checkpoint (BR-M03-D06, G04, X02, X03, B05). Every route listing it
-- is rebuilt with the new content; a mode change reminds to reprint the visit points.
create function app.checkpoint_revision_unit(p_subject_id text, p_actor text, p_publish boolean, p_reviewed integer) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_checkpoint app.checkpoints;
  v_draft app.revisions;
  v_published app.revisions;
  v_before jsonb;
  v_after jsonb;
  v_active text[];
  v_routes text[];
  v_parts integer;
  v_revision integer;
  v_name text;
  v_issues jsonb;
  v_rebuilds jsonb;
  v_impact jsonb;
  v_review jsonb;
  v_mode_changed boolean;
begin
  select * into v_checkpoint from app.checkpoints where checkpoint_id = p_subject_id;
  v_draft := app.draft_of('CHECKPOINT', p_subject_id);
  if v_checkpoint.checkpoint_id is null or v_draft.revision_id is null or v_checkpoint.status not in ('HOAT_DONG', 'TAM_DONG') then
    raise exception 'publication unit not found' using errcode = 'no_data_found';
  end if;
  v_before := coalesce((app.published_of('CHECKPOINT', p_subject_id)).content, '{}');
  v_after := v_draft.content;
  select coalesce(array_agg(q.qr_identifier order by q.created_at, q.qr_identifier), '{}') into v_active
  from app.qr_codes q where q.checkpoint_id = p_subject_id and q.status = 'HOAT_DONG';
  select coalesce(array_agg(r.route_id order by r.route_id), '{}'), coalesce(sum(r.concurrency_revision), 0)
    into v_routes, v_parts
  from app.affected_routes(p_subject_id) r;
  -- MSG-ROUTE-BUSY names the checkpoint by its public name, not the draft one
  if p_publish then
    perform app.lock_connected_set(
      jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || p_subject_id,
        'name', coalesce(app.trim_text(v_before #>> '{checkpointName,vi}'), app.checkpoint_name(p_subject_id))))
      || coalesce((select jsonb_agg(jsonb_build_object('key', 'route:' || r,
           'name', coalesce((app.published_of('ROUTE', r)).content #>> '{name,vi}', ''))) from unnest(v_routes) r), '[]'));
  end if;
  v_revision := v_checkpoint.concurrency_revision + v_draft.concurrency_revision + v_parts;
  v_name := coalesce(nullif(app.trim_text(v_after #>> '{checkpointName,vi}'), ''), app.checkpoint_name(p_subject_id));
  v_mode_changed := (v_before ->> 'connectivityMode') is distinct from (v_after ->> 'connectivityMode');
  v_issues := app.check_required_bilingual('CHECKPOINT', p_subject_id, 'checkpointName', v_after -> 'checkpointName')
    || app.check_required('CHECKPOINT', p_subject_id, 'connectivityMode', v_after -> 'connectivityMode')
    || case when cardinality(v_active) = 0 then jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'CHECKPOINT', p_subject_id, 'visitPoints',
         'MSG-MISSING-FIELD', jsonb_build_object('tên ô', 'ít nhất một điểm tham quan sẵn sàng'))) else '[]'::jsonb end
    -- switching to OFFLINE_REQUIRED: the images of every active visit point must be readable (BR-M03-D04 condition 4)
    || case when v_after ->> 'connectivityMode' = 'OFFLINE_REQUIRED' then app.unreadable_published_images(v_active) else '[]'::jsonb end;
  if p_publish then
    if p_reviewed is distinct from v_revision then
      perform app.reject(app.stale_for('CHECKPOINT', p_subject_id, v_checkpoint.updated_at, v_draft));
    end if;
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.cr_validation(v_issues));
    end if;
  end if;
  -- the journeys after publication (the review rolls this back)
  v_published := app.promote_draft('CHECKPOINT', p_subject_id, p_actor);
  update app.checkpoints set concurrency_revision = concurrency_revision + 1 where checkpoint_id = p_subject_id;
  v_rebuilds := app.rebuild_routes(p_subject_id);
  v_impact := app.rebuild_impact(v_rebuilds);
  v_review := app.empty_review('CHECKPOINT_REVISION', v_revision) || jsonb_build_object(
    'blockingIssues', v_issues || case when jsonb_typeof(v_impact -> 'size') = 'object' then jsonb_build_array(v_impact #> '{size,issue}') else '[]'::jsonb end,
    'changes', app.text_changes('CHECKPOINT', 'checkpointName', v_before -> 'checkpointName', v_after -> 'checkpointName')
      || case when v_mode_changed and v_after ? 'connectivityMode' then app.change_line(app.field_label('CHECKPOINT', 'connectivityMode'),
           coalesce(app.display_name('connectivityMode', v_before ->> 'connectivityMode'), ''),
           app.display_name('connectivityMode', v_after ->> 'connectivityMode')) else '[]'::jsonb end,
    'affectedRoutes', v_impact -> 'affectedRoutes',
    -- the instruction line printed on the label depends on the mode (BR-M03-B05)
    'impactNotes', (v_impact -> 'notes')
      || case when v_mode_changed then jsonb_build_array(app.render_message('MSG-REPRINT-MODE-CHANGED', jsonb_build_object('tên', v_name)))
         else '[]'::jsonb end);
  if not p_publish then
    return jsonb_build_object('review', v_review);
  end if;
  if jsonb_typeof(v_impact -> 'size') = 'object' then
    perform app.reject(v_impact #> '{size,blocked}');
  end if;
  return jsonb_build_object('review', v_review, 'subjectType', 'CHECKPOINT',
    'revisionNumber', v_published.revision_number, 'selfPublished', v_published.self_published,
    'data', jsonb_build_object('publishedRevisionNumber', v_published.revision_number,
      'newJourneyVersions', app.commit_rebuilds(v_rebuilds)));
end;
$$;

-- Dispatcher used by api.open_publication_review and api.publish_unit (migration 3d)
create function app.publication_unit(
  p_unit_type text, p_subject_id text, p_actor text, p_publish boolean,
  p_reviewed integer default null, p_no_safety boolean default null
) returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  return case p_unit_type
    when 'ROUTE_INFORMATION' then app.route_information_unit(p_subject_id, p_actor, p_publish, p_reviewed, p_no_safety)
    when 'CHECKPOINT_REVISION' then app.checkpoint_revision_unit(p_subject_id, p_actor, p_publish, p_reviewed)
    else app.publication_unit_first(p_unit_type, p_subject_id, p_actor, p_publish, p_reviewed, p_no_safety)
  end;
end;
$$;
