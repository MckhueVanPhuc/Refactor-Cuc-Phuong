-- CHG-REC-2026-11-28-01 (spec-M03 v3.8, spec-M01 v3.3): nhóm nhãn "Hướng dẫn viên" (guideTags), nhãn đối tượng
-- GROUP_DI_THEO_DOAN thay GROUP_CAN_DE_DANG (nghỉ, không dùng lại), chỉ chặn Khó + Gia đình có trẻ nhỏ (BR-M03-C12).
-- Các hàm và view dưới đây là bản mới nhất trích nguyên văn từ migration cũ (ghi ở dòng "-- từ"), chỉ sửa phần nhãn.
-- Cuối file: chuyển dữ liệu một lần (ngoại lệ spec-M03 §6.3, brief D5–D7).

-- từ 20261101170024_m03_03g_history.sql
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
    ('groupTag', 'GROUP_DI_THEO_DOAN', 'Đi theo đoàn'),
    ('experienceTag', 'INTEREST_THIEN_NHIEN_CHUP_ANH', 'Thiên nhiên, chụp ảnh'),
    ('experienceTag', 'INTEREST_TIM_HIEU', 'Tìm hiểu'),
    ('experienceTag', 'INTEREST_KHAM_PHA', 'Khám phá'),
    ('guideTag', 'GUIDE_CO_HUONG_DAN_VIEN', 'Đi cùng hướng dẫn viên'),
    ('guideTag', 'GUIDE_TU_THAM_QUAN', 'Tự tham quan được'),
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

-- từ 20261101160019_m03_03a_command_helpers.sql
create or replace function app.field_label_base(p_item_type text, p_field_key text) returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select l.label from (values
    ('ROUTE', 'name', 'Tên tuyến'),
    ('ROUTE', 'shortDescription', 'Mô tả ngắn'),
    ('ROUTE', 'description', 'Mô tả đầy đủ'),
    ('ROUTE', 'startingPoint', 'Điểm xuất phát và cách đến'),
    ('ROUTE', 'participationRequirements', 'Yêu cầu và điều kiện tham gia'),
    ('ROUTE', 'preparation', 'Cần chuẩn bị'),
    ('ROUTE', 'bestTime', 'Thời điểm phù hợp'),
    ('ROUTE', 'safetyWarning', 'Cảnh báo an toàn'),
    ('ROUTE', 'noSafetyWarningConfirmed', 'Xác nhận tuyến không có cảnh báo an toàn cần nêu'),
    ('ROUTE', 'distanceKm', 'Quãng đường (km)'),
    ('ROUTE', 'durationMin', 'Thời lượng dự kiến (phút)'),
    ('ROUTE', 'difficulty', 'Độ khó'),
    ('ROUTE', 'groupTags', 'Nhóm đối tượng'),
    ('ROUTE', 'experienceTags', 'Trải nghiệm'),
    ('ROUTE', 'guideTags', 'Hướng dẫn viên'),
    ('ROUTE', 'thumbnailMediaId', 'Ảnh đại diện'),
    ('ROUTE', 'galleryItems', 'Ảnh chi tiết'),
    ('ROUTE', 'galleryCaption', 'Chú thích ảnh'),
    ('ROUTE', 'routeMapMediaId', 'Ảnh sơ đồ tuyến'),
    ('ROUTE', 'routeMapCaption', 'Chú thích sơ đồ tuyến'),
    ('ROUTE', 'offlineRouteMapRequired', 'Sơ đồ này cần để định hướng khi không có mạng'),
    ('ROUTE', 'highlights', 'Điểm nổi bật'),
    ('ROUTE', 'checkpointList', 'Danh sách điểm dừng của tuyến'),
    ('CHECKPOINT', 'checkpointName', 'Tên điểm dừng'),
    ('CHECKPOINT', 'connectivityMode', 'Loại kết nối'),
    ('CHECKPOINT', 'fieldVerificationConfirmed', 'Đã khảo sát thực địa, có sóng ổn định'),
    ('CHECKPOINT', 'locationNote', 'Ghi chú vị trí'),
    ('CHECKPOINT', 'visitPoints', 'Danh sách điểm tham quan'),
    ('QRCODE', 'objectName', 'Tên đối tượng'),
    ('QRCODE', 'introductionText', 'Giới thiệu'),
    ('QRCODE', 'images', 'Ảnh của điểm tham quan'),
    ('QRCODE', 'avFiles', 'Âm thanh/video'),
    ('QRCODE', 'usageRights', 'Xác nhận quyền sử dụng'),
    ('QRCODE', 'spokenLanguage', 'Ngôn ngữ của tệp'),
    ('QRCODE', 'installationLabel', 'Ghi chú lắp đặt')
  ) as l(item_type, field_key, label)
  where l.item_type = p_item_type and l.field_key = p_field_key
