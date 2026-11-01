-- M03 migration 3a — helpers shared by every command function (tasks M03 T170; Physical §7.3, §8, §9;
-- research R-06, R-07, R-08, R-09, R-15). The commands themselves come in migrations 3b–3g.
--
-- Command pattern (R-07): each `api.*` command is SECURITY DEFINER with `search_path = ''` and
--
--   begin                                                -- inner block = savepoint
--     v_actor := app.require_admin('B' | 'R');          -- FORBIDDEN is a rejection like any other
--     ... app.expect_revision(...), app.lock_connected_set(...), business writes ...
--     perform app.audit(v_actor.user_id, '<ACTION>', ..., 'SUCCESS', ...);
--     return app.cr_ok('<MSG-…>', <data>);
--   exception when others then                          -- business writes are rolled back here
--     v_result := app.result_from_error(sqlstate, sqlerrm, '<MSG-PUBLISH-FAILED | MSG-GENERIC>');
--   end;
--   perform app.audit(auth.uid()::text, '<ACTION>', ..., 'FAILURE', ...);   -- a caller without account → null
--   return v_result;
--
-- so every call writes exactly one audit line, also on failure (BR-M03-F08), and returns a CommandResult.

-- ---------------------------------------------------------------------------
-- Who is calling (R-15; Physical §9; BR-M03-K05, K06)
-- ---------------------------------------------------------------------------

-- The active account of the caller, or null. Role and status come from app.admin_accounts, never from the
-- JWT; a token whose session was signed out (session_id no longer in auth.sessions) is refused (SC-M03-040).
create function app.current_admin() returns app.admin_accounts
language sql stable security definer
set search_path = ''
as $$
  select a.*
  from app.admin_accounts a
  where a.user_id = auth.uid()::text
    and a.status = 'ACTIVE'
    and exists (
      select 1 from auth.sessions s
      where s.id::text = auth.jwt() ->> 'session_id' and s.user_id = auth.uid()
    )
$$;

-- ---------------------------------------------------------------------------
-- Message catalog (spec-M03 §5.6) and field labels (BR-M03-L04) — copies of
-- src/modules/m03/messages/catalogText.ts and fieldLabels.ts, kept equal by
-- src/modules/m03/api/sqlCatalog.test.ts. Change the TypeScript source first, then append a migration.
-- ---------------------------------------------------------------------------

