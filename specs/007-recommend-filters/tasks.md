# Tasks — 007 Gợi ý tuyến chọn nhiều, "Hướng dẫn viên", "Đi theo đoàn" (CHG-REC-2026-11-28-01)

Nguồn: [change brief](change-brief-CHG-REC-2026-11-28-01.md) (APPROVED 2026-11-28). Thứ tự spec-first: brief → spec → tài liệu dẫn xuất → migration → code → test.

## Phase 1 — Spec và tài liệu

- [x] T001 spec-M01 v3.3: US-M01-02, §4.2, FR-M01-004, Published Route input (`guideTags`, `GROUP_DI_THEO_DOAN`), BR-M01-003, RecommendationContext, SC-M01-002, §11.2, change notes
- [x] T002 spec-M03 v3.8: FR-M03-001, §5.1 Published Route và nhãn, BR-M03-C12, editor bước 3, §5.5 gợi ý "Hướng dẫn viên", §6.1, §6.3 ngoại lệ D7, giả định, §11, change notes
- [x] T003 spec-Mascot v1.11: US-MAS-07 mục 2, BR-MAS-07, MSG-MAS-010, MSG-MAS-015, change notes
- [x] T004 Dẫn xuất: MVP-Scope, data/04, 06, 08, screen spec SCR-M01-002 và SCR-M03-002, docs/mascot (behavior matrix, dialogue library, state machine), contract mascot event, publication-public-contract, data-model 003, spec 001, design-system §7

## Phase 2 — Database (local stack)

- [x] T010 Migration `20261128090000_rec_01_guide_tags_group_di_theo_doan.sql`: `display_name`, `field_label_base`, `revision_content_problems`, `normalize_route_content`, `route_save_issues`, `route_publish_issues`, `route_changes` (trích nguyên văn bản mới nhất, chỉ sửa phần nhãn); view `api.published_routes` thêm `guide_tags` ở cuối; chuyển dữ liệu một lần D5–D7
- [x] T011 pgTAP `rec_01_guide_tags.test.sql`; cập nhật m03_02, us3–us6, us8

## Phase 3 — Code

- [x] T020 Contract dùng chung: `guideTag`, `GROUP_DI_THEO_DOAN`; schema producer chặt và schema consumer chịu tag lạ và `guideTags` vắng (D9); ánh xạ cột `guide_tags`
- [x] T021 M03: kiểu DTO, tên hiển thị, nhãn trường, gợi ý, form và bước 3 editor, kiểm mâu thuẫn chỉ với Gia đình có trẻ nhỏ, "Còn thiếu" có Hướng dẫn viên, adapter giả, nhật ký thay đổi
- [x] T022 M01: so khớp HOẶC trong nhóm / VÀ giữa nhóm / nhóm trống không lọc; form ô chọn nhiều, chạm lại để bỏ, "Bỏ chọn tất cả"; nhóm thứ tư; chip mọi ý ở trang kết quả; nhãn vi/en; icon `guide.svg`
- [x] T023 Mila: `m01.recommend.opened { fromResults }`; quay lui từ trang kết quả thì DOCK không bong bóng; MSG-MAS-010, 015 mới

## Phase 4 — Kiểm thử

- [x] T030 Unit: recommend, contract, row mapping, publishGaps, route validation, display names, hints, SQL catalog, mascot rules, RecommendPage, RecommendResultsPage
- [x] T031 E2E: m01 recommend, mascot-prepare, mascot-revisit, no-raw-codes; m03 routes
- [ ] T032 Người vận hành cloud áp migration lên Shared Backend **trước** khi deploy frontend (brief §9)
- [ ] T033 Cán bộ sửa nhãn hai tuyến bắt buộc hướng dẫn viên và xem lại Khu Cổng vườn (brief D5, D6)