$$;

-- từ 20261101160017_m03_02_validation_triggers.sql
create or replace function app.revision_content_problems(p_subject_type text, p_content jsonb) returns text[]
language plpgsql immutable
set search_path = ''
as $$
declare
  v text[] := '{}';
  v_key text;
  v_item jsonb;
  v_index integer;
  v_number numeric;
  v_ids text[];
  v_allowed text[];
begin
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    return array['content'];
  end if;

  v_allowed := case p_subject_type
    when 'ROUTE' then array[
      'name', 'shortDescription', 'description', 'startingPoint', 'participationRequirements', 'preparation',
      'bestTime', 'safetyWarning', 'noSafetyWarningConfirmed', 'distanceKm', 'durationMin', 'difficulty',
      'groupTags', 'experienceTags', 'guideTags', 'thumbnailMediaId', 'galleryItems', 'routeMapMediaId', 'routeMapCaption',
      'offlineRouteMapRequired', 'checkpointList', 'highlights']
    when 'CHECKPOINT' then array[
      'checkpointName', 'connectivityMode', 'fieldVerificationConfirmed', 'fieldVerifiedByUserId', 'fieldVerifiedAt']
    when 'QRCODE' then array['objectName', 'introductionText', 'mediaItems']
    else array[]::text[]
  end;
  for v_key in select jsonb_object_keys(p_content) loop
    if v_key <> all (v_allowed) then
      v := v || v_key;
    end if;
  end loop;

  if p_subject_type = 'ROUTE' then
    -- DAC-M03-023–030, 087, 088: text limits; names are single-line
    v := v
      || app.bilingual_problems(p_content -> 'name', 'name', app.limit('NAME_MAX_CHARS'), true)
      || app.bilingual_problems(p_content -> 'shortDescription', 'shortDescription', app.limit('ROUTE_SHORT_DESC_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'description', 'description', app.limit('ROUTE_DESC_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'startingPoint', 'startingPoint', app.limit('ROUTE_START_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'participationRequirements', 'participationRequirements', app.limit('ROUTE_PARTICIPATION_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'preparation', 'preparation', app.limit('ROUTE_PREPARATION_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'bestTime', 'bestTime', app.limit('ROUTE_BEST_TIME_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'safetyWarning', 'safetyWarning', app.limit('ROUTE_SAFETY_WARNING_MAX_CHARS'), false);

    -- Required booleans (S4 Route content)
    if jsonb_typeof(p_content -> 'noSafetyWarningConfirmed') is distinct from 'boolean' then
      v := v || 'noSafetyWarningConfirmed'::text;
    end if;
    if jsonb_typeof(p_content -> 'offlineRouteMapRequired') is distinct from 'boolean' then
      v := v || 'offlineRouteMapRequired'::text;
    -- DAC-M03-040: the tick only while a route map exists
    elsif (p_content -> 'offlineRouteMapRequired')::boolean and p_content -> 'routeMapMediaId' is null then
      v := v || 'offlineRouteMapRequired'::text;
    end if;

    -- DAC-M03-032: distance > 0, ≤ ROUTE_DISTANCE_MAX_KM, one decimal; duration integer > 0, ≤ ROUTE_DURATION_MAX_MIN
    if p_content ? 'distanceKm' then
      if jsonb_typeof(p_content -> 'distanceKm') <> 'number' then
        v := v || 'distanceKm'::text;
      else
        v_number := (p_content ->> 'distanceKm')::numeric;
        if v_number <= 0 or v_number > app.limit('ROUTE_DISTANCE_MAX_KM') or round(v_number, 1) <> v_number then
          v := v || 'distanceKm'::text;
        end if;
      end if;
    end if;
    if p_content ? 'durationMin' then
      if jsonb_typeof(p_content -> 'durationMin') <> 'number' then
        v := v || 'durationMin'::text;
      else
        v_number := (p_content ->> 'durationMin')::numeric;
        if v_number <= 0 or v_number > app.limit('ROUTE_DURATION_MAX_MIN') or trunc(v_number) <> v_number then
          v := v || 'durationMin'::text;
        end if;
      end if;
    end if;

    -- DAC-M03-033–035: enums, distinct tags, no contradictory combination
    if p_content ? 'difficulty' and not coalesce((p_content ->> 'difficulty') = any (array['NHE', 'TRUNG_BINH', 'KHO']), false) then
      v := v || 'difficulty'::text;
    end if;
    if not app.enum_array_ok(p_content -> 'groupTags', array['GROUP_CA_NHAN_NGUOI_LON', 'GROUP_GIA_DINH_CO_TRE', 'GROUP_DI_THEO_DOAN']) then
      v := v || 'groupTags'::text;
    end if;
    if not app.enum_array_ok(p_content -> 'experienceTags', array['INTEREST_THIEN_NHIEN_CHUP_ANH', 'INTEREST_TIM_HIEU', 'INTEREST_KHAM_PHA']) then
      v := v || 'experienceTags'::text;
    end if;
    if not app.enum_array_ok(p_content -> 'guideTags', array['GUIDE_CO_HUONG_DAN_VIEN', 'GUIDE_TU_THAM_QUAN']) then
      v := v || 'guideTags'::text;
    end if;
    if p_content ->> 'difficulty' = 'KHO'
      and jsonb_typeof(p_content -> 'groupTags') = 'array'
      and (p_content -> 'groupTags') ? 'GROUP_GIA_DINH_CO_TRE' then
      v := v || 'groupTags'::text;
    end if;

    -- DAC-M03-036–039: image references are media ids (owner/usage checked by trigger below)
    if p_content ? 'thumbnailMediaId' and not app.is_uuid_text(p_content -> 'thumbnailMediaId') then
      v := v || 'thumbnailMediaId'::text;
    end if;
    if p_content ? 'routeMapMediaId' and not app.is_uuid_text(p_content -> 'routeMapMediaId') then
      v := v || 'routeMapMediaId'::text;
    end if;
    v := v || app.bilingual_problems(p_content -> 'routeMapCaption', 'routeMapCaption', app.limit('CAPTION_MAX_CHARS'), true);
    if p_content -> 'routeMapCaption' is not null and p_content -> 'routeMapMediaId' is null then
      v := v || 'routeMapCaption'::text;
    end if;
    if p_content ? 'galleryItems' then
      if jsonb_typeof(p_content -> 'galleryItems') <> 'array'
        or jsonb_array_length(p_content -> 'galleryItems') > app.limit('ROUTE_GALLERY_MAX_IMAGES') then
        v := v || 'galleryItems'::text;
      else
        for v_item, v_index in select e.item, e.ord - 1 from jsonb_array_elements(p_content -> 'galleryItems') with ordinality as e(item, ord) loop
          if jsonb_typeof(v_item) <> 'object' or not app.is_uuid_text(v_item -> 'mediaId')
            or exists (select 1 from jsonb_object_keys(v_item) as k(key) where k.key not in ('mediaId', 'caption')) then
            v := v || ('galleryItems.' || v_index);
          else
            v := v || app.bilingual_problems(v_item -> 'caption', 'galleryCaption.' || v_index, app.limit('CAPTION_MAX_CHARS'), true);
          end if;
        end loop;
      end if;
    end if;

    -- DAC-M03-041: list ≤ ROUTE_CHECKPOINTS_MAX_ITEMS, a checkpoint at most once
    if p_content ? 'checkpointList' then
      if jsonb_typeof(p_content -> 'checkpointList') <> 'array'
        or jsonb_array_length(p_content -> 'checkpointList') > app.limit('ROUTE_CHECKPOINTS_MAX_ITEMS') then
        v := v || 'checkpointList'::text;
      else
        select array_agg(e.item ->> 'checkpointId') into v_ids from jsonb_array_elements(p_content -> 'checkpointList') as e(item);
        if exists (
            select 1 from jsonb_array_elements(p_content -> 'checkpointList') as e(item)
            where jsonb_typeof(e.item) <> 'object' or not app.non_empty_text(e.item -> 'checkpointId')
              or exists (select 1 from jsonb_object_keys(e.item) as k(key) where k.key <> 'checkpointId'))
          or (select count(distinct x) from unnest(coalesce(v_ids, '{}')) as x) <> coalesce(array_length(v_ids, 1), 0) then
          v := v || 'checkpointList'::text;
        end if;
      end if;
    end if;

    -- DAC-M03-043: ≤ ROUTE_HIGHLIGHTS_MAX_ITEMS items of ≤ ROUTE_HIGHLIGHT_MAX_CHARS. A one-language item is a
    -- draft and blocks only publication (spec-M03 BR-M03-C06 wins over the stricter S4/Physical wording).
    if p_content ? 'highlights' then
      if jsonb_typeof(p_content -> 'highlights') <> 'array'
        or jsonb_array_length(p_content -> 'highlights') > app.limit('ROUTE_HIGHLIGHTS_MAX_ITEMS') then
        v := v || 'highlights'::text;
      else
        for v_item, v_index in select e.item, e.ord - 1 from jsonb_array_elements(p_content -> 'highlights') with ordinality as e(item, ord) loop
          v := v || app.bilingual_problems(v_item, 'highlights.' || v_index, app.limit('ROUTE_HIGHLIGHT_MAX_CHARS'), true);
        end loop;
      end if;
    end if;

  elsif p_subject_type = 'CHECKPOINT' then
    -- DAC-M03-045, 047, 048, 088
    v := v || app.bilingual_problems(p_content -> 'checkpointName', 'checkpointName', app.limit('NAME_MAX_CHARS'), true);
    if p_content ? 'connectivityMode'
      and not coalesce((p_content ->> 'connectivityMode') = any (array['ONLINE_AVAILABLE', 'OFFLINE_REQUIRED']), false) then
      v := v || 'connectivityMode'::text;
    end if;
    if p_content ? 'fieldVerificationConfirmed' and jsonb_typeof(p_content -> 'fieldVerificationConfirmed') <> 'boolean' then
      v := v || 'fieldVerificationConfirmed'::text;
    end if;
    if p_content ->> 'connectivityMode' = 'ONLINE_AVAILABLE' and (
        (p_content -> 'fieldVerificationConfirmed') is distinct from 'true'::jsonb
        or not app.non_empty_text(p_content -> 'fieldVerifiedByUserId')
        or not app.non_empty_text(p_content -> 'fieldVerifiedAt')) then
      v := v || 'fieldVerificationConfirmed'::text;
    end if;

  elsif p_subject_type = 'QRCODE' then
    -- DAC-M03-051–053, 087, 088. Below QR_INTRO_MIN_CHARS is "incomplete" and blocks only publication
    -- (DAC-M03-052); the image/audio-video split needs the media rows and is checked by trigger below.
    v := v
      || app.bilingual_problems(p_content -> 'objectName', 'objectName', app.limit('NAME_MAX_CHARS'), true)
      || app.bilingual_problems(p_content -> 'introductionText', 'introductionText', app.limit('QR_INTRO_MAX_CHARS'), false);
    if p_content ? 'mediaItems' then
      if jsonb_typeof(p_content -> 'mediaItems') <> 'array'
        or jsonb_array_length(p_content -> 'mediaItems') > app.limit('QR_MAX_IMAGES') + app.limit('QR_MAX_AV_FILES')
        or exists (
          select 1 from jsonb_array_elements(p_content -> 'mediaItems') as e(item)
          where jsonb_typeof(e.item) <> 'object' or not app.is_uuid_text(e.item -> 'mediaId')
            or exists (select 1 from jsonb_object_keys(e.item) as k(key) where k.key <> 'mediaId'))
        or (select count(distinct e.item ->> 'mediaId') <> count(*) from jsonb_array_elements(p_content -> 'mediaItems') as e(item)) then
        v := v || 'mediaItems'::text;
      end if;
    end if;
  else
    v := v || 'subjectType'::text;
  end if;

  return v;
end;
$$;

-- từ 20261101170009_m03_03d_routes_publish.sql
create or replace function app.normalize_route_content(p_content jsonb) returns jsonb
language plpgsql immutable
set search_path = ''
as $$
declare
  v jsonb := coalesce(p_content, '{}');
  v_key text;
  v_has_map boolean := not app.is_blank(p_content -> 'routeMapMediaId');
begin
  foreach v_key in array array['name', 'shortDescription', 'routeMapCaption'] loop
    if v ? v_key then
      v := jsonb_set(v, array[v_key], app.one_line(v -> v_key));
    end if;
  end loop;
  if jsonb_typeof(v -> 'highlights') = 'array' then
    v := jsonb_set(v, '{highlights}', (select coalesce(jsonb_agg(app.one_line(h) order by n), '[]')
                                        from jsonb_array_elements(v -> 'highlights') with ordinality x(h, n)));
  end if;
  if jsonb_typeof(v -> 'galleryItems') = 'array' then
    v := jsonb_set(v, '{galleryItems}', (select coalesce(jsonb_agg(
           case when g ? 'caption' then g || jsonb_build_object('caption', app.one_line(g -> 'caption'))
                else jsonb_build_object('mediaId', g -> 'mediaId') end order by n), '[]')
         from jsonb_array_elements(v -> 'galleryItems') with ordinality x(g, n)));
  end if;
  foreach v_key in array array['groupTags', 'experienceTags', 'guideTags'] loop
    if v ? v_key then
      v := jsonb_set(v, array[v_key], app.distinct_array(v -> v_key));
    end if;
  end loop;
  if not v_has_map then
    v := v - 'routeMapCaption';
  end if;
  return v || jsonb_build_object(
    'offlineRouteMapRequired', v_has_map and coalesce((v ->> 'offlineRouteMapRequired')::boolean, false),
    'noSafetyWarningConfirmed', not app.has_text(v -> 'safetyWarning') and coalesce((v ->> 'noSafetyWarningConfirmed')::boolean, false));
end;
$$;

-- từ 20261101170009_m03_03d_routes_publish.sql
create or replace function app.route_save_issues(p_id text, p_content jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_issues jsonb := '[]';
  v_field record;
  v_item record;
  v_conflict text;
begin
  for v_field in select * from (values
      ('name', 'NAME_MAX_CHARS'), ('shortDescription', 'ROUTE_SHORT_DESC_MAX_CHARS'), ('description', 'ROUTE_DESC_MAX_CHARS'),
      ('startingPoint', 'ROUTE_START_MAX_CHARS'), ('participationRequirements', 'ROUTE_PARTICIPATION_MAX_CHARS'),
      ('preparation', 'ROUTE_PREPARATION_MAX_CHARS'), ('bestTime', 'ROUTE_BEST_TIME_MAX_CHARS'),
      ('safetyWarning', 'ROUTE_SAFETY_WARNING_MAX_CHARS')) as f(key, limit_name) loop
    v_issues := v_issues
      || app.check_text('ROUTE', p_id, v_field.key || '.vi', p_content -> v_field.key ->> 'vi', app.limit(v_field.limit_name))
      || app.check_text('ROUTE', p_id, v_field.key || '.en', p_content -> v_field.key ->> 'en', app.limit(v_field.limit_name));
  end loop;
  for v_item in select g, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'galleryItems', '[]')) with ordinality x(g, n) loop
    v_issues := v_issues
      || app.check_text('ROUTE', p_id, 'galleryCaption.' || v_item.i || '.vi', v_item.g #>> '{caption,vi}', app.limit('CAPTION_MAX_CHARS'))
      || app.check_text('ROUTE', p_id, 'galleryCaption.' || v_item.i || '.en', v_item.g #>> '{caption,en}', app.limit('CAPTION_MAX_CHARS'));
  end loop;
  v_issues := v_issues
    || app.check_text('ROUTE', p_id, 'routeMapCaption.vi', p_content #>> '{routeMapCaption,vi}', app.limit('CAPTION_MAX_CHARS'))
    || app.check_text('ROUTE', p_id, 'routeMapCaption.en', p_content #>> '{routeMapCaption,en}', app.limit('CAPTION_MAX_CHARS'));
  for v_item in select g, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'highlights', '[]')) with ordinality x(g, n) loop
    v_issues := v_issues
      || app.check_text('ROUTE', p_id, 'highlights.' || v_item.i || '.vi', v_item.g ->> 'vi', app.limit('ROUTE_HIGHLIGHT_MAX_CHARS'))
      || app.check_text('ROUTE', p_id, 'highlights.' || v_item.i || '.en', v_item.g ->> 'en', app.limit('ROUTE_HIGHLIGHT_MAX_CHARS'));
  end loop;
  v_issues := v_issues
    || app.check_number('ROUTE', p_id, 'distanceKm', p_content -> 'distanceKm', app.limit('ROUTE_DISTANCE_MAX_KM'), 'km', 1)
    || app.check_number('ROUTE', p_id, 'durationMin', p_content -> 'durationMin', app.limit('ROUTE_DURATION_MAX_MIN'), 'phút', null);

  -- Khó does not go with the family tag (BR-M03-C12, spec-M03 v3.8)
  if p_content ->> 'difficulty' = 'KHO' then
    select t #>> '{}' into v_conflict from jsonb_array_elements(coalesce(p_content -> 'groupTags', '[]')) with ordinality x(t, n)
    where t #>> '{}' = 'GROUP_GIA_DINH_CO_TRE' order by n limit 1;
    if v_conflict is not null then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'groupTags', 'MSG-TAG-CONFLICT',
        jsonb_build_object('độ khó', app.display_name('difficulty', 'KHO'), 'nhãn', app.display_name('groupTag', v_conflict))));
    end if;
  end if;
  if jsonb_array_length(coalesce(p_content -> 'galleryItems', '[]')) > app.limit('ROUTE_GALLERY_MAX_IMAGES') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'galleryItems', 'MSG-COUNT-IMAGES',
      jsonb_build_object('Tên điểm tham quan hoặc tên tuyến', coalesce(app.trim_text(p_content #>> '{name,vi}'), ''),
        'tối đa', app.limit('ROUTE_GALLERY_MAX_IMAGES'))));
  end if;
  -- a checkpoint appears once (MSG-CHECKPOINT-DUPLICATE, once per duplicated checkpoint)
  for v_item in
    select d.id from (
      select c ->> 'checkpointId' as id, n, row_number() over (partition by c ->> 'checkpointId' order by n) as k
      from jsonb_array_elements(coalesce(p_content -> 'checkpointList', '[]')) with ordinality x(c, n)) d
    where d.k = 2 order by d.n
  loop
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'checkpointList', 'MSG-CHECKPOINT-DUPLICATE',
      jsonb_build_object('tên', app.checkpoint_name(v_item.id))));
  end loop;
  if jsonb_array_length(coalesce(p_content -> 'checkpointList', '[]')) > app.limit('ROUTE_CHECKPOINTS_MAX_ITEMS') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'checkpointList', 'MSG-LIMIT-CHECKPOINTS',
      jsonb_build_object('tối đa', app.limit('ROUTE_CHECKPOINTS_MAX_ITEMS'))));
  end if;
  return v_issues;