create function app.message_template(p_key text) returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select c.template from (values
    ('MSG-SAVED', 'Đã lưu bản nháp.'),
    ('MSG-PUBLISHED', 'Đã xuất bản. Du khách sẽ thấy nội dung mới.'),
    ('MSG-LIMIT-TEXT', '{Tên ô} dài quá {tối đa} ký tự (hiện có {số}). Hãy rút gọn.'),
    ('MSG-NUMBER-POSITIVE', '{Tên ô} phải lớn hơn 0.'),
    ('MSG-NUMBER-TOO-BIG', '{Tên ô} không được lớn hơn {tối đa} {đơn vị}.'),
    ('MSG-NUMBER-DECIMALS', '{Tên ô} chỉ nhận tối đa 1 chữ số sau dấu phẩy.'),
    ('MSG-LIMIT-CHECKPOINTS', 'Tuyến đã đủ {tối đa} điểm dừng. Hãy bỏ bớt điểm dừng trước khi thêm.'),
    ('MSG-LIMIT-QR', 'Điểm dừng "{tên}" đã đủ {tối đa} điểm tham quan. Hãy thu hồi hoặc bỏ bớt điểm tham quan trước khi thêm.'),
    ('MSG-REPORT-SPAN', 'Khoảng thời gian chọn quá dài. Hãy chọn tối đa {tối đa} ngày.'),
    ('MSG-FILE-TOO-BIG', '{Loại tệp} "{tên tệp}" nặng {số} MB, tối đa {tối đa} MB. Hãy nén nhỏ hơn rồi tải lại.'),
    ('MSG-FILE-TYPE', 'Tệp "{tên tệp}" không đúng định dạng. Chỉ nhận {danh sách định dạng}.'),
    ('MSG-COUNT-IMAGES', '{Tên điểm tham quan hoặc tên tuyến} đã đủ {tối đa} ảnh. Hãy xóa bớt ảnh trước khi thêm.'),
    ('MSG-COUNT-AV', '{Tên điểm tham quan} đã đủ {tối đa} tệp âm thanh/video. Hãy xóa bớt trước khi thêm.'),
    ('MSG-AV-OFFLINE', 'Điểm dừng "{tên}" là loại cần tải trước nên chỉ nhận chữ và ảnh. Âm thanh và video chỉ dùng cho điểm dừng có mạng.'),
    ('MSG-AV-LANGUAGE-MISSING', 'Hãy chọn ngôn ngữ cho tệp "{tên tệp}": Tiếng Việt, Tiếng Anh hoặc Không lời.'),
    ('MSG-AV-ONE-LANGUAGE', 'Điểm tham quan "{tên}" chỉ có âm thanh/video {ngôn ngữ}. Du khách chọn {ngôn ngữ còn lại} sẽ không thấy các tệp này.'),
    ('MSG-MODE-HAS-AV', 'Chưa đổi được sang "Cần tải trước" vì còn âm thanh/video ở: {danh sách}. Hãy xóa chúng trước.'),
    ('MSG-MODE-REQUIRED-FIRST', 'Hãy chọn loại kết nối cho điểm dừng và lưu lại trước khi thêm điểm tham quan.'),
    ('MSG-TAG-CONFLICT', 'Tuyến độ khó {độ khó} không thể gắn nhãn {nhãn}. Hãy đổi độ khó hoặc bỏ nhãn.'),
    ('MSG-CHECKPOINT-NAME-TAKEN', 'Đã có điểm dừng tên "{tên}". Hãy dùng tên khác, hoặc chọn điểm dừng đó trong tuyến.'),
    ('MSG-CHECKPOINT-DUPLICATE', 'Điểm dừng "{tên}" đã có trong danh sách của tuyến.'),
    ('MSG-MAP-TICK-CLEARED', 'Đã bỏ chọn "dùng sơ đồ khi không có mạng" vì tuyến không còn sơ đồ.'),
    ('MSG-UPLOAD-SUMMARY', 'Đã tải {số}/{tổng} tệp. Chưa tải được: {danh sách}.'),
    ('MSG-UPLOADED-NOT-SAVED', 'Đã tải lên — chưa lưu vào bản nháp.'),
    ('MSG-QR-CREATED', 'Đã thêm điểm tham quan "{tên}".'),
    ('MSG-VERSION-DRAFT', 'Bản nháp — du khách chưa thấy.'),
    ('MSG-VERSION-PUBLISHED', 'Đang hiển thị cho du khách.'),
    ('MSG-PREVIEW-DRAFT', 'Bản xem trước — du khách chưa thấy nội dung này.'),
    ('MSG-UNSAVED-CHANGES', 'Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này.'),
    ('MSG-MISSING-FIELD', 'Còn thiếu: {tên ô}.'),
    ('MSG-MISSING-LANGUAGE', '{Tên ô}: còn thiếu bản {tiếng Việt / tiếng Anh}.'),
    ('MSG-NO-ACTIVE-CHECKPOINT', 'Tuyến cần ít nhất một điểm dừng đang hoạt động trong danh sách thì mới xuất bản được.'),
    ('MSG-ROUTE-LAST-CHECKPOINT', 'Không thể bỏ điểm dừng này vì tuyến sẽ không còn điểm dừng nào đang hoạt động. Hãy thêm điểm dừng khác hoặc đóng tạm tuyến trước.'),
    ('MSG-CHECKPOINT-LEFT-OUT', 'Điểm dừng "{tên}" đang tạm đóng nên chưa nằm trong hành trình của tuyến.'),
    ('MSG-QR-LEFT-OUT', 'Điểm tham quan "{tên}" chưa sẵn sàng: {điều còn thiếu}. Điểm này chưa được xuất bản lần này.'),
    ('MSG-RIGHTS-NOT-CONFIRMED', 'Hãy xác nhận quyền sử dụng cho "{tên tệp}" trước khi xuất bản.'),
    ('MSG-ONLINE-NOT-VERIFIED', 'Hãy tick xác nhận đã khảo sát thực địa, có sóng ổn định, cho điểm dừng "{tên}".'),
    ('MSG-SAFETY-CONFIRM', 'Hãy nhập cảnh báo an toàn, hoặc tick xác nhận tuyến không có cảnh báo an toàn cần nêu.'),
    ('MSG-OFFLINE-TOO-BIG', 'Gói tải trước của tuyến "{tên tuyến}" sẽ nặng khoảng {số} MB, vượt mức {tối đa} MB. Ảnh nặng nhất: {danh sách}. Hãy nén hoặc bớt ảnh.'),
    ('MSG-IMAGE-NOT-READABLE', 'Chưa đọc được ảnh "{tên tệp}" đã tải lên. Hãy tải lại ảnh này.'),
    ('MSG-STALE', '{Tên người} vừa sửa mục này lúc {giờ}. Bấm Tải lại để xem bản mới nhất. Nội dung bạn đang gõ vẫn được giữ trên màn hình để bạn sao chép.'),
    ('MSG-ROUTE-BUSY', 'Đang có thao tác khác chạy trên {tên tuyến hoặc điểm dừng}. Hãy thử lại sau ít phút.'),
    ('MSG-AFFECTED-ROUTES', 'Thay đổi này ảnh hưởng {số} tuyến: {danh sách}. Gói tải trước của du khách ở các tuyến đó cần cập nhật.'),
    ('MSG-PUBLISH-FAILED', 'Chưa xuất bản được. Những gì du khách đang thấy vẫn như cũ. Hãy thử lại sau ít phút.'),
    ('MSG-DRAFT-EXISTS', 'Đang có bản nháp chưa xuất bản. Hãy xuất bản hoặc bỏ thay đổi trước, rồi mới khôi phục bản cũ.'),
    ('MSG-RESTORE-BLOCKED', 'Chưa khôi phục được bản này vì có chỗ không còn hợp với giới hạn hiện nay: {danh sách chỗ cần sửa}. Hãy sửa từ bản đang xuất bản.'),
    ('MSG-LAST-QR', 'Không thể thu hồi mã QR cuối cùng của điểm dừng đang hoạt động. Hãy thêm mã QR khác hoặc đóng tạm điểm dừng trước.'),
    ('MSG-CHECKPOINT-IN-USE', 'Chưa thể lưu trữ điểm dừng này vì tuyến {danh sách} vẫn có trong danh sách. Hãy bỏ điểm dừng khỏi các tuyến đó trước.'),
    ('MSG-CLOSE-AFFECTS-ROUTES', 'Điểm dừng này có trong {số} tuyến: {danh sách}.'),
    ('MSG-CLOSE-NO-ROUTES', 'Điểm dừng này chưa có trong tuyến nào. Người quét mã QR tại đây sẽ thấy điểm dừng đang tạm đóng.'),
    ('MSG-CLOSE-ROUTE-AUTO', 'Các tuyến sau sẽ tự đóng tạm vì hết điểm dừng hoạt động: {danh sách}.'),
    ('MSG-CLOSE-FAILED', 'Chưa đóng được điểm dừng, mọi thứ vẫn như cũ. Hãy thử lại. Nếu khẩn cấp, bạn có thể bấm "Đóng tạm các tuyến liên quan".'),
    ('MSG-REOPEN-BLOCKED', 'Chưa mở lại được. Cần xử lý trước: {danh sách}.'),
    ('MSG-REPRINT-MODE-CHANGED', 'Loại kết nối của điểm dừng "{tên}" sẽ đổi. Sau khi xuất bản, hãy in lại mã QR của các điểm tham quan để dòng hướng dẫn trên tem đúng với thực tế.'),
    ('MSG-QR-PRINT-UNPUBLISHED', 'Điểm tham quan này chưa xuất bản. Nếu dán mã ra thực địa, người quét sẽ thấy mã không hợp lệ.'),
    ('MSG-LAST-REVIEWER', 'Không thể khóa hoặc hạ quyền người quản lý cuối cùng.'),
    ('MSG-NO-PERMISSION', 'Bạn chưa có quyền làm việc này. Hãy nhờ quản lý.'),
    ('MSG-REPORT-UPDATED', 'Số liệu tính đến {giờ} ngày {ngày}.'),
    ('MSG-REPORT-NO-DATA-YET', 'Chưa có chuyến đi nào được gửi về hệ thống.'),
    ('MSG-REPORT-SCOPE', 'Chỉ tính các chuyến đi đã kết thúc và đã gửi về hệ thống; số liệu không cập nhật tức thời.'),
    ('MSG-REPORT-VISIT-MEANING', 'Một lượt ghé là một lần quét mã QR, không chứng minh du khách đã có mặt tại chỗ.'),
    ('MSG-REPORT-EMPTY', 'Không có chuyến đi nào trong khoảng thời gian đã chọn.'),
    ('MSG-GENERIC', 'Có lỗi xảy ra. Nội dung bạn nhập vẫn được giữ. Hãy thử lại, nếu vẫn lỗi hãy báo quản lý.'),
    ('MSG-LOGIN-FAILED', 'Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại.'),
    ('MSG-LOGIN-DENIED', 'Tài khoản này chưa được phép vào hệ thống. Hãy nhờ quản lý.'),
    ('MSG-SESSION-EXPIRED', 'Phiên làm việc đã hết hạn. Hãy đăng nhập lại.'),
    ('MSG-NETWORK-FAILED', 'Chưa kết nối được. Hãy kiểm tra mạng rồi thử lại.'),
    ('MSG-RECOVERY-SENT', 'Nếu email này có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'),
    ('MSG-LINK-INVALID', 'Liên kết này không dùng được hoặc đã hết hạn. Nếu là lời mời, hãy nhờ quản lý gửi lại; nếu là khôi phục mật khẩu, hãy yêu cầu lại.'),
    ('MSG-EMAIL-INVALID', 'Email chưa đúng. Hãy kiểm tra lại.'),
    ('MSG-EMAIL-TAKEN', 'Email {email} đã có tài khoản. Nếu tài khoản đang chờ nhận lời mời, hãy bấm Gửi lại lời mời.'),
    ('MSG-INVITE-SENT', 'Đã gửi lời mời tới {email}.'),
    ('MSG-INVITE-RESENT', 'Đã gửi lại lời mời tới {email}.'),
    ('MSG-INVITE-FAILED', 'Chưa gửi được lời mời. Hãy thử lại sau ít phút.'),
    ('MSG-REPORT-DATES-INVALID', 'Hãy chọn đủ ngày bắt đầu và ngày kết thúc, ngày bắt đầu không được sau ngày kết thúc.'),
    ('MSG-CONFIRM-CLOSE-ROUTE', 'Tuyến "{tên}" sẽ ẩn khỏi lựa chọn của du khách; các chuyến đang đi không bị dừng.'),
    ('MSG-CONFIRM-REOPEN-ROUTE', 'Tuyến "{tên}" sẽ lại hiện cho du khách chọn.'),
    ('MSG-CONFIRM-ARCHIVE-ROUTE', 'Lưu trữ tuyến "{tên}" không thể hoàn tác; dữ liệu vẫn được giữ cho lịch sử và báo cáo.'),
    ('MSG-CONFIRM-DISCARD-ROUTE', 'Hủy tuyến "{tên}": tuyến chưa từng xuất bản này sẽ không dùng được nữa.'),
    ('MSG-CONFIRM-REOPEN-CHECKPOINT', 'Mở lại điểm dừng "{tên}" sẽ đưa điểm dừng trở lại các tuyến: {danh sách}; gói tải trước của du khách ở các tuyến đó cần cập nhật.'),
    ('MSG-CONFIRM-ARCHIVE-CHECKPOINT', 'Lưu trữ điểm dừng "{tên}" không thể hoàn tác; các điểm tham quan của điểm dừng này sẽ bị thu hồi.'),
    ('MSG-CONFIRM-DISCARD-CHECKPOINT', 'Hủy điểm dừng "{tên}": điểm dừng chưa từng xuất bản và các điểm tham quan nháp của nó sẽ không dùng được nữa.'),
    ('MSG-CONFIRM-REVOKE-QR', 'Thu hồi mã QR của "{tên}": người quét mã này sẽ thấy mã không hợp lệ; gói tải trước của du khách ở các tuyến liên quan cần cập nhật.'),
    ('MSG-CONFIRM-DISCARD-QR', 'Hủy điểm tham quan "{tên}": mã QR của nó sẽ không bao giờ được dùng lại.'),
    ('MSG-CONFIRM-PUBLISH', 'Xuất bản "{tên mục}": du khách sẽ thấy nội dung mới ngay sau khi xuất bản.'),
    ('MSG-PASSWORD-REJECTED', 'Mật khẩu này chưa được chấp nhận. Hãy chọn mật khẩu khác dài hơn và khó đoán hơn.'),
    ('MSG-PASSWORD-MISMATCH', 'Hai lần nhập mật khẩu chưa giống nhau. Hãy nhập lại.')
  ) as c(key, template)
  where c.key = p_key
