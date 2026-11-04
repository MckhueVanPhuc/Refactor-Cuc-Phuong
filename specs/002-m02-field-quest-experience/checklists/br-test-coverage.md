# Độ phủ test — M02 Field Quest Experience (BR / SC / DAC → test)

**Tasks**: T098 (lập), T106 (điền cột "Tích hợp thật"). **Ngày lập**: 2026-11-04. **Nguồn**: [spec-M02](../../../docs/spec/spec-M02.md) §5.2, §8; [DAC](../../../data/08-data-acceptance-criteria.md) DAC-M02-001…011.

Đường dẫn test tương đối với gốc repo. `src/modules/m02/` viết tắt là `m02/`; E2E ở `e2e/m02/`. Mọi mục có ít nhất một test tự động (constitution "Testing & Validation"). Cột "Tích hợp thật" (T106, 2026-11-04) là kết quả của `e2e/m02/integration.local.spec.ts` trên stack Supabase local với M01, M03 thật (validation-report §8): `PASS — local Vx` là kịch bản đã chạy; `NOT RUN` là hành vi có dùng M03 nhưng chỉ kiểm bằng mock; `Không áp dụng` là hành vi không chạm producer thật.

## Business rules

| BR | Nội dung (tóm tắt) | Unit / component | E2E | Tích hợp thật |
|---|---|---|---|---|
| BR-M02-001 | Một handoff hợp lệ tạo tối đa một phiên | `m02/session/decideEntry.test.ts`; `m02/storage/createSession.test.ts` (đồng thời, đã dùng) | `session-start.spec.ts` V2 (đã dùng), V4 | PASS — local V5 (Start M01 → một phiên) |
| BR-M02-002 | Tối đa một phiên `DANG_DIEN_RA` mỗi trình duyệt | `m02/storage/createSession.test.ts`; `m02/storage/readers.test.ts` (liveQuery) | `session-start.spec.ts` V4; `cross-tab.spec.ts` | Không áp dụng — chỉ dữ liệu trên thiết bị |
| BR-M02-003 | Manifest sao chép là journey cố định | `m02/storage/createSession.test.ts` (bản sao sâu); `m02/scan/processScan.test.ts` (QN không đổi journey) | `scan.spec.ts` V6 | PASS — local V5, V24 (journey từ snapshot thật qua M01) |
| BR-M02-004 | Lượt ghé duy nhất theo phiên + điểm dừng | `m02/storage/recordVisit.test.ts` | `scan.spec.ts` V5 | PASS — local V5 |
| BR-M02-005 | Chỉ lần quét được chấp nhận mới ghi; ghi trước khi hiện nội dung | `m02/scan/resolveScan.test.ts`; `m02/scan/processScan.test.ts` | `scan.spec.ts` V5, V8; `content.spec.ts` V12 | PASS — local V5, V14 |
| BR-M02-006 | Không ép thứ tự; đánh số liên tục | `m02/journey/RouteJourneyMap.test.tsx`; `m02/scan/processScan.test.ts` (thứ tự tùy ý) | `scan.spec.ts` V1 | Không áp dụng — chỉ dữ liệu trên thiết bị |
| BR-M02-007 | `HOAN_TAT` = đã ghé điểm cuối + xác nhận hoặc tự đóng | `m02/storage/terminalTransition.test.ts`; `m02/session/autoEnd.test.ts`; `m02/end/EndFlow.test.tsx` | `end.spec.ts` V17, V19 | PASS — local V24 (điểm cuối + [Kết thúc], M03 nhận `HOAN_TAT`) |
| BR-M02-008 | Mã ngoài journey không tạo tiến trình | `m02/scan/resolveScan.outside.test.ts` dòng 2 | `outside-closed.spec.ts` V13 | NOT RUN — chỉ mock (V13 ngoài T105) |
| BR-M02-009 | Online dùng nội dung live; gói chỉ khi offline / lỗi tra cứu | `m02/content/selectContentSource.test.ts` | `content.spec.ts` V9, V10, V12 | PASS — local V5, V20 (nội dung live) |
| BR-M02-010 | Dữ liệu phiên terminal bất biến | `m02/storage/terminalTransition.test.ts`; `m02/sync/syncRunner.test.ts` (record giữ nguyên byte) | `end.spec.ts` V17 | PASS — local V24 (gửi lại → `IDENTICAL`) |
| BR-M02-011 | Gửi lại giống hệt idempotent; conflict / bị từ chối dừng thử lại; không thao tác của du khách | `m02/api/intakeClient.test.ts`; `m02/sync/syncRunner.test.ts`; `m02/sync/SyncStatus.test.tsx` | `sync.spec.ts` V24, V25 | PASS — local V24, V25 (409, 422) |
| BR-M02-012 | Khách tự do không tạo dữ liệu | `m02/qr-link/freeVisitor.zeroRecords.test.tsx`; `m02/scan/resolveScan.free.test.ts`; `m02/session/TripPage.free.test.tsx` | `qr-link.spec.ts` V20, V22 | PASS — local V20 |
| BR-M02-013 | Thay phiên all-or-nothing | `m02/storage/replaceSession.test.ts`; `m02/session/TripPage.entry.test.tsx` | `end.spec.ts` V18 (+ nhánh lỗi) | Không áp dụng — chỉ dữ liệu trên thiết bị |
| BR-M02-014 | Nội dung theo từng mã; nhiều mã một điểm = một lượt ghé | `m02/content/ContentPage.test.tsx`; `m02/scan/processScan.test.ts` | `scan.spec.ts` V5 | PASS — local V5 |
| BR-M02-015 | `TEMPORARILY_CLOSED`: thông báo cố định, không nội dung, không lượt ghé | `m02/scan/resolveScan.outside.test.ts` dòng 4; `m02/content/ScanNotice.test.tsx`; `m02/qr-link/QrLinkPage.test.tsx` | `outside-closed.spec.ts` V14 | PASS — local V14 (ROUTE, CHECKPOINT) |
| BR-M02-016 | Audio/video chỉ cho `ONLINE_AVAILABLE`, phát khi bấm | `m02/content/ContentPage.test.tsx`; `m02/content/mediaFilter.test.ts` | `content.spec.ts` V9, V10 | NOT RUN — chỉ mock (dữ liệu local không có audio/video) |
| BR-M02-017 | Handoff dùng được: v3, `AUTHORIZED`, chưa dùng, trước `expiresAt`; hạn không kết thúc phiên đã có | `m02/session/decideEntry.test.ts`; `m02/session/TripPage.entry.test.tsx` | `session-start.spec.ts` V2 | PASS — local V5 (handoff v3 thật của M01) |
| BR-M02-018 | Thiếu resource offline ≠ mã không hợp lệ | `m02/content/selectContentSource.test.ts`; `m02/content/ContentPage.test.tsx` | `content.spec.ts` V10b | NOT RUN — chỉ mock (cần offline) |
| BR-M02-019 | `routeId` chỉ gửi khi có phiên | `m02/api/lookupClient.test.ts`; `m02/scan/resolveScan.free.test.ts`; `m02/qr-link/QrLinkPage.test.tsx` | `scan.spec.ts` V5; `qr-link.spec.ts` V20, V21 | PASS — local V5, V20 |
| BR-M02-020 | Mã thêm sau: online tính qua `content.checkpointId`, offline cần kết nối | `m02/scan/resolveScan.test.ts`; `m02/scan/processScan.test.ts` | `scan.spec.ts` V6, V7 | NOT RUN — chỉ mock (V6, V7 ngoài T105) |
| BR-M02-021 | Câu hỏi cuối chuyến một lần; [Đi tiếp] giữ Finish | `m02/scan/processScan.test.ts` (`finalPromptNeeded`); `m02/end/EndFlow.test.tsx` | `end.spec.ts` V16; `qr-link.spec.ts` V21 | PASS — local V24 |
| BR-M02-022 | Tự đóng phiên quá 24 giờ khi mở / hiện lại | `m02/session/autoEnd.test.ts`; `m02/qr-link/QrLinkPage.test.tsx` | `end.spec.ts` V19 | Không áp dụng — chỉ dữ liệu trên thiết bị |
| BR-M02-023 | Link QR công khai; sai base → mã không hợp lệ, không tra cứu | `m02/scan/parseQrLink.test.ts`; `m02/scan/processScan.test.ts` | `scan-evil.spec.ts` V15; `scan.spec.ts` V15 (hook) | PASS — local V5, V20 (link theo base của môi trường local) |
| BR-M02-024 | Trang `/q/…`: không bước chặn; có phiên = như trong app; không phiên = khách tự do | `m02/qr-link/QrLinkPage.test.tsx`; `src/app/router.m02.test.tsx` | `qr-link.spec.ts` V20, V21 | PASS — local V5, V20 |
| BR-M02-025 | Link QR offline chỉ khi app từng được mở | — (cần service worker) | `qr-link.spec.ts` V22 | NOT RUN — chỉ mock (cần service worker; `npm run dev` không có) |
| BR-M02-026 | Audio/video theo ngôn ngữ hiện tại + `NONE` | `m02/content/mediaFilter.test.ts`; `m02/content/ContentPage.test.tsx` | `content.spec.ts` V9 | NOT RUN — chỉ mock (dữ liệu local không có audio/video) |

