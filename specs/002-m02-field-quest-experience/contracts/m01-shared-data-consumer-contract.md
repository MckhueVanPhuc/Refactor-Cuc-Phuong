# Contract — LanguagePreference, SelectedRouteContext v3, ready OfflinePackage (M01 → M02, phía consumer)

| Mục | Giá trị |
|---|---|
| Producer | M01 (plan [specs/001](../../001-m01-route-planning-preparation/plan.md): contracts `language-preference`, `selected-route-context-v3`, `offline-package`) |
| Consumer | M02 (FN-M02-001, 004, 005; FR-M02-001, 004, 010, 014, 020, 025) |
| Tên contract | **`LanguagePreference`**, **`SelectedRouteContext v3`**, ready **`OfflinePackage`** (AGENTS.md §3.2; giữ nguyên tên và version) |
| Nguồn hình dạng | [spec-M02](../../../docs/spec/spec-M02.md) §5.1 "SelectedRouteContext v3 input", "Content inputs" = spec-M01 §5.3 (cùng payload; M02 không định nghĩa lại hay mở rộng) |
| Transport | IndexedDB dùng chung (Physical §11), đọc **chỉ** qua bề mặt `src/modules/m01/index.ts` |
| Schema | `src/shared/contracts/languagePreference.ts`, `selectedRouteContext.ts`, `offlinePackage.ts` — M01 sở hữu |

## 1. Ranh giới

M02 đọc, không bao giờ ghi dữ liệu của M01 (FR-M02-020; constitution II). M02 không đọc `packageCandidates` hay bất kỳ giá trị staging nào. M02 không dựng lại hành trình từ M03: journey của phiên chỉ là bản sao manifest của handoff (spec-M02 §1).

## 2. Các hàm M02 dùng

| Hàm (M01) | M02 dùng khi | Hành vi M02 |
|---|---|---|
| `useLanguagePreference()`, `resolveDisplayLanguage(stored, navigator.language)` | mọi màn | nhánh `vi`/`en` cho chữ, tên checkpoint, danh sách audio/video (FR-M02-014; BR-M02-026) |
| `LanguageControl` | header mọi màn M02, kể cả `/q/…` | nút VI/EN; mọi lần ghi do M01 thực hiện (BR-M02-024) |
| `readSelectedRouteContext()` | vào `/trip` (trong transaction tạo phiên) | xem §3 |
| `readActiveOfflinePackage(routeId)` | nội dung offline/lỗi nguồn; cảnh báo gói cũ | chỉ nhận `SAN_SANG`; dùng `manifest`, `resources`, `versionStatus`, `contentVersion`; bỏ qua `offlineRouteMap`, `routeEssentials` |
| `findOfflineResource(routeId, qrIdentifier)` | nội dung gói của đúng mã đã quét | không có → "Chưa có nội dung offline cho điểm này." (offline) — không phải mã không hợp lệ (BR-M02-018; SC-M02-012) |
| `readPackageImage(routeId, contentVersion, sourceRef)` | ảnh của nội dung gói | `Blob` → object URL |

## 3. Kiểm tra handoff (M02)

`readSelectedRouteContext()` trả kết quả phân biệt `NONE` | `INVALID` | `OK` (contract `selected-route-context-v3` §3 của M01; quyết định D-01 ở [research.md](../research.md) §5).

| Điều kiện | Nguồn | Khi sai |
|---|---|---|
| Có context và qua schema `SelectedRouteContextV3` (`contractVersion = 3`, `routeId` = `routeJourneyManifest.routeId`, …) | spec-M02 §5.1; DAC-M01-002, 004 | `INVALID` → thông báo rõ, bắt đầu lại từ M01; không chuyển đổi version 2 (SC-M02-010) |
| `authorizationStatus = AUTHORIZED` | BR-M02-017 | từ chối |
| `handoffId` chưa là `sourceHandoffId` của phiên nào | BR-M02-001; FR-M02-003 | từ chối (hoặc khôi phục nếu đó là phiên đang chạy, [research.md](../research.md) R-06) |
| giờ thiết bị < `expiresAt` | BR-M02-017 | từ chối; không bao giờ kết thúc phiên đã có |

Khi chấp nhận: `routeId`, `routeJourneyManifest.contentVersion` và bản sao `routeJourneyManifest.checkpoints` vào `PlaySession` (FR-M02-004).

## 4. Dùng gói

| Tình huống | Hành vi | Nguồn |
|---|---|---|
| Mã thuộc checkpoint `OFFLINE_REQUIRED`, có resource | chữ + ảnh của resource, không có media | FR-M02-010; SC-M02-011 |
| Gói cũ hơn manifest của phiên, có resource cùng `qrIdentifier` | dùng resource, hiện cảnh báo gói cũ | spec-M02 §5.1 |
| `versionStatus = OUTDATED` hoặc `package.contentVersion < session.contentVersion` | hiện cảnh báo gói cũ | spec-M02 §5.1 ("when known") |
| Checkpoint `ONLINE_AVAILABLE` | thông báo không có nội dung offline | US-M02-03 mục 3 |
| Không có gói `SAN_SANG` | như thiếu resource | BR-M02-018 |

## 5. Truy vết test

| Kiểm thử | FR / BR / SC |
|---|---|
| Context v2, `REVOKED`, đã dùng, quá hạn → không tạo phiên, thông báo bắt đầu lại | FR-M02-001; SC-M02-001, 010 |
| Không có context → khôi phục phiên đang chạy hoặc chế độ khách tự do | US-M02-01 mục 4; SF-M02-008-01 |
| Không có đường ghi nào từ M02 vào store M01 (kiểm import + spy Dexie) | FR-M02-020 |
| Đổi ngôn ngữ trên `/q/…` ghi qua M01; M02 không ghi | BR-M02-024 |
| Resource thiếu ≠ mã không hợp lệ | SC-M02-012 |
