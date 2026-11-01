# Checklist — BR-M03 → test (tasks T162)

Bảng mọi BR-M03 còn hiệu lực của [spec-M03](../../../docs/spec/spec-M03.md) §5.2 (136 dòng, trừ C13 và E08 đã retire) → các file test trích BR đó. Cột "Giai đoạn B" để trống, điền ở T200. Sinh từ chính các file test (tìm "BR-M03-…" kể cả dạng "BR-M03-H01, H03" và "H01–H04") ngày 2026-11-01; BR không có test riêng ghi rõ nhóm đích hoặc package chịu test (constitution "Testing & Validation").

| BR | Test giai đoạn A | Giai đoạn B (T200) | Ghi chú |
|---|---|---|---|
| BR-M03-A01 | `src/modules/m03/api/contract/accounts.contract.ts` |  |  |
| BR-M03-A02 | `src/modules/m03/auth/RequireAdmin.test.tsx` |  |  |
| BR-M03-A03 | `src/modules/m03/api/contract/accounts.contract.ts`<br>`src/modules/m03/api/contract/history.contract.ts`<br>`src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/auth/RequireAdmin.test.tsx`<br>`src/modules/m03/history/AuditLogPage.test.tsx`<br>`src/modules/m03/operations/ReopenDialog.test.tsx` |  |  |
| BR-M03-A04 | `src/modules/m03/auth/LoginPage.test.tsx` |  |  |
| BR-M03-A05 | `src/modules/m03/api/contract/audit.contract.ts`<br>`src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx` |  |  |
| BR-M03-B01 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/route-admin/RouteEditorPage.test.tsx`<br>`src/modules/m03/visit-points/VisitPointEditorPage.test.tsx` |  |  |
| BR-M03-B02 | `src/modules/m03/api/contract/checkpoints.contract.ts` |  |  |
| BR-M03-B03 | `src/modules/m03/api/contract/checkpoints.contract.ts` |  |  |
| BR-M03-B04 | `src/modules/m03/visit-points/qr-print/renderQr.test.ts` |  |  |
| BR-M03-B05 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/visit-points/qr-print/renderQr.test.ts` |  |  |
| BR-M03-C01 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/route-admin/RouteEditorPage.test.tsx` |  |  |
| BR-M03-C02 | `src/modules/m03/validation/route.test.ts` |  |  |
| BR-M03-C03 | `src/modules/m03/route-admin/RouteEditorPage.test.tsx`<br>`src/modules/m03/validation/route.test.ts` |  |  |
| BR-M03-C04 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/validation/publishGaps.test.ts` |  |  |
| BR-M03-C05 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/editor/useDraftForm.stale.test.tsx` |  |  |
| BR-M03-C06 | `src/modules/m03/validation/publishGaps.test.ts` |  |  |
| BR-M03-C07 | `src/modules/m03/route-admin/RouteEditorPage.test.tsx` |  |  |
| BR-M03-C08 | `src/modules/m03/route-admin/RouteEditorPage.test.tsx` |  |  |
| BR-M03-C09 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx`<br>`src/modules/m03/validation/publishGaps.test.ts`<br>`src/modules/m03/validation/route.test.ts` |  |  |
| BR-M03-C10 | `src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx` |  |  |
| BR-M03-C11 | `src/modules/m03/route-admin/RouteEditorPage.test.tsx`<br>`src/modules/m03/validation/routeDerived.test.ts`<br>`src/shared/contracts/publishedRoute.test.ts` |  |  |
| BR-M03-C12 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/route-admin/RouteEditorPage.test.tsx`<br>`src/modules/m03/validation/route.test.ts` |  |  |
| BR-M03-C13 | — | — | Đã retire |
| BR-M03-C14 | `src/modules/m03/api/contract/media.contract.ts`<br>`src/modules/m03/validation/publishGaps.test.ts` |  |  |
| BR-M03-C15 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-C16 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/route-admin/RouteEditorPage.test.tsx`<br>`src/modules/m03/validation/route.test.ts` |  |  |
| BR-M03-C17 | `src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-T01 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/route-admin/RouteEditorPage.test.tsx` |  |  |
| BR-M03-T02 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx`<br>`src/modules/m03/route-admin/RouteEditorPage.test.tsx` |  |  |
| BR-M03-T03 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-T04 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/validation/publishGaps.test.ts` |  |  |
| BR-M03-T05 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-T06 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-T07 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/ArchiveDialog.test.tsx` |  |  |
| BR-M03-T08 | `src/modules/m03/validation/routeDerived.test.ts` |  |  |
| BR-M03-T09 | `src/modules/m03/validation/route.test.ts` |  |  |
| BR-M03-D01 | `src/modules/m03/validation/checkpoint.test.ts` |  |  |
| BR-M03-D02 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx`<br>`src/modules/m03/validation/checkpoint.test.ts` |  |  |
| BR-M03-D03 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx`<br>`src/modules/m03/validation/checkpoint.test.ts` |  |  |
| BR-M03-D04 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx`<br>`src/modules/m03/validation/checkpoint.test.ts` |  |  |
| BR-M03-D05 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx` |  |  |
| BR-M03-D06 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-D07 | `src/modules/m03/api/contract/audit.contract.ts`<br>`src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/visit-points/VisitPointLifecycle.test.tsx` |  | Trỏ sang nhóm E (T074, T078, T081); E11 là phần riêng của D07 |
| BR-M03-D08 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/ArchiveDialog.test.tsx`<br>`src/modules/m03/operations/CloseDialog.test.tsx`<br>`src/modules/m03/operations/ReopenDialog.test.tsx` |  | Trỏ sang H01, H02, H04 (đóng), H06 (mở lại), D10 (lưu trữ) |
| BR-M03-D09 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx` |  |  |
| BR-M03-D10 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/ArchiveDialog.test.tsx` |  |  |
| BR-M03-D11 | `src/modules/m03/api/contract/checkpoints.contract.ts` |  |  |
| BR-M03-D12 | `src/modules/m03/api/fake/store.test.ts` |  |  |
| BR-M03-X01 | `src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-X02 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx` |  |  |
| BR-M03-X03 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx` |  |  |
| BR-M03-X04 | `src/shared/contracts/liveQrLookup.cases.test.ts`<br>`src/shared/contracts/liveQrLookup.test.ts` |  | Tóm tắt của I01–I06 (spec-M03 3.7 clarification 8) |
| BR-M03-X05 | `src/modules/m03/api/contract/reports.contract.ts`<br>`src/modules/m03/reports/ReportsPage.test.tsx`<br>`src/modules/m03/reports/reportInput.test.ts` |  | Tóm tắt của J05–J07 (clarification 8) |
| BR-M03-X06 | `src/modules/m03/api/contract/audit.contract.ts`<br>`src/modules/m03/api/contract/operations.contract.ts` |  |  |
| BR-M03-X07 | `src/modules/m03/api/contract/accounts.contract.ts`<br>`src/modules/m03/api/contract/history.contract.ts`<br>`src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/auth/RequireAdmin.test.tsx`<br>`src/modules/m03/history/AuditLogPage.test.tsx`<br>`src/modules/m03/operations/ReopenDialog.test.tsx` |  | Tóm tắt của A02, A03 (clarification 8) |
| BR-M03-E01 | `src/shared/contracts/liveQrLookup.cases.test.ts` |  |  |
| BR-M03-E02 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/validation/visitPoint.test.ts` |  |  |
| BR-M03-E03 | `src/modules/m03/validation/visitPoint.test.ts` |  |  |
| BR-M03-E04 | `src/modules/m03/validation/visitPoint.test.ts` |  |  |
| BR-M03-E05 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/validation/visitPoint.test.ts` |  |  |
| BR-M03-E06 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-E07 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/visit-points/VisitPointLifecycle.test.tsx` |  |  |
| BR-M03-E08 | — | — | Đã retire |
| BR-M03-E09 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/visit-points/VisitPointLifecycle.test.tsx` |  |  |
| BR-M03-E10 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/visit-points/VisitPointLifecycle.test.tsx` |  |  |
| BR-M03-E11 | `src/modules/m03/api/contract/audit.contract.ts`<br>`src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/visit-points/VisitPointLifecycle.test.tsx` |  |  |
| BR-M03-E12 | `src/modules/m03/api/contract/checkpoints.contract.ts` |  |  |
| BR-M03-E13 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx` |  |  |
| BR-M03-E14 | `src/modules/m03/api/contract/media.contract.ts`<br>`src/modules/m03/editor/noAutosave.test.tsx`<br>`src/modules/m03/media/useUploadQueue.test.ts`<br>`src/modules/m03/visit-points/VisitPointEditorPage.test.tsx` |  |  |
| BR-M03-E15 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx`<br>`src/modules/m03/visit-points/VisitPointEditorPage.test.tsx` |  |  |
| BR-M03-E16 | `src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx`<br>`src/modules/m03/validation/visitPoint.test.ts`<br>`src/modules/m03/visit-points/VisitPointEditorPage.test.tsx` |  |  |
| BR-M03-E17 | `src/modules/m03/validation/visitPoint.test.ts`<br>`src/modules/m03/visit-points/VisitPointEditorPage.test.tsx` |  |  |
| BR-M03-F01 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx` |  |  |
| BR-M03-F02 | `src/modules/m03/api/contract/checkpoints.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx` |  |  |
| BR-M03-F03 | `src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx` |  |  |
| BR-M03-F04 | `src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-F05 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx` |  |  |
| BR-M03-F06 | `src/modules/m03/api/contract/accounts.contract.ts`<br>`src/modules/m03/api/contract/history.contract.ts`<br>`src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/api/contract/store.contract.ts`<br>`src/modules/m03/editor/useDraftForm.stale.test.tsx`<br>`src/modules/m03/operations/CloseDialog.test.tsx` |  |  |
| BR-M03-F07 | `src/modules/m03/api/contract/history.contract.ts`<br>`src/modules/m03/history/RestoreAndDiscard.test.tsx` |  |  |
| BR-M03-F08 | `src/modules/m03/api/contract/audit.contract.ts`<br>`src/modules/m03/history/AuditLogPage.test.tsx`<br>`src/modules/m03/history/auditFormat.test.ts` |  |  |
| BR-M03-F09 | `src/modules/m03/api/contract/history.contract.ts`<br>`src/modules/m03/history/AuditLogPage.test.tsx`<br>`src/modules/m03/history/ItemHistoryPanel.test.tsx` |  |  |
| BR-M03-F10 | `src/modules/m03/api/contract/history.contract.ts`<br>`src/modules/m03/history/RestoreAndDiscard.test.tsx` |  |  |
| BR-M03-F11 | `src/modules/m03/editor/noAutosave.test.tsx`<br>`src/modules/m03/editor/useDraftForm.test.tsx`<br>`src/modules/m03/editor/useUnsavedChangesGuard.test.tsx`<br>`src/modules/m03/visit-points/VisitPointEditorPage.test.tsx` |  |  |
| BR-M03-F12 | `src/modules/m03/visit-points/preview/VisitorPreview.test.tsx` |  |  |
| BR-M03-G01 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-G02 | `src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-G03 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-G04 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-G05 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx` |  |  |
| BR-M03-G06 | `src/modules/m03/api/contract/publish-revise.contract.ts` |  |  |
| BR-M03-G07 | `src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx` |  |  |
| BR-M03-G08 | `src/modules/m03/api/fake/store.test.ts` |  |  |
| BR-M03-G09 | `src/modules/m03/api/contract/publish-route.contract.ts` |  |  |
| BR-M03-G10 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/api/contract/publish-revise.contract.ts`<br>`src/modules/m03/api/contract/publish-route.contract.ts`<br>`src/modules/m03/operations/ReopenDialog.test.tsx`<br>`src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx`<br>`src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx` |  |  |
| BR-M03-H01 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/CloseDialog.test.tsx` |  |  |
| BR-M03-H02 | `src/modules/m03/api/contract/operations.contract.ts` |  |  |
| BR-M03-H03 | `src/modules/m03/api/contract/operations.contract.ts` |  |  |
| BR-M03-H04 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/CloseDialog.test.tsx` |  |  |
| BR-M03-H05 | `src/modules/m03/api/contract/operations.contract.ts` |  |  |
| BR-M03-H06 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/ReopenDialog.test.tsx` |  |  |
| BR-M03-H07 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/ReopenDialog.test.tsx` |  |  |
| BR-M03-H08 | `src/modules/m03/api/contract/operations.contract.ts` |  |  |
| BR-M03-H09 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/operations/ArchiveDialog.test.tsx` |  |  |
| BR-M03-I01 | `src/shared/contracts/liveQrLookup.cases.test.ts` |  |  |
| BR-M03-I02 | `src/shared/contracts/liveQrLookup.cases.test.ts` |  |  |
| BR-M03-I03 | `src/shared/contracts/liveQrLookup.cases.test.ts`<br>`src/shared/contracts/liveQrLookup.test.ts` |  |  |
| BR-M03-I04 | `src/shared/contracts/liveQrLookup.cases.test.ts` |  |  |
| BR-M03-I05 | — |  | Hành vi của consumer: package M01 (tasks M01) và M02 (tasks M02) chịu test |
| BR-M03-I06 | — |  | Hành vi của consumer: package M02 chịu test |
| BR-M03-J01 | `src/shared/contracts/sessionSyncRecord.cases.test.ts`<br>`src/shared/contracts/sessionSyncRecord.test.ts` |  |  |
| BR-M03-J02 | `src/shared/contracts/sessionSyncRecord.cases.test.ts` |  |  |
| BR-M03-J03 | `src/shared/contracts/sessionSyncRecord.cases.test.ts` |  |  |
| BR-M03-J04 | `src/shared/contracts/sessionSyncRecord.cases.test.ts` |  |  |
| BR-M03-J05 | `src/modules/m03/api/contract/reports.contract.ts`<br>`src/modules/m03/reports/ReportsPage.test.tsx`<br>`src/modules/m03/reports/reportInput.test.ts` |  |  |
| BR-M03-J06 | `src/modules/m03/api/contract/reports.contract.ts`<br>`src/modules/m03/reports/ReportsPage.test.tsx` |  |  |
| BR-M03-J07 | `src/modules/m03/api/contract/reports.contract.ts`<br>`src/modules/m03/reports/ReportsPage.test.tsx` |  |  |
| BR-M03-J08 | `src/modules/m03/reports/ReportsPage.test.tsx` |  |  |
| BR-M03-K01 | `src/modules/m03/accounts/AccountsPage.test.tsx`<br>`src/modules/m03/api/contract/accounts.contract.ts`<br>`src/modules/m03/auth/InvitationPage.test.tsx` |  |  |
| BR-M03-K02 | `src/modules/m03/auth/InvitationPage.test.tsx` |  |  |
| BR-M03-K03 | `src/modules/m03/accounts/AccountsPage.test.tsx`<br>`src/modules/m03/api/contract/accounts.contract.ts` |  |  |
| BR-M03-K04 | — |  | Chỉ phía server, không có bề mặt UI/API ở giai đoạn A: script cấp Quản lý đầu tiên và pgTAP ở giai đoạn B (T179) |
| BR-M03-K05 | `src/modules/m03/auth/LoginPage.test.tsx` |  |  |
| BR-M03-K06 | `src/modules/m03/auth/useSignOut.test.tsx` |  |  |
| BR-M03-L01 | `src/modules/m03/route-admin/RouteEditorPage.test.tsx`<br>`src/modules/m03/validation/checkpoint.test.ts`<br>`src/modules/m03/validation/route.test.ts`<br>`src/modules/m03/validation/visitPoint.test.ts` |  |  |
| BR-M03-L02 | `src/modules/m03/editor/fieldIssues.test.tsx`<br>`src/modules/m03/editor/serverIssueMapping.test.tsx` |  |  |
| BR-M03-L03 | `src/modules/m03/editor/MissingToPublishPanel.test.tsx`<br>`src/modules/m03/validation/publishGaps.test.ts` |  |  |
| BR-M03-L04 | `src/modules/m03/editor/serverIssueMapping.test.tsx`<br>`src/modules/m03/messages/fieldLabels.test.ts` |  |  |
| BR-M03-L05 | `src/modules/m03/editor/useDraftForm.stale.test.tsx`<br>`src/modules/m03/operations/CloseDialog.test.tsx` |  |  |
| BR-M03-L06 | `src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx`<br>`src/modules/m03/editor/serverIssueMapping.test.tsx`<br>`src/modules/m03/editor/useDraftForm.test.tsx` |  |  |
| BR-M03-L07 | `src/modules/m03/api/contract/operations.contract.ts`<br>`src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx` |  |  |
| BR-M03-L08 | `src/modules/m03/contracts/contracts.test.ts` |  |  |
| BR-M03-L09 | `e2e/m03/forbidden-words.spec.ts` |  |  |
| BR-M03-L10 | `e2e/m03/forbidden-words.spec.ts`<br>`src/modules/m03/api/contract/audit.contract.ts`<br>`src/modules/m03/api/errors.test.ts`<br>`src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx`<br>`src/modules/m03/history/ItemHistoryPanel.test.tsx`<br>`src/modules/m03/history/auditFormat.test.ts` |  |  |
| BR-M03-L11 | `e2e/m03/forbidden-words.spec.ts`<br>`src/modules/m03/history/ItemHistoryPanel.test.tsx`<br>`src/modules/m03/history/auditFormat.test.ts` |  |  |
| BR-M03-L12 | `src/modules/m03/accounts/AccountsPage.test.tsx`<br>`src/modules/m03/editor/confirmations.test.ts`<br>`src/modules/m03/history/RestoreAndDiscard.test.tsx`<br>`src/modules/m03/messages/hints.test.ts` |  |  |
| BR-M03-L13 | `src/modules/m03/messages/catalog.test.ts` |  |  |

## Kết quả

- 134 BR còn hiệu lực: 126 có test trích đúng ID; 5 trỏ sang test của nhóm đích (D07, D08, X04, X05, X07); 2 do package M01/M02 chịu test (I05, I06); 1 chỉ kiểm được ở giai đoạn B (K04).
- Thêm trong T162 (BR trước đó chưa có test): A01 (`accounts.contract.ts`), D11 (`checkpoints.contract.ts`), D12 và G08 (`api/fake/store.test.ts`), E12 (`checkpoints.contract.ts`), T03 (`publish-revise.contract.ts`), L08 (`contracts/contracts.test.ts`), G09 (gắn ID vào ca Q13 của `publish-route.contract.ts`). Hai test mới lộ lỗi của adapter giả và đã sửa: vai trò ngoài hai vai trò cố định được chấp nhận (A01); chỉ đổi ghi chú vị trí lại tạo bản nháp chờ (D11) — validation-report D-73.