## Success criteria

| SC | Nội dung (tóm tắt) | Test | Tích hợp thật |
|---|---|---|---|
| SC-M02-001 | Dùng lại handoff không tạo phiên thứ hai | `m02/storage/createSession.test.ts`; `session-start.spec.ts` V2, V4 | Không áp dụng — chỉ dữ liệu trên thiết bị |
| SC-M02-002 | Nhiều mã một điểm = một lượt ghé | `m02/storage/recordVisit.test.ts`; `scan.spec.ts` V5 | PASS — local V5 |
| SC-M02-003 | Tải lại / offline không mất lượt ghé | `session-start.spec.ts` V3; `scan.spec.ts` V8 | Không áp dụng — chỉ dữ liệu trên thiết bị |
| SC-M02-004 | Lỗi nội dung không gỡ lượt ghé | `m02/scan/processScan.test.ts`; `m02/content/ContentPage.test.tsx`; `scan.spec.ts` V8 | Không áp dụng — lỗi nội dung chỉ tiêm được bằng mock |
| SC-M02-005 | Hoàn tất và độ phủ điểm phân biệt được | `m02/sync/buildSyncRecord.test.ts` (`HOAN_TAT` với một phần điểm); `m02/storage/terminalTransition.test.ts` | Không áp dụng — chỉ dữ liệu trên thiết bị |
| SC-M02-006 | Gửi lại giống hệt không tạo bản ghi trùng | `m02/sync/syncRunner.test.ts`; `sync.spec.ts` V24 (mất response → `IDENTICAL`, một lần ghi) | PASS — local V24 |
| SC-M02-007 | Payload không có PII | `src/shared/contracts/sessionSyncRecord.m02.test.ts`; `m02/sync/buildSyncRecord.test.ts` | PASS — local V24 (allowlist `.strict()` của Edge nhận record) |
| SC-M02-008 | Hai mã một điểm: hai nội dung, một lượt ghé | `m02/content/ContentPage.test.tsx`; `m02/scan/processScan.test.ts` | PASS — local V5 |
| SC-M02-009 | Tạm đóng / `INVALID` không bao giờ ghi lượt ghé hay hiện nội dung | `m02/scan/resolveScan.outside.test.ts`; `outside-closed.spec.ts` V14 | PASS — local V14 |
| SC-M02-010 | Handoff hết hạn / v2 không tạo phiên; hạn không kết thúc phiên đã có | `m02/session/decideEntry.test.ts`; `m02/session/TripPage.entry.test.tsx`; `session-start.spec.ts` V2 | Không áp dụng — chỉ dữ liệu trên thiết bị |
| SC-M02-011 | Không điều khiển media cho `OFFLINE_REQUIRED` hay nội dung gói | `m02/content/ContentPage.test.tsx`; `content.spec.ts` V10 | NOT RUN — chỉ mock (dữ liệu local không có audio/video) |
| SC-M02-012 | Thiếu resource offline không báo là mã không hợp lệ | `m02/content/selectContentSource.test.ts`; `content.spec.ts` V10b | NOT RUN — chỉ mock (cần offline) |
| SC-M02-013 | Không màn nào nói lượt ghé là có mặt | `m02/i18n/i18n.test.ts`; `m02/journey/RouteJourneyMap.test.tsx`; `no-presence-words.spec.ts` V28 (vi, en) | Không áp dụng — chữ cố định của M02, kiểm ở V28 |
| SC-M02-014 | Mã thêm sau vẫn ghi lượt ghé khi online | `m02/scan/processScan.test.ts`; `scan.spec.ts` V6 | NOT RUN — chỉ mock (V6 ngoài T105) |
| SC-M02-015 | Ghi lượt ghé điểm cuối luôn hỏi kết thúc một lần | `m02/end/EndFlow.test.tsx`; `end.spec.ts` V16 | PASS — local V24 |
| SC-M02-016 | Không phiên nào quá 24 giờ còn chạy sau khi mở app | `m02/session/autoEnd.test.ts`; `end.spec.ts` V19 | Không áp dụng — chỉ dữ liệu trên thiết bị |
| SC-M02-017 | Camera điện thoại mở thẳng nội dung | `m02/qr-link/QrLinkPage.test.tsx`; `qr-link.spec.ts` V20 | PASS — local V20 |
| SC-M02-018 | Link QR không bao giờ tạo phiên | `m02/qr-link/freeVisitor.zeroRecords.test.tsx`; `m02/scan/resolveScan.free.test.ts`; `qr-link.spec.ts` V20 | PASS — local V20 |
| SC-M02-019 | Đổi VI/EN đổi chữ và media ngay | `m02/journey/RouteJourneyMap.test.tsx`; `m02/content/ContentPage.test.tsx`; `content.spec.ts` V9 | PASS — local V20 (chữ; không có media) |