$$;

-- Catalog sentence with `{placeholder}` filled from p_values; an unknown key gives MSG-GENERIC (BR-M03-L13)
create function app.render_message(p_key text, p_values jsonb default '{}') returns text
language plpgsql immutable
set search_path = ''
as $$
declare
  v_text text := coalesce(app.message_template(p_key), app.message_template('MSG-GENERIC'));
  v_name text;
  v_value text;
begin
  for v_name, v_value in select key, value #>> '{}' from jsonb_each(coalesce(p_values, '{}')) loop
    v_text := replace(v_text, '{' || v_name || '}', coalesce(v_value, ''));
  end loop;
  return v_text;
end;
$$;

create function app.field_label_base(p_item_type text, p_field_key text) returns text
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

-- Same rule as fieldLabel() in fieldLabels.ts: list indexes dropped; `.vi`/`.en` add "(tiếng Việt)"/"(tiếng Anh)"
create function app.field_label(p_item_type text, p_field_key text) returns text
language plpgsql immutable
set search_path = ''
as $$
declare
  v_parts text[];
  v_language text;
  v_label text;
begin
  select array_agg(part order by ord) into v_parts
  from unnest(string_to_array(p_field_key, '.')) with ordinality as p(part, ord)
  where part !~ '^\d+$';
  v_language := v_parts[array_length(v_parts, 1)];
  if v_language in ('vi', 'en') then
    v_parts := v_parts[1:array_length(v_parts, 1) - 1];
  else
    v_language := null;
  end if;
  v_label := app.field_label_base(p_item_type, array_to_string(v_parts, '.'));
  if v_label is null or v_language is null then
    return v_label;
  end if;
  return v_label || case v_language when 'vi' then ' (tiếng Việt)' else ' (tiếng Anh)' end;