end;
$$;

-- từ 20261101170009_m03_03d_routes_publish.sql
create or replace function app.route_publish_issues(p_id text, p_content jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_issues jsonb;
  v_key text;
  v_item record;
begin
  -- step 1 "Thẻ tuyến"
  v_issues := app.check_required('ROUTE', p_id, 'thumbnailMediaId', p_content -> 'thumbnailMediaId')
    || app.check_required_bilingual('ROUTE', p_id, 'name', p_content -> 'name')
    || app.check_required_bilingual('ROUTE', p_id, 'shortDescription', p_content -> 'shortDescription')
    || app.check_required('ROUTE', p_id, 'distanceKm', p_content -> 'distanceKm')
    || app.check_required('ROUTE', p_id, 'durationMin', p_content -> 'durationMin')
    || app.check_required('ROUTE', p_id, 'difficulty', p_content -> 'difficulty')
    -- step 2 "Chi tiết"
    || app.check_required_bilingual('ROUTE', p_id, 'description', p_content -> 'description')
    || app.check_required_bilingual('ROUTE', p_id, 'startingPoint', p_content -> 'startingPoint');
  foreach v_key in array array['participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] loop
    v_issues := v_issues || app.check_bilingual('ROUTE', p_id, v_key, p_content -> v_key);
  end loop;
  if not app.has_text(p_content -> 'safetyWarning') and (p_content ->> 'noSafetyWarningConfirmed')::boolean is not true then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'ROUTE', p_id, 'safetyWarning.vi', 'MSG-SAFETY-CONFIRM'));
  end if;
  for v_item in select g, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'galleryItems', '[]')) with ordinality x(g, n) loop
    v_issues := v_issues || app.check_bilingual('ROUTE', p_id, 'galleryCaption', v_item.g -> 'caption', 'galleryCaption.' || v_item.i);
  end loop;
  v_issues := v_issues || app.check_bilingual('ROUTE', p_id, 'routeMapCaption', p_content -> 'routeMapCaption');
  for v_item in select h, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'highlights', '[]')) with ordinality x(h, n) loop
    v_issues := v_issues || app.check_bilingual('ROUTE', p_id, 'highlights', v_item.h, 'highlights.' || v_item.i);
  end loop;
  for v_item in select * from app.route_images(p_content) i loop
    if not coalesce((select m.usage_rights_confirmed from app.media m where m.media_id::text = v_item.media_id), false) then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'ROUTE', p_id, v_item.field_key,
        'MSG-RIGHTS-NOT-CONFIRMED', jsonb_build_object('tên tệp', v_item.label)));
    end if;
  end loop;
  -- step 3 "Nhãn"
  v_issues := v_issues
    || app.check_required('ROUTE', p_id, 'groupTags', p_content -> 'groupTags')
    || app.check_required('ROUTE', p_id, 'experienceTags', p_content -> 'experienceTags')
    || app.check_required('ROUTE', p_id, 'guideTags', p_content -> 'guideTags');
  -- step 4: at least one active checkpoint (BR-M03-T04)
  if not exists (select 1 from jsonb_array_elements(coalesce(p_content -> 'checkpointList', '[]')) c
                 join app.checkpoints k on k.checkpoint_id = c ->> 'checkpointId' and k.status = 'HOAT_DONG') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'ROUTE', p_id, 'checkpointList', 'MSG-NO-ACTIVE-CHECKPOINT'));
  end if;
  return v_issues;
