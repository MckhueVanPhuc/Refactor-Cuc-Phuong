# Contract — Xử lý một lần quét: ghi lượt ghé và chọn nguồn nội dung (nội bộ M02)

| Mục | Giá trị |
|---|---|
| Phạm vi | Hàm `processScan(qrIdentifier, origin)` dùng chung cho trình quét trong app (SCR-M02-001) và trang `/q/{qrIdentifier}` (SCR-M02-004); hàm `viewScannedPoint(qrIdentifier)` cho xem lại |
| Nguồn hành vi | [spec-M02](../../../docs/spec/spec-M02.md) §4.1, §4.2, §4.4; BR-M02-005, 008, 009, 014, 015, 018, 019, 020, 021, 024; DAC-M02-006 |
| Phụ thuộc | [live-qr-lookup-consumer-contract.md](live-qr-lookup-consumer-contract.md), [m01-shared-data-consumer-contract.md](m01-shared-data-consumer-contract.md) |

## 1. Đầu vào và bước chuẩn bị

1. `origin = 'scanner'`: phân tích link (live-qr-lookup-consumer §2); sai → **R-INVALID-LINK**, dừng. `origin = 'link'`: áp tự đóng phiên quá 24 giờ trước ([research.md](../research.md) R-09).
2. Đọc phiên `DANG_DIEN_RA` hiện tại từ Dexie (không dùng giá trị React cũ).
3. `J` = checkpoint của journey đóng băng có `qrIdentifiers ∋ qrIdentifier` (có thể không có).
4. Nếu `navigator.onLine !== false`: lookup (có `routeId` khi có phiên), timeout 8 s (**provisional**).

## 2. Bảng quyết định

"Thuộc journey" ở đường online = có `J`, hoặc `content.checkpointId` là `checkpointId` của journey đóng băng (BR-M02-020).

| # | Phiên | Đường | Kết quả | Thuộc journey | Ghi lượt ghé | Hiển thị | Nguồn |
|---|---|---|---|---|---|---|---|
| 1 | có | online | `VALID` | có | có, nếu chưa có | nội dung live của mã | BR-M02-005, 009, 020 |
| 2 | có | online | `VALID` | không | không | nội dung live | BR-M02-008 |
| 3 | không | online | `VALID` | — | không | nội dung live + gợi ý khách tự do + liên kết "Chọn tuyến" | BR-M02-012, 019 |
| 4 | bất kỳ | online | `TEMPORARILY_CLOSED` | bất kỳ | không | thông báo tạm đóng, không nội dung | BR-M02-015; SC-M02-009 |
| 5 | bất kỳ | online | `INVALID` | bất kỳ | không | "Mã không còn hiệu lực hoặc không tồn tại." | US-M02-04 mục 2 |
| 6 | có | offline / lỗi nguồn | — | có `J` | có, nếu chưa có | thông báo lỗi nguồn; `J` là `OFFLINE_REQUIRED` và có resource → nội dung gói; thiếu resource (hoặc không có gói `SAN_SANG`) → "Chưa có nội dung offline cho điểm này."; `J` là `ONLINE_AVAILABLE` → "Điểm này cần có mạng để xem nội dung." (US-M02-03 mục 3; bảng copy SCR-M02-002) | BR-M02-005, 009, 018 |
| 7 | có | offline / lỗi nguồn | — | không có `J` | không | "Cần có kết nối mạng để kiểm tra mã QR này." | BR-M02-020; US-M02-04 mục 4 |
| 8 | không | offline / lỗi nguồn | — | — | không | "Cần có kết nối mạng…" (+ gợi ý khách tự do ở `/q/…`) | spec-M02 §4.4 |
| R-INVALID-LINK | bất kỳ | (không gọi mạng) | — | — | không | thông báo mã không hợp lệ | FR-M02-026 |

Ở dòng 4, 5 có phiên hay không, kết quả hiển thị giống nhau. Ở dòng 2 không có gợi ý khách tự do vì có phiên. Gợi ý khách tự do hiện cho **mọi** kết quả khi không có phiên (US-M02-07).

## 3. Ghi lượt ghé

- Một transaction: phiên còn `DANG_DIEN_RA`; nếu `[sessionId+checkpointId]` chưa có thì chèn `{ sessionId, checkpointId, qrIdentifier (mã vừa quét), checkedInAt = max(now, startedAt) }`. Đã có → không ghi gì, trả lượt ghé cũ (FR-M02-009).
- Commit **trước** khi điều hướng sang nội dung; lỗi tải nội dung/ảnh/media sau đó không gỡ lượt ghé (SC-M02-004).
- `created = true` và checkpoint có `sequence` lớn nhất → mở câu hỏi "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" một lần (BR-M02-021; SC-M02-015).
- Không bao giờ: thêm mã vào journey đóng băng, đổi tuyến, tạo phiên (BR-M02-003, 008; SC-M02-018).

## 4. Xem lại (`viewScannedPoint`)

Chạm một điểm đã quét hoặc tải lại `/trip/qr/:qrIdentifier`: chọn nội dung theo cột "Hiển thị" của bảng trên nhưng **không** ghi lượt ghé; hiện `checkedInAt` gốc theo giờ thiết bị, dạng hh:mm dd/mm/yyyy (OQ-SCR-M02-002-003).

## 5. Truy vết test

| Kiểm thử | FR / BR / SC / DAC |
|---|---|
| Mỗi dòng 1–8 và R-INVALID-LINK của §2 có một test | DAC-M02-006 |
| Hai mã của cùng checkpoint → một lượt ghé, hai nội dung | SC-M02-002, 008 |
| Mã thêm sau, online `VALID` với `checkpointId` của journey → lượt ghé; offline → cần kết nối | SC-M02-014; BR-M02-020 |
| Lỗi nội dung sau khi ghi → lượt ghé còn | SC-M02-004 |
| Điểm cuối quét lần đầu → câu hỏi một lần; quét lại → không hỏi | SC-M02-015 |
| Thứ tự ghé tùy ý được chấp nhận | FR-M02-008 |
| Lookup quá 8 s với mã trong journey → ghi lượt ghé, dùng gói | BR-M02-005 |
| Khách tự do: không có dòng nào trong 3 store M02 sau mọi kết quả | SC-M02-018; FR-M02-019 |