## Data acceptance criteria

| DAC | Nội dung (tóm tắt) | Test | Tích hợp thật |
|---|---|---|---|
| DAC-M02-001 | `sessionId` UUID duy nhất; `sourceHandoffId` unique | `m02/storage/rows.test.ts`; `m02/storage/createSession.test.ts`; `session-start.spec.ts` V1 | PASS — local V5, V24 (M03 nhận `sessionId`) |
| DAC-M02-002 | `status` enum; tối đa một `DANG_DIEN_RA` | `m02/storage/rows.test.ts`; `m02/storage/createSession.test.ts`; `cross-tab.spec.ts` | PASS — local V5 |
| DAC-M02-003 | `endedAt` có ⇔ terminal; quy tắc `endedAt` | `m02/storage/rows.test.ts`; `m02/sync/buildSyncRecord.test.ts`; `m02/session/autoEnd.test.ts` | PASS — local V24 |
| DAC-M02-004 | Journey: id / `sequence` duy nhất, `qrIdentifiers` không rỗng | `m02/storage/rows.test.ts` | PASS — local V5 (journey từ snapshot thật) |
| DAC-M02-005 | `CheckpointVisit` identity; lượt đầu bất biến | `m02/storage/rows.test.ts`; `m02/storage/recordVisit.test.ts` | PASS — local V5 |
| DAC-M02-006 | Chỉ ghi khi lần quét được chấp nhận | `m02/scan/resolveScan.test.ts`; `m02/scan/resolveScan.outside.test.ts`; `m02/scan/resolveScan.free.test.ts` | PASS — local V14 |
| DAC-M02-007 | Một mục hàng đợi mỗi phiên terminal; `record` bất biến | `m02/storage/rows.test.ts`; `m02/storage/terminalTransition.test.ts` | PASS — local V24 |
| DAC-M02-008 | Trường gốc của record; `endedAt ≥ startedAt` | `src/shared/contracts/sessionSyncRecord.m02.test.ts`; `m02/sync/buildSyncRecord.test.ts` | PASS — local V24 |
| DAC-M02-009 | `visitedCheckpoints[]`: chuỗi `vi`, `sequence`, `checkedInAt` trong khoảng phiên | `src/shared/contracts/sessionSyncRecord.m02.test.ts`; `m02/sync/buildSyncRecord.test.ts` | PASS — local V24 (tên `vi`, `sequence` khớp snapshot của M03) |
| DAC-M02-010 | `syncStatus`: lỗi giữ `PENDING`; xác nhận → `SYNCED`; conflict / từ chối → `CONFLICT` | `m02/api/intakeClient.test.ts`; `m02/sync/syncRunner.test.ts`; `sync.spec.ts` V24–V26 | PASS — local V24, V25 |
| DAC-M02-011 | Request lookup: `qrIdentifier`; `routeId` chỉ khi có phiên | `m02/api/lookupClient.test.ts`; `m02/scan/parseQrLink.test.ts` | PASS — local V5, V20 |

## Ghi chú

- BR-M02-025 chỉ kiểm được bằng service worker thật (E2E trên bản build preview); không có test unit tương ứng.
- Không mục nào thiếu test tự động; không cần thêm test vào story trước khi đóng phase (T098).
- T106: trong các lần chạy local, `session-intake` chỉ trả 200 (`ACCEPTED`, `IDENTICAL`), 409 (`CONFLICT`) và 422 (`INVALID`) — không có mã HTTP ngoài bảng session-intake §3, nên không có đề xuất L-02 cho package 003. Nhánh giữ `PENDING` với 5xx, 429, mạng lỗi vẫn kiểm bằng mock (`sync.spec.ts` V26; `m02/api/intakeClient.test.ts`).
