# Checklist truy vết BR / SC / DAC → test — M01

Tasks T098 (constitution "Testing & Validation"; plan.md "Validation Strategy"). Mỗi BR-M01, SC-M01, DAC-M01 có ít nhất một test tự động trên network mock. Đường dẫn tương đối so với gốc repo. Cột "Tích hợp thật" điền ở T106 theo lần chạy CI 41562721605 (job `local-stack`, stack Supabase local trong runner GitHub, `workflow_dispatch` trên `feat/m01-integration`): T104 và V4, V10, V17, V22 pass; mục khác chỉ được kiểm trên network mock.

## Business rules

| ID | Nội dung (spec-M01 §8) | Test | Tích hợp thật |
|---|---|---|---|
| BR-M01-001 | Chỉ `vi`/`en`; đổi ngôn ngữ không đổi gói; M01 là writer duy nhất | `src/shared/contracts/languagePreference.test.ts`; `src/modules/m01/storage/languageWriter.test.ts`; `src/modules/m01/language/LanguageControl.test.tsx`; `src/modules/m01/architecture.test.ts`; `e2e/m01/language.spec.ts` (V1, V3) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| BR-M01-002 | Danh mục và gợi ý chỉ dùng tuyến hoạt động có version xuất bản | `src/modules/m01/catalog/selectableRoutes.test.ts`; `src/shared/contracts/publication.consumer.test.ts`; `src/modules/m01/recommendation/recommend.test.ts`; `e2e/m01/catalog.spec.ts` (V4) | PASS — CI run 41562721605, `m01-local-stack` V4, T104 |
| BR-M01-003 | Gợi ý khớp cả ba nhóm, 0..N, không nới | `src/modules/m01/recommendation/recommend.test.ts`; `src/modules/m01/recommendation/RecommendPage.test.tsx`; `e2e/m01/recommend.spec.ts` (V23) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| BR-M01-004 | Gói = một tuyến/version, đủ manifest, một resource mỗi QR `OFFLINE_REQUIRED`, mọi ảnh khai báo | `src/modules/m01/offline-package/buildCandidate.test.ts`; `src/shared/contracts/offlinePackage.test.ts`; `e2e/m01/offline-package.spec.ts` (V10) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| BR-M01-005 | Độ hoàn chỉnh và độ mới là hai khái niệm tách biệt | `src/modules/m01/storage/packageWriter.test.ts`; `src/modules/m01/offline-package/OfflinePage.test.tsx` (trạng thái chữ); `e2e/m01/offline-package.spec.ts` (V12) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| BR-M01-006 | Gói cũ dùng được khi candidate mới đang dựng hoặc lỗi | `src/modules/m01/storage/packageWriter.test.ts` (quota → rollback); `src/modules/m01/offline-package/packageOps.test.ts`; `src/modules/m01/offline-package/lazyUpdate.test.ts`; `e2e/m01/offline-package.spec.ts` (V12, V13) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| BR-M01-007 | Có thể tiếp tục không tải khi online sau cảnh báo | `src/modules/m01/route-detail/OfflineDecisionDialog.test.tsx`; `src/modules/m01/route-detail/RouteDetailPage.test.tsx` ("Tiếp tục không tải"); `e2e/m01/offline-package.spec.ts` (V9) | PASS — CI run 41562721605, `m01-local-stack` V17 (Tiếp tục không tải) |
| BR-M01-008 | Start online dùng nguồn hiện hành; offline cần gói sẵn sàng | `src/modules/m01/start/chooseStartPath.test.ts`; `e2e/m01/start.spec.ts` (V17, V19, V20) | PASS — CI run 41562721605, `m01-local-stack` V17 |
| BR-M01-009 | Mỗi Start tạo handoff mới, thay context | `src/modules/m01/start/buildContext.test.ts`; `src/modules/m01/storage/contextWriter.test.ts`; `e2e/m01/start.spec.ts` (V18) | PASS — CI run 41562721605, `m01-local-stack` V17 |
| BR-M01-010 | M01 không sở hữu/sửa trạng thái M02 | `src/modules/m01/start/revocationEffect.test.ts`; `src/modules/m01/storage/packageWriter.test.ts` (xóa gói); `src/modules/m01/architecture.test.ts`; `e2e/m01/route-unavailable.spec.ts` (V22) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| BR-M01-011 | Tuyến đóng chặn Start mới, context hiện tại `REVOKED` | `src/modules/m01/storage/revokeContext.test.ts`; `src/modules/m01/start/revocationEffect.test.ts`; `src/modules/m01/start/chooseStartPath.test.ts`; `e2e/m01/route-unavailable.spec.ts` (V22) | PASS — CI run 41562721605, `m01-local-stack` V22 |
| BR-M01-012 | Cần gói khi một trong hai cờ `true`; snapshot thắng cờ | `src/modules/m01/offline-package/needsPackage.test.ts`; `src/modules/m01/catalog/selectableRoutes.test.ts` (dấu); `src/modules/m01/offline-package/buildCandidate.test.ts` (resources rỗng) | PASS — CI run 41562721605, `m01-local-stack` V4 (dấu cần tải trước), V10 |
| BR-M01-013 | Ảnh bìa/gallery chỉ online; sơ đồ offline chỉ khi snapshot có | `src/modules/m01/offline-package/buildCandidate.test.ts`; `src/modules/m01/route-detail/detailView.test.ts`; `e2e/m01/route-detail.spec.ts` (SC-M01-008) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| BR-M01-014 | Chữ cốt lõi không có version; hiện thời điểm lưu; làm mới sau đọc thành công | `src/modules/m01/route-detail/detailView.test.ts`; `src/modules/m01/offline-package/lazyUpdate.test.ts`; `src/modules/m01/storage/packageWriter.test.ts` (`refreshEssentials`); `e2e/m01/route-detail.spec.ts` | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| BR-M01-015 | `expiresAt` = `authorizedAt` + 24 giờ; M01 không gia hạn, không đổi trạng thái vì thời gian | `src/shared/contracts/selectedRouteContext.test.ts`; `src/modules/m01/start/buildContext.test.ts`; `src/modules/m01/start/startRoute.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V17 |
| BR-M01-016 | Dung lượng ước tính không bao giờ chặn hay đổi Tải | `src/modules/m01/format.test.ts`; `src/modules/m01/route-detail/OfflineDecisionDialog.test.tsx`; `e2e/m01/offline-package.spec.ts` (V9) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |

## Success criteria

| ID | Test | Tích hợp thật |
|---|---|---|
| SC-M01-001 | `src/modules/m01/catalog/selectableRoutes.test.ts`; `src/shared/contracts/publication.consumer.test.ts`; `e2e/m01/catalog.spec.ts` (V4) | PASS — CI run 41562721605, `m01-local-stack` V4 |
| SC-M01-002 | `src/modules/m01/recommendation/recommend.test.ts`; `e2e/m01/recommend.spec.ts` (V23) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| SC-M01-003 | `src/modules/m01/storage/packageWriter.test.ts`; `src/modules/m01/storage/readers.test.ts` (candidate không lộ); `e2e/m01/offline-package.spec.ts` (V10, V11) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| SC-M01-004 | `src/modules/m01/storage/packageWriter.test.ts`; `src/modules/m01/offline-package/packageOps.test.ts`; `e2e/m01/offline-package.spec.ts` (V12) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| SC-M01-005 | `src/modules/m01/start/buildContext.test.ts`; `e2e/m01/start.spec.ts` (V17) | PASS — CI run 41562721605, `m01-local-stack` V17 |
| SC-M01-006 | `src/modules/m01/start/chooseStartPath.test.ts`; `e2e/m01/start.spec.ts` (V19, V20) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| SC-M01-007 | `src/modules/m01/offline-package/buildCandidate.test.ts`; `src/modules/m01/storage/readers.test.ts` (thiếu byte → `null`); `e2e/m01/offline-package.spec.ts` (V11) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| SC-M01-008 | `src/modules/m01/route-detail/RouteDetailPage.test.tsx`; `e2e/m01/route-detail.spec.ts` | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| SC-M01-009 | `src/modules/m01/route-detail/OfflineDecisionDialog.test.tsx`; `e2e/m01/offline-package.spec.ts` (V9) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| SC-M01-010 | `src/modules/m01/start/chooseStartPath.test.ts`; `src/modules/m01/route-detail/RouteDetailPage.test.tsx` (tuyến B không qua dialog) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |

## Data acceptance criteria

| ID | Test | Tích hợp thật |
|---|---|---|
| DAC-M01-001 | `src/shared/contracts/languagePreference.test.ts`; `src/modules/m01/storage/languageWriter.test.ts` | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| DAC-M01-002 | `src/shared/contracts/selectedRouteContext.test.ts` (version 2 bị từ chối); `src/modules/m01/storage/readers.test.ts` (`INVALID`) | PASS — CI run 41562721605, `m01-local-stack` V17 |
| DAC-M01-003 | `src/shared/contracts/selectedRouteContext.test.ts` (UUID); `src/shared/db/visitorDb.test.ts`, `src/modules/m01/storage/contextWriter.test.ts` (unique `handoffId`) | PASS — CI run 41562721605, `m01-local-stack` V17 |
| DAC-M01-004 | `src/shared/contracts/selectedRouteContext.test.ts` (`routeId` = manifest) | PASS — CI run 41562721605, `m01-local-stack` V17 |
| DAC-M01-005 | `src/shared/contracts/selectedRouteContext.test.ts` (lệch 1 ms); `src/modules/m01/start/buildContext.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V17 |
| DAC-M01-006 | `src/shared/contracts/selectedRouteContext.test.ts`; `src/modules/m01/storage/revokeContext.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V22 |
| DAC-M01-007 | `src/shared/contracts/selectedRouteContext.test.ts`; `src/modules/m01/start/buildContext.test.ts`; `src/modules/m01/offline-package/buildCandidate.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V10, V17 |
| DAC-M01-008 | `src/shared/contracts/offlinePackage.test.ts`; `src/modules/m01/storage/packageWriter.test.ts` (một gói active) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| DAC-M01-009 | `src/shared/contracts/offlinePackage.test.ts` (`versionStatus` khi `SAN_SANG`); `src/modules/m01/storage/readers.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V10 |
| DAC-M01-010 | `src/shared/contracts/offlinePackage.test.ts` (caption); `src/modules/m01/storage/readers.test.ts` (byte sơ đồ); `src/modules/m01/offline-package/buildCandidate.test.ts` | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| DAC-M01-011 | `src/shared/contracts/offlinePackage.test.ts` (essentials); `src/modules/m01/storage/packageWriter.test.ts` (`refreshEssentials` từ chối giá trị hỏng) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| DAC-M01-012 | `src/modules/m01/storage/packageWriter.test.ts` (`downloadedAt` khi kích hoạt) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| DAC-M01-013 | `src/modules/m01/storage/packageWriter.test.ts` (một transaction, rollback) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| DAC-M01-014 | `src/shared/contracts/offlinePackage.test.ts`; `src/modules/m01/offline-package/buildCandidate.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V10 |
| DAC-M01-015 | `src/shared/contracts/offlinePackage.test.ts`; `src/modules/m01/storage/readers.test.ts` (byte rỗng/thiếu) | PASS — CI run 41562721605, `m01-local-stack` V10 |
| DAC-M01-016 | `src/modules/m01/route-detail/OfflineDecisionDialog.test.tsx` (nút Tải luôn bật) | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |
| DAC-M01-017 | `src/modules/m01/catalog/selectableRoutes.test.ts`; `src/shared/contracts/publication.consumer.test.ts` | PASS — CI run 41562721605, `m01-local-stack` V4, T104 |
| DAC-M01-018 | `src/modules/m01/recommendation/recommend.test.ts` | NOT RUN — chỉ có ở network mock (ngoài V4, V10, V17, V22 của T105) |

## Còn thiếu

Không có BR, SC hay DAC nào của M01 thiếu test tự động trên network mock.