end;
$$;

-- ValidationIssue (spec-M03 §5.1; admin-command §3). The label is the editor label of the field, the message the
-- catalog sentence already filled in; ids and keys are never shown (BR-M03-L10).
create function app.issue(
  p_severity text,
  p_item_type text,
  p_item_id text,
  p_field_key text,
  p_message_key text,
  p_values jsonb default '{}',
  p_field_label text default null
) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'severity', p_severity,
    'fieldLabel', coalesce(p_field_label, app.field_label(p_item_type, p_field_key), p_field_key),
    'message', app.render_message(p_message_key, p_values),
    'messageKey', p_message_key,
    'targetItemType', p_item_type,
    'targetItemId', p_item_id,
    'targetFieldKey', p_field_key
  )
$$;

-- ---------------------------------------------------------------------------
-- CommandResult (admin-command §2; R-06)
-- ---------------------------------------------------------------------------

create function app.cr_ok(p_message_key text, p_data jsonb default 'null') returns jsonb
language sql immutable
set search_path = ''
as $$ select jsonb_build_object('ok', true, 'messageKey', p_message_key, 'data', coalesce(p_data, 'null'::jsonb)) $$;

-- messageKey of a VALIDATION result is the key of its first issue
create function app.cr_validation(p_issues jsonb) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'ok', false, 'reason', 'VALIDATION',
    'messageKey', coalesce(p_issues -> 0 ->> 'messageKey', 'MSG-GENERIC'),
    'issues', coalesce(p_issues, '[]'::jsonb)
  )
