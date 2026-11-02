-- M03 migration 3g — discard, restore, item history, audit log (tasks M03 T192; admin-command C-06, C-08, Q-10, Q-11;
-- research R-27; BR-M03-A03, F06–F10, L10, L11, X06; SC-M03-014, 021).
-- Audit lines are shown in plain words: "{label}: {before} → {after}", display names of §5.4, the routes a checkpoint
-- operation affected; never JSON, codes or ids (Q-11 carries `subjectId` only to build a link, admin-command Q-11).

-- Display names used by history and audit (spec-M03 §5.4) — copy of displayNames.ts, kept equal by sqlCatalog.test.ts
create or replace function app.display_name(p_kind text, p_code text) returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select d.name from (values
    ('difficulty', 'NHE', 'Nhẹ'),
    ('difficulty', 'TRUNG_BINH', 'Trung bình'),
    ('difficulty', 'KHO', 'Khó'),
    ('groupTag', 'GROUP_CA_NHAN_NGUOI_LON', 'Cá nhân/người lớn'),
    ('groupTag', 'GROUP_GIA_DINH_CO_TRE', 'Gia đình có trẻ nhỏ'),
    ('groupTag', 'GROUP_CAN_DE_DANG', 'Cần đi dễ dàng'),
    ('experienceTag', 'INTEREST_THIEN_NHIEN_CHUP_ANH', 'Thiên nhiên, chụp ảnh'),
    ('experienceTag', 'INTEREST_TIM_HIEU', 'Tìm hiểu'),
    ('experienceTag', 'INTEREST_KHAM_PHA', 'Khám phá'),
    ('connectivityMode', 'OFFLINE_REQUIRED', 'Cần tải trước'),
    ('connectivityMode', 'ONLINE_AVAILABLE', 'Dùng được khi có mạng'),
    ('routeStatus', 'NHAP', 'Nháp'),
    ('routeStatus', 'HOAT_DONG', 'Đang hoạt động'),
    ('routeStatus', 'TAM_DONG', 'Tạm đóng'),
    ('routeStatus', 'LUU_TRU', 'Đã lưu trữ'),
    ('checkpointStatus', 'NHAP', 'Nháp'),
    ('checkpointStatus', 'HOAT_DONG', 'Đang hoạt động'),
    ('checkpointStatus', 'TAM_DONG', 'Tạm đóng'),
    ('checkpointStatus', 'LUU_TRU', 'Đã lưu trữ'),
    ('qrStatus', 'NHAP', 'Nháp'),
    ('qrStatus', 'HOAT_DONG', 'Đang hoạt động'),
    ('qrStatus', 'THU_HOI', 'Đã thu hồi'),
    ('revisionStatus', 'NHAP', 'Bản nháp'),
    ('revisionStatus', 'PHAT_HANH', 'Đã xuất bản'),
    ('revisionStatus', 'LUU_TRU', 'Bản cũ'),
    ('revisionStatus', 'DA_BO', 'Đã bỏ'),
    ('role', 'REVIEWER', 'Quản lý'),
    ('role', 'CONTENT_STAFF', 'Nhân viên nội dung'),
    ('accountStatus', 'INVITATION_PENDING', 'Chờ nhận lời mời'),
    ('accountStatus', 'ACTIVE', 'Đang hoạt động'),
    ('accountStatus', 'DEACTIVATED', 'Đã khóa'),
    ('closureSource', 'MANUAL', 'Đóng thủ công'),
    ('closureSource', 'AUTO_NO_ACTIVE_CHECKPOINT', 'Tự đóng vì không còn điểm dừng hoạt động')
  ) as d(kind, code, name)
  where d.kind = p_kind and d.code = p_code
$$;

-- ---------------------------------------------------------------------------
-- Audit rows in plain words (history/auditFormat.ts)
-- ---------------------------------------------------------------------------

create function app.audit_change_lines(p_row app.audit_records) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_lines text[] := '{}';
  v_kind text := case p_row.entity_type when 'ACCOUNT' then 'accountStatus' when 'QRCODE' then 'qrStatus'
                   when 'CHECKPOINT' then 'checkpointStatus' else 'routeStatus' end;