end;
$$;

-- từ 20261101170009_m03_03d_routes_publish.sql
create or replace function app.route_changes(p_before jsonb, p_after jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_has_before boolean := p_before is not null;
  v_lines jsonb;
  v_key text;
begin
  v_lines := app.change_line(app.field_label('ROUTE', 'thumbnailMediaId'),
      case when not app.is_blank(p_before -> 'thumbnailMediaId') then 'Có' else '' end,
      case when (p_after ->> 'thumbnailMediaId') is not distinct from (p_before ->> 'thumbnailMediaId')
             then case when not app.is_blank(p_before -> 'thumbnailMediaId') then 'Có' else '' end
           when not app.is_blank(p_after -> 'thumbnailMediaId') then 'Ảnh mới' else '' end)
    || app.text_changes('ROUTE', 'name', p_before -> 'name', p_after -> 'name')
    || app.text_changes('ROUTE', 'shortDescription', p_before -> 'shortDescription', p_after -> 'shortDescription')
    || app.change_line(app.field_label('ROUTE', 'distanceKm'), replace(p_before ->> 'distanceKm', '.', ','), replace(p_after ->> 'distanceKm', '.', ','))
    || app.change_line(app.field_label('ROUTE', 'durationMin'), p_before ->> 'durationMin', p_after ->> 'durationMin')
    || app.change_line(app.field_label('ROUTE', 'difficulty'), app.display_name('difficulty', p_before ->> 'difficulty'),
         app.display_name('difficulty', p_after ->> 'difficulty'));
  foreach v_key in array array['description', 'startingPoint', 'participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] loop
    v_lines := v_lines || app.text_changes('ROUTE', v_key, p_before -> v_key, p_after -> v_key);
  end loop;
  return v_lines
    || app.change_line(app.field_label('ROUTE', 'galleryItems'),
         case when v_has_before then jsonb_array_length(coalesce(p_before -> 'galleryItems', '[]')) || ' ảnh' else '' end,
         jsonb_array_length(coalesce(p_after -> 'galleryItems', '[]')) || ' ảnh')
    || app.change_line(app.field_label('ROUTE', 'offlineRouteMapRequired'),
         case when (p_before ->> 'offlineRouteMapRequired')::boolean then 'Có' when v_has_before then 'Không' else '' end,
         case when (p_after ->> 'offlineRouteMapRequired')::boolean then 'Có' when v_has_before then 'Không' else '' end)
    || app.change_line(app.field_label('ROUTE', 'groupTags'), app.tag_names('groupTag', p_before -> 'groupTags'),
         app.tag_names('groupTag', p_after -> 'groupTags'))
    || app.change_line(app.field_label('ROUTE', 'experienceTags'), app.tag_names('experienceTag', p_before -> 'experienceTags'),
         app.tag_names('experienceTag', p_after -> 'experienceTags'))
    || app.change_line(app.field_label('ROUTE', 'guideTags'), app.tag_names('guideTag', p_before -> 'guideTags'),
         app.tag_names('guideTag', p_after -> 'guideTags'))
    || app.change_line(app.field_label('ROUTE', 'checkpointList'),
         (select coalesce(string_agg(app.checkpoint_name(c ->> 'checkpointId'), ', ' order by n), '')
          from jsonb_array_elements(coalesce(p_before -> 'checkpointList', '[]')) with ordinality x(c, n)),
         (select coalesce(string_agg(app.checkpoint_name(c ->> 'checkpointId'), ', ' order by n), '')
          from jsonb_array_elements(coalesce(p_after -> 'checkpointList', '[]')) with ordinality x(c, n)));
end;
$$;

-- từ 20261101170012_m03_04b_public_views.sql
create or replace view api.published_routes with (security_barrier = true) as
select
  r.route_id,
  r.status,
  t.complete -> 'name' as name,
  t.complete -> 'shortDescription' as short_description,
  t.complete -> 'description' as description,
  t.complete -> 'startingPoint' as starting_point,
  jsonb_build_object('sourceRef', thumb.source_ref) as thumbnail,
  coalesce((
    select jsonb_agg(jsonb_build_object('sourceRef', m.source_ref)
      || case when nullif(btrim(g #>> '{caption,vi}', E' \t\r\n'), '') is not null
                and nullif(btrim(g #>> '{caption,en}', E' \t\r\n'), '') is not null
              then jsonb_build_object('caption', jsonb_build_object('vi', btrim(g #>> '{caption,vi}', E' \t\r\n'),
                                                                    'en', btrim(g #>> '{caption,en}', E' \t\r\n')))
              else '{}'::jsonb end
      order by n)
    from jsonb_array_elements(coalesce(c -> 'galleryItems', '[]')) with ordinality x(g, n)
    join app.media m on m.media_id::text = g ->> 'mediaId'), '[]'::jsonb) as gallery,
  case when map.source_ref is null then null else jsonb_build_object('sourceRef', map.source_ref)
    || coalesce(case when t.complete ? 'routeMapCaption' then jsonb_build_object('caption', t.complete -> 'routeMapCaption') end, '{}'::jsonb)
  end as route_map,
  t.complete -> 'participationRequirements' as participation_requirements,
  t.complete -> 'preparation' as preparation,
  t.complete -> 'bestTime' as best_time,
  t.complete -> 'safetyWarning' as safety_warning,
  coalesce((
    select jsonb_agg(jsonb_build_object('vi', btrim(h ->> 'vi', E' \t\r\n'), 'en', btrim(h ->> 'en', E' \t\r\n')) order by n)
    from jsonb_array_elements(coalesce(c -> 'highlights', '[]')) with ordinality x(h, n)
    where nullif(btrim(h ->> 'vi', E' \t\r\n'), '') is not null and nullif(btrim(h ->> 'en', E' \t\r\n'), '') is not null),
    '[]'::jsonb) as highlights,
  (c ->> 'distanceKm')::numeric as distance_km,
  (c ->> 'durationMin')::integer as duration_min,
  c ->> 'difficulty' as difficulty,
  -- derived, never input: ≤ 90 short, 91–180 medium, > 180 long (BR-M03-C11)
  jsonb_build_array(case when (c ->> 'durationMin')::integer <= 90 then 'TIME_NGAN'
                         when (c ->> 'durationMin')::integer <= 180 then 'TIME_VUA' else 'TIME_DAI' end) as time_tags,
  coalesce(c -> 'groupTags', '[]'::jsonb) as group_tags,
  coalesce(c -> 'experienceTags', '[]'::jsonb) as experience_tags,
  -- derived from the active snapshot (BR-M03-T08)
  jsonb_array_length(s.checkpoints) as checkpoint_count,
  exists (select 1 from jsonb_array_elements(s.checkpoints) k where k ->> 'connectivityMode' = 'OFFLINE_REQUIRED')
    as has_offline_required_checkpoint,
  s.offline_route_map is not null as has_offline_route_map,
  coalesce((
    select jsonb_agg(jsonb_build_object('checkpointId', k -> 'checkpointId', 'sequence', k -> 'sequence',
                                        'checkpointName', k -> 'checkpointName') order by (k ->> 'sequence')::integer)
    from jsonb_array_elements(s.checkpoints) k), '[]'::jsonb) as checkpoint_summaries,
  r.active_content_version,
  -- spec-M03 v3.8: appended last so `create or replace view` keeps the existing columns
  coalesce(c -> 'guideTags', '[]'::jsonb) as guide_tags
from app.routes r
join app.revisions v on v.subject_type = 'ROUTE' and v.subject_id = r.route_id and v.status = 'PHAT_HANH'
join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version
cross join lateral (select v.content as c) content
-- bilingual values present in both languages after trim (an optional one is published only when complete)
cross join lateral (
  select coalesce(jsonb_object_agg(f.key, jsonb_build_object('vi', btrim(content.c -> f.key ->> 'vi', E' \t\r\n'),
                                                             'en', btrim(content.c -> f.key ->> 'en', E' \t\r\n'))), '{}'::jsonb) as complete
  from unnest(array['name', 'shortDescription', 'description', 'startingPoint', 'participationRequirements', 'preparation',
                    'bestTime', 'safetyWarning', 'routeMapCaption']) as f(key)
  where nullif(btrim(content.c -> f.key ->> 'vi', E' \t\r\n'), '') is not null
    and nullif(btrim(content.c -> f.key ->> 'en', E' \t\r\n'), '') is not null) t
left join app.media thumb on thumb.media_id::text = content.c ->> 'thumbnailMediaId'
left join app.media map on map.media_id::text = content.c ->> 'routeMapMediaId'
where r.status in ('HOAT_DONG', 'TAM_DONG', 'LUU_TRU');

-- ---------------------------------------------------------------------------
-- Chuyển dữ liệu một lần (brief D5–D7). Mọi revision tuyến, kể cả PHAT_HANH đã đóng băng (ngoại lệ đã duyệt):
-- bỏ GROUP_CAN_DE_DANG khỏi groupTags; gán guideTags cả hai giá trị khi chưa có. Không tạo revision mới, không ghi
-- nhật ký, không đổi lastEdited*, concurrencyRevision hay activeContentVersion. Trigger của app.revisions tắt tạm
-- trong transaction của migration để giữ nguyên mọi cột khác (đóng băng nội dung, kiểm tham chiếu của revision cũ).
-- ---------------------------------------------------------------------------
alter table app.revisions disable trigger user;

update app.revisions v
set content = jsonb_set(v.content, '{groupTags}',
  (select coalesce(jsonb_agg(t order by n), '[]'::jsonb)
   from jsonb_array_elements(v.content -> 'groupTags') with ordinality x(t, n)
   where t #>> '{}' <> 'GROUP_CAN_DE_DANG'))
where v.subject_type = 'ROUTE'
  and jsonb_typeof(v.content -> 'groupTags') = 'array'
  and (v.content -> 'groupTags') ? 'GROUP_CAN_DE_DANG';

update app.revisions v
set content = v.content || jsonb_build_object('guideTags', jsonb_build_array('GUIDE_CO_HUONG_DAN_VIEN', 'GUIDE_TU_THAM_QUAN'))
where v.subject_type = 'ROUTE'
  and not (v.content ? 'guideTags');

alter table app.revisions enable trigger user;