$$;

create function app.cr_busy(p_item_name text) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'reason', 'BUSY', 'messageKey', 'MSG-ROUTE-BUSY',
    'busy', jsonb_build_object('itemName', p_item_name))
$$;

create function app.cr_forbidden() returns jsonb
language sql immutable
set search_path = ''
as $$ select jsonb_build_object('ok', false, 'reason', 'FORBIDDEN', 'messageKey', 'MSG-NO-PERMISSION') $$;

-- values hold display values only (names, numbers, hh:mm, dd/mm/yyyy), never ids or codes (BR-M03-L10, L13)
create function app.cr_blocked(p_message_key text, p_values jsonb default '{}', p_issues jsonb default null) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'reason', 'BLOCKED', 'messageKey', p_message_key,
    'values', coalesce(p_values, '{}'::jsonb))
    || case when p_issues is null then '{}'::jsonb else jsonb_build_object('issues', p_issues) end
$$;

create function app.cr_failed(p_message_key text default 'MSG-GENERIC') returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'reason', 'FAILED',
    'messageKey', case when p_message_key in ('MSG-PUBLISH-FAILED', 'MSG-CLOSE-FAILED') then p_message_key else 'MSG-GENERIC' end)
$$;

-- STALE names who changed the item and when: the editor's normalized email (R-09), never the user id
create function app.cr_stale(p_editor_user_id text, p_edited_at timestamptz) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object('ok', false, 'reason', 'STALE', 'messageKey', 'MSG-STALE',
    'stale', jsonb_build_object(
      'editorEmail', coalesce((select a.email from app.admin_accounts a where a.user_id = p_editor_user_id), 'quản trị viên'),
      'editedAt', to_char(p_edited_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
$$;

-- ---------------------------------------------------------------------------
-- Rejections travel as an exception so the inner block's writes roll back (R-07)
-- ---------------------------------------------------------------------------

-- SQLSTATE of a business rejection; the message carries the CommandResult as JSON
create function app.reject(p_result jsonb) returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'CPQRJ', message = p_result::text;
end;
$$;

-- The CommandResult for an error caught by a command's inner block: a rejection gives its own result;
-- anything else is a failure with the operation's failure key, and never leaks Postgres text (BR-M03-L13)
create function app.result_from_error(p_sqlstate text, p_message text, p_failure_key text default 'MSG-GENERIC')
returns jsonb
language plpgsql immutable
set search_path = ''
as $$
begin
  if p_sqlstate = 'CPQRJ' then
    return p_message::jsonb;
  end if;
  return app.cr_failed(p_failure_key);
end;
$$;

-- The calling active administrator with an allowed role ('B' both roles, 'R' Reviewer only), or FORBIDDEN
-- (admin-command §7; BR-M03-A02–A04). Callers without an account are refused before anything else.
create function app.require_admin(p_roles text) returns app.admin_accounts
language plpgsql stable
set search_path = ''
as $$
declare
  v_admin app.admin_accounts := app.current_admin();
begin
  if v_admin.email is null or (p_roles = 'R' and v_admin.role <> 'REVIEWER') then
    perform app.reject(app.cr_forbidden());
  end if;
  return v_admin;
end;
$$;

-- Stale-write rejection (BR-M03-F06, DAC-M03-016): the submitted concurrency_revision must equal the stored one
create function app.expect_revision(
  p_submitted integer,
  p_current integer,
  p_editor_user_id text,
  p_edited_at timestamptz
) returns void
language plpgsql stable
set search_path = ''
as $$
begin
  if p_submitted is distinct from p_current then
    perform app.reject(app.cr_stale(p_editor_user_id, p_edited_at));
  end if;
end;
$$;

-- One operation at a time on a connected set (BR-M03-F05; PT-06; R-08). p_items: [{ "key": "route:<id>" |
-- "checkpoint:<id>", "name": "<display name>" }]. Locks are taken in key order (no deadlock) and never waited
-- for: the first busy key answers BUSY with its name. Transaction-level, released at commit or rollback.
create function app.lock_connected_set(p_items jsonb) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item record;
begin
  for v_item in
    select distinct on (e.item ->> 'key') e.item ->> 'key' as key, e.item ->> 'name' as name
    from jsonb_array_elements(coalesce(p_items, '[]')) as e(item)
    order by e.item ->> 'key'
  loop
    if not pg_try_advisory_xact_lock(hashtextextended(v_item.key, 0)) then
      perform app.reject(app.cr_busy(coalesce(v_item.name, '')));
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Audit (Physical §5.8; R-07; BR-M03-F08): exactly one line per command, written after the inner block.
-- A reason that does not satisfy the column rule (blank or too long — the very cause of a rejection) is not
-- stored, so the FAILURE line itself never fails. States must not carry credentials or tokens (DAC-M03-075).
-- ---------------------------------------------------------------------------

create function app.audit(
  p_actor_user_id text,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_outcome text,
  p_reason text default null,
  p_revision integer default null,
  p_self_published boolean default null,
  p_before jsonb default null,
  p_after jsonb default null
) returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into app.audit_records (
    actor_user_id, action, entity_type, entity_id, revision, reason, outcome, self_published, before_state, after_state)
  values (
    -- an actor without an account (refused caller) is recorded as server-side: the FK allows only account ids
    (select a.user_id from app.admin_accounts a where a.user_id = p_actor_user_id),
    p_action, p_entity_type, coalesce(p_entity_id, ''), p_revision,
    case when app.reason_ok(btrim(p_reason)) then btrim(p_reason) end,
    p_outcome, p_self_published, p_before, p_after);
end;
$$;