begin
  if p_row.outcome <> 'SUCCESS' then
    return '[]';
  end if;
  -- publication: one line per changed field, an empty side shown as "—"
  select v_lines || coalesce(array_agg((c ->> 'fieldLabel') || ': ' || coalesce(nullif(c ->> 'before', ''), '—') || ' → '
                                       || coalesce(nullif(c ->> 'after', ''), '—') order by n), '{}')
    into v_lines
  from jsonb_array_elements(coalesce(p_row.after_state -> 'changes', '[]')) with ordinality x(c, n);
  if p_row.before_state ? 'status' and p_row.after_state ? 'status' then
    v_lines := v_lines || ('Trạng thái: ' || app.display_name(v_kind, p_row.before_state ->> 'status') || ' → '
                           || app.display_name(v_kind, p_row.after_state ->> 'status'));
  end if;
  if p_row.before_state ? 'role' and p_row.after_state ? 'role' then
    v_lines := v_lines || ('Vai trò: ' || app.display_name('role', p_row.before_state ->> 'role') || ' → '
                           || app.display_name('role', p_row.after_state ->> 'role'));
  end if;
  if p_row.after_state ? 'closureSource' then
    v_lines := v_lines || app.display_name('closureSource', p_row.after_state ->> 'closureSource');
  end if;
  v_lines := v_lines || coalesce((select array_agg(l #>> '{}' order by n)
                                  from jsonb_array_elements(coalesce(p_row.after_state -> 'lines', '[]')) with ordinality x(l, n)), '{}');
  -- every operation at a checkpoint names the routes it affected (BR-M03-X06)
  if p_row.entity_type <> 'ROUTE' and jsonb_array_length(coalesce(p_row.after_state -> 'affectedRoutes', '[]')) > 0 then
    v_lines := v_lines || ('Tuyến bị ảnh hưởng: ' || (select string_agg(r #>> '{}', ', ' order by n)
                           from jsonb_array_elements(p_row.after_state -> 'affectedRoutes') with ordinality x(r, n)));
  end if;
  return to_jsonb(v_lines);
end;
$$;

-- Name of the item as shown now (route/checkpoint/visit point/account; a file by its owner)
create function app.audit_subject_name(p_type text, p_id text) returns text
language sql stable
set search_path = ''
as $$
  select nullif(case p_type
    when 'ROUTE' then app.route_name(p_id)
    when 'CHECKPOINT' then app.checkpoint_name(p_id)
    when 'QRCODE' then case when exists (select 1 from app.qr_codes where qr_identifier = p_id) then app.qr_display_name(p_id) end
    when 'ACCOUNT' then p_id
    when 'MEDIA' then (select case m.owner_type when 'ROUTE' then app.route_name(m.owner_id) else app.checkpoint_name(m.owner_id) end
                       from app.media m where m.media_id::text = p_id)
  end, '')
$$;

create function app.audit_row(p_row app.audit_records, p_with_subject_id boolean) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
      'auditId', p_row.audit_id,
      'action', p_row.action,
      'result', p_row.outcome,
      'actorEmail', app.user_email(p_row.actor_user_id),
      'occurredAt', app.iso(p_row.occurred_at),
      'subjectType', p_row.entity_type,
      'changeLines', app.audit_change_lines(p_row))
    || app.jsonb_opt('subjectId', case when p_with_subject_id then to_jsonb(nullif(p_row.entity_id, '')) end)
    || app.jsonb_opt('subjectName', to_jsonb(case when p_row.entity_id <> '' then app.audit_subject_name(p_row.entity_type, p_row.entity_id) end))
    || app.jsonb_opt('reason', to_jsonb(p_row.reason))
    || app.jsonb_opt('selfPublished', to_jsonb(p_row.self_published))
$$;

-- ---------------------------------------------------------------------------
-- C-16 revoke a visit point: same command, its audit line now names the affected routes (BR-M03-X06; D-107)
-- ---------------------------------------------------------------------------

create or replace function api.revoke_visit_point(p_qr_identifier text, p_reason text default null, p_expected jsonb default '{}')
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_qr app.qr_codes;
  v_checkpoint app.checkpoints;
  v_problem jsonb;
  v_affected jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier;
    if v_qr.qr_identifier is null then
      perform app.reject(app.cr_failed());
    end if;
    -- the checkpoint and every route listing it form the connected set (R-08)
    perform app.lock_connected_set(
      jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || v_qr.checkpoint_id, 'name', app.checkpoint_name(v_qr.checkpoint_id)))
      || coalesce((select jsonb_agg(jsonb_build_object('key', 'route:' || r, 'name', app.route_name(r)))
                   from app.routes_listing(v_qr.checkpoint_id) as r), '[]'));
    select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier for update;
    select * into v_checkpoint from app.checkpoints where checkpoint_id = v_qr.checkpoint_id for update;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_qr.concurrency_revision,
      app.entity_last_editor('QRCODE', p_qr_identifier), v_qr.updated_at);
    if v_qr.status <> 'HOAT_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    -- an active checkpoint always keeps one active visit point (BR-M03-E11)
    if v_checkpoint.status = 'HOAT_DONG' and (select count(*) from app.qr_codes q
        where q.checkpoint_id = v_checkpoint.checkpoint_id and q.status = 'HOAT_DONG') <= 1 then
      perform app.reject(app.cr_blocked('MSG-LAST-QR'));
    end if;
    select coalesce(jsonb_agg(app.route_name(r.route_id) order by app.route_name(r.route_id), r.route_id), '[]') into v_affected
    from app.affected_routes(v_checkpoint.checkpoint_id) r;

    update app.qr_codes set status = 'THU_HOI', status_reason = app.trim_text(p_reason),
      concurrency_revision = concurrency_revision + 1
    where qr_identifier = p_qr_identifier
    returning * into v_qr;
    perform app.rebuild_after_visit_point_change(v_checkpoint.checkpoint_id);

    perform app.audit(v_actor.user_id, 'QR_REVOKED', 'QRCODE', p_qr_identifier, 'SUCCESS', p_reason, null, null,
      jsonb_build_object('status', 'HOAT_DONG'), jsonb_build_object('status', 'THU_HOI', 'affectedRoutes', v_affected));
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', v_qr.status, 'concurrencyRevision', v_qr.concurrency_revision));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'QR_REVOKED', 'QRCODE', coalesce(p_qr_identifier, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-06 discard the pending draft of a published item (BR-M03-F10)
-- ---------------------------------------------------------------------------

