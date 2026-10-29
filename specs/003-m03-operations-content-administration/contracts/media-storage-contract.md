# Contract — Media và Storage (M03 producer; M01/M02 consumer của object đã công khai)

| Mục | Giá trị |
|---|---|
| Producer | M03 (FN-M03-004; FR-M03-004; BR-M03-C14, E04, E14, E17, G08) |
| Consumer | M03 UI (upload, xem trước); M01 (tải byte ảnh để dùng offline); M02 (ảnh, audio, video khi online) |
| Lưu trữ | Supabase Storage bucket private `quest-media` (Physical §9); metadata trong `app.media` ([data-model.md](../data-model.md) §2.5) |
| Nguyên tắc | Storage và Postgres không chung transaction: tải lên và xác minh trước, tham chiếu sau. Không ghi đè, không xóa object mà snapshot còn giữ (tech-stack §5; constitution IV, V) |

## 1. Upload một tệp (SCR-M03-002, SCR-M03-003)

Mỗi tệp trong một lần chọn được xử lý **độc lập** (BR-M03-E14):

| Bước | Ai | Hành vi | Từ chối |
|---|---|---|---|
| 1 | UI | Kiểm tra trước loại MIME (§5.3: `image/jpeg`, `image/png`, `image/webp`, `audio/mpeg`, `audio/mp4`, `video/mp4`), kích thước theo loại (`IMAGE_MAX_MB`/`AUDIO_MAX_MB`/`VIDEO_MAX_MB`, provisional), số tệp còn lại được phép, AV chỉ cho `ONLINE_AVAILABLE` | MSG-FILE-TYPE, MSG-FILE-TOO-BIG, MSG-COUNT-IMAGES, MSG-COUNT-AV, MSG-AV-OFFLINE; tệp chuyển sang "Không tải được" |
| 2 | UI → Storage | `storage.from('quest-media').upload('uploads/{ownerType}/{ownerId}/{uploadKey}', file, { upsert: false, contentType })`; `uploadKey` = UUID ngẫu nhiên ở client, chỉ dùng làm tên object ([research.md](../research.md) R-11) | lỗi mạng → "Không tải được" + MSG-NETWORK-FAILED; các tệp khác vẫn tiếp tục |
| 3 | UI → RPC | `register_media` (C-04) với `ownerType`, `ownerId`, `usage`, `type`, `objectPath`, `spokenLanguage?` | |
| 4 | Server | Xác minh object có tồn tại trong `storage.objects`; `metadata.size` > 0 và trong giới hạn; `metadata.mimetype` khớp `type`; usage/owner hợp lệ (DAC-M03-055–058); sinh `media_id`; `source_ref` = `objectPath`; `usage_rights_confirmed = false` | VALIDATION MSG-FILE-TYPE / MSG-FILE-TOO-BIG; object không tồn tại → FAILED |
| 5 | UI | Tệp ở trạng thái "Đã tải" + MSG-UPLOADED-NOT-SAVED cho tới khi "Lưu bản nháp" thành công (BR-M03-F11) | |

Sau một lần chọn có nhiều hơn một tệp: MSG-UPLOAD-SUMMARY. Một tệp lỗi không bao giờ xóa các tệp đã tải thành công.

## 2. Gắn vào bản nháp

"Lưu bản nháp" (C-01/C-03) ghi danh sách media có thứ tự trong `content`, cùng tick quyền sử dụng **từng tệp** và `spokenLanguage` từng tệp AV (BR-M03-E14, E17). Server kiểm tra: media thuộc owner; usage và type đúng chỗ dùng; AV chỉ khi điểm dừng `ONLINE_AVAILABLE` (MSG-AV-OFFLINE); số lượng trong giới hạn. Tick quyền ghi `usage_rights_confirmed_by_user_id` và `usage_rights_confirmed_at`.

## 3. Lúc xuất bản

Guard (Physical §8): mọi media được tham chiếu đã xác nhận quyền (MSG-RIGHTS-NOT-CONFIRMED); mọi AV có `spokenLanguage` (MSG-AV-LANGUAGE-MISSING); với điểm dừng `OFFLINE_REQUIRED`, mọi ảnh còn được lưu và đọc được (MSG-IMAGE-NOT-READABLE; BR-M03-D04 điều 4). AV chỉ có một ngôn ngữ → cảnh báo MSG-AV-ONE-LANGUAGE ở review, không chặn (BR-M03-E17).

## 4. Quyền đọc và ghi Storage

| Actor | Insert object | Đọc object / tạo signed URL | Update / xóa |
|---|---|---|---|
| `anon`, authenticated không có tài khoản | ✗ | chỉ object được tham chiếu bởi media dùng trong một revision `PHAT_HANH` hoặc nằm trong một snapshot còn giữ (Physical §9) | ✗ |
| Admin `ACTIVE` | ✓ (trong `uploads/`, không upsert) | như trên **+ mọi object trong `quest-media`** (plan decision R-12, dùng cho xem trước F12 và thumbnail editor) | ✗ |
| `service_role` | server-side | server-side | không có policy client; object còn được snapshot giữ không bao giờ bị xóa |

Consumer nhận `sourceRef`, không bao giờ nhận URL đã ký có sẵn trong contract. URL hoặc signed URL không được tính là "đã tải" cho gói offline (constitution VI; việc của M01). Workbox không cache response media đã ký.

## 5. Giữ lại và dọn dẹp

- Dòng `app.media` không bao giờ bị xóa; object được tham chiếu không bao giờ bị ghi đè (Physical §5.5).
- Object đã tải nhưng không đăng ký, hoặc media không còn được tham chiếu, được để nguyên. Dọn dẹp là thao tác vận hành theo yêu cầu, chỉ áp cho object **không** được revision nào hoặc snapshot còn giữ nào tham chiếu. Không có scheduler (tech-stack §5; constitution VII).

## 6. Truy vết test

| Kiểm thử | BR / SC |
|---|---|
| Nhiều tệp, một tệp lỗi → các tệp còn lại vẫn "Đã tải" | E14; SC-M03-033 |
| Lưu lỗi không xóa tệp đã tải | F11; SC-M03-033 |
| AV bị từ chối ở điểm dừng `OFFLINE_REQUIRED`; đổi mode chặn khi còn AV | E04, D02; SC-M03-025 |
| AV thiếu `spokenLanguage` → chưa sẵn sàng | E17; SC-M03-039 |
| `anon` không đọc được object nháp; admin đọc được | R-12; BR-M03-I04 |
| Client không ghi đè được object đã có (`upsert:false` + policy) | constitution IV |