-- Concurrency state of an entity row: (concurrency_revision, updated_at, status)
create function app.entity_state(p_type text, p_id text, out concurrency_revision integer, out updated_at timestamptz, out status text)
language sql stable
set search_path = ''
as $$
  select r.concurrency_revision, r.updated_at, r.status from app.routes r where p_type = 'ROUTE' and r.route_id = p_id
  union all
  select c.concurrency_revision, c.updated_at, c.status from app.checkpoints c where p_type = 'CHECKPOINT' and c.checkpoint_id = p_id
  union all
  select q.concurrency_revision, q.updated_at, q.status from app.qr_codes q where p_type = 'QRCODE' and q.qr_identifier = p_id
$$;

create function app.touch_entity(p_type text, p_id text) returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_type = 'ROUTE' then
    update app.routes set concurrency_revision = concurrency_revision + 1 where route_id = p_id;
  elsif p_type = 'CHECKPOINT' then
    update app.checkpoints set concurrency_revision = concurrency_revision + 1 where checkpoint_id = p_id;
  else
    update app.qr_codes set concurrency_revision = concurrency_revision + 1 where qr_identifier = p_id;
  end if;
end;
$$;

create function api.discard_draft(p_subject_type text, p_subject_id text, p_expected jsonb default '{}') returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_entity record;
  v_draft app.revisions;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    select * into v_entity from app.entity_state(p_subject_type, p_subject_id);
    v_draft := app.draft_of(p_subject_type, p_subject_id);
    -- only the pending draft of a published item; a never-published item uses "Hủy" (C-07)
    if v_entity.concurrency_revision is null or v_draft.revision_id is null
       or (app.published_of(p_subject_type, p_subject_id)).revision_id is null then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_entity(p_expected, p_subject_type, p_subject_id, v_entity.concurrency_revision, v_entity.updated_at, v_draft);
    update app.revisions set status = 'DA_BO', concurrency_revision = concurrency_revision + 1 where revision_id = v_draft.revision_id;
    perform app.touch_entity(p_subject_type, p_subject_id);
    perform app.audit(v_actor.user_id, 'DRAFT_DISCARDED', p_subject_type, p_subject_id, 'SUCCESS', null, v_draft.revision_number, null, null,
      jsonb_build_object('lines', jsonb_build_array('Bản ' || v_draft.revision_number || ': '
        || app.display_name('revisionStatus', 'NHAP') || ' → ' || app.display_name('revisionStatus', 'DA_BO'))));
    return app.cr_ok('MSG-SAVED');
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'DRAFT_DISCARDED', coalesce(p_subject_type, ''), coalesce(p_subject_id, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-08 restore an earlier published revision as a new draft (BR-M03-F07; R-27)
-- ---------------------------------------------------------------------------

-- Current limits on old content: the same checks as saving a draft
create function app.restore_issues(p_type text, p_id text, p_content jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_qr app.qr_codes;
begin
  if p_type = 'ROUTE' then
    return app.route_save_issues(p_id, app.normalize_route_content(p_content));
  elsif p_type = 'CHECKPOINT' then
    return app.checkpoint_save_issues(p_id, p_content, (select location_note from app.checkpoints where checkpoint_id = p_id))
      || app.checkpoint_name_taken(p_id, p_content #>> '{checkpointName,vi}');
  end if;
  select * into v_qr from app.qr_codes where qr_identifier = p_id;
  return app.visit_point_save_issues(p_id, app.visit_point_name(p_content #>> '{objectName,vi}', app.qr_creation_order(p_id)),
    app.checkpoint_name(v_qr.checkpoint_id), app.checkpoint_saved_mode(v_qr.checkpoint_id), p_content, v_qr.installation_label,
    app.qr_media_list(p_content));
end;
$$;

create function app.restore_blocked(p_places text[]) returns jsonb
language sql immutable
set search_path = ''
as $$
  select app.cr_blocked('MSG-RESTORE-BLOCKED', jsonb_build_object('danh sách chỗ cần sửa',
    (select string_agg(p, ', ' order by n) from (select p, min(n) as n from unnest(p_places) with ordinality u(p, n) group by p) d)))
$$;

create function api.restore_revision(p_subject_type text, p_subject_id text, p_revision_number integer) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_entity record;
  v_old app.revisions;
  v_issues jsonb;
  v_new app.revisions;
  v_detail text;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    select * into v_entity from app.entity_state(p_subject_type, p_subject_id);
    select * into v_old from app.revisions
    where subject_type = p_subject_type and subject_id = p_subject_id and revision_number = p_revision_number and status = 'LUU_TRU';
    -- only an earlier published revision (now "Bản cũ") of an item that is not archived or revoked
    if v_entity.status is null or v_entity.status in ('LUU_TRU', 'THU_HOI') or v_old.revision_id is null then
      perform app.reject(app.cr_failed());
    end if;
    if (app.draft_of(p_subject_type, p_subject_id)).revision_id is not null then
      perform app.reject(app.cr_blocked('MSG-DRAFT-EXISTS'));
    end if;
    v_issues := app.restore_issues(p_subject_type, p_subject_id, v_old.content);
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.restore_blocked(array(select i ->> 'fieldLabel' from jsonb_array_elements(v_issues) i)));
    end if;
    -- the copy goes through the content trigger: a limit tightened since then refuses it and nothing is created (R-27)
    begin
      insert into app.revisions (subject_type, subject_id, revision_number, content, based_on_revision_number,
                                 created_by_user_id, last_edited_by_user_id)
      values (p_subject_type, p_subject_id,
              (select max(r.revision_number) from app.revisions r where r.subject_type = p_subject_type and r.subject_id = p_subject_id) + 1,
              v_old.content, p_revision_number, v_actor.user_id, v_actor.user_id)
      returning * into v_new;
    exception when check_violation then
      get stacked diagnostics v_detail = pg_exception_detail;
      if sqlerrm <> 'REVISION_CONTENT_INVALID' then
        raise;
      end if;
      perform app.reject(app.restore_blocked(array(
        select coalesce(app.field_label(p_subject_type, k #>> '{}'), k #>> '{}') from jsonb_array_elements(v_detail::jsonb) k)));
    end;
    perform app.touch_entity(p_subject_type, p_subject_id);
    perform app.audit(v_actor.user_id, 'REVISION_RESTORED', p_subject_type, p_subject_id, 'SUCCESS', null, v_new.revision_number, null, null,
      jsonb_build_object('lines', jsonb_build_array('Bản nháp mới dựa trên bản ' || p_revision_number)));
    return app.cr_ok('MSG-SAVED', jsonb_build_object('revisionNumber', v_new.revision_number, 'basedOnRevisionNumber', p_revision_number));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'REVISION_RESTORED', coalesce(p_subject_type, ''), coalesce(p_subject_id, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Q-10 history of one item, Q-11 system-wide audit log (Reviewer only)
-- ---------------------------------------------------------------------------

create function api.get_item_history(p_subject_type text, p_subject_id text) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_reader();
  return jsonb_build_object(
    -- published revisions only (a discarded draft is not history of publication), newest first (BR-M03-F09)
    'publishedRevisions', coalesce((
      select jsonb_agg(app.editor_revision(r) - 'content' order by r.revision_number desc)
      from app.revisions r
      where r.subject_type = p_subject_type and r.subject_id = p_subject_id and r.status in ('PHAT_HANH', 'LUU_TRU')
        and r.published_at is not null), '[]'),
    'auditRows', coalesce((
      select jsonb_agg(app.audit_row(a, false) order by a.occurred_at desc, a.audit_id desc)
      from app.audit_records a where a.entity_type = p_subject_type and a.entity_id = p_subject_id), '[]'));
end;
$$;

create function api.list_audit_log(
  p_page integer default 0, p_from timestamptz default null, p_to timestamptz default null,
  p_actor_email text default null, p_subject_type text default null
) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  c_page_size constant integer := 50;
  v_page integer := greatest(coalesce(p_page, 0), 0);
  v_rows jsonb;
begin
  if (app.current_admin()).role is distinct from 'REVIEWER' then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  select coalesce(jsonb_agg(app.audit_row(x, true) order by x.occurred_at desc, x.audit_id desc), '[]') into v_rows
  from (select a.* from app.audit_records a
        where (p_from is null or a.occurred_at >= p_from)
          and (p_to is null or a.occurred_at < p_to)
          and (p_subject_type is null or a.entity_type = p_subject_type)
          and (nullif(app.normalize_name(p_actor_email), '') is null
               or position(app.normalize_name(p_actor_email) in app.user_email(a.actor_user_id)) > 0)
        order by a.occurred_at desc, a.audit_id desc
        offset v_page * c_page_size limit c_page_size + 1) x;
  return jsonb_build_object(
    'rows', coalesce((select jsonb_agg(r order by n) from jsonb_array_elements(v_rows) with ordinality e(r, n) where n <= c_page_size), '[]'),
    'page', v_page,
    'hasMore', jsonb_array_length(v_rows) > c_page_size);
end;
$$;

grant execute on function api.discard_draft(text, text, jsonb) to authenticated;
grant execute on function api.restore_revision(text, text, integer) to authenticated;
grant execute on function api.get_item_history(text, text) to authenticated;
grant execute on function api.list_audit_log(integer, timestamptz, timestamptz, text, text) to authenticated;
