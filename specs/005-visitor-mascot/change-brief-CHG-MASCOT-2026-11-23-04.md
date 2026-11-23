# Change Brief CHG-MASCOT-2026-11-23-04 — Giới thiệu dạng lớp phủ, đầu màn danh mục, công tắc chuyển động ở Tài nguyên

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-23-04 |
| Trạng thái | **APPROVED** (2026-11-23). Được sửa tài liệu theo §6.1, cập nhật gói 005 và code theo §6.2 |
| Người duyệt | Chủ dự án (người dùng của phiên làm việc; duyệt trong chat 2026-11-23: "duyệt, triển khai hết"). Chấp nhận ba điểm của §11 và các đề xuất (EN câu 001, dấu "!", Back/Esc đóng, 88 px, vị trí công tắc). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-23 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.2 → v1.3) và hình thức của [design-system](../../docs/design/design-system.md) §9. Không đổi rule, dữ liệu, contract hay thứ tự ghi của M01, M02, M03 |
| Liên quan | [CHG-MASCOT-2026-11-22-02](change-brief-CHG-MASCOT-2026-11-22-02.md), [CHG-MASCOT-2026-11-23-03](change-brief-CHG-MASCOT-2026-11-23-03.md) (APPROVED); thử trên điện thoại và quyết định của chủ dự án trong chat ngày 2026-11-23; mockup đã duyệt hướng |

## 1. Source

Chủ dự án thử trên điện thoại thật ngày 2026-11-23 (Android, Chrome, mạng LAN, stack local, PR #70–#72), có 4 ảnh chụp màn hình và 5 nhận xét. Sau đó duyệt mockup (lớp phủ giới thiệu, đầu màn danh mục ở 390 và 320 px). Rule liên quan: spec-Mascot US-MAS-01, BR-MAS-02, BR-MAS-21, §5.1, §5.4, §5.6 (001, 002, 056), SC-MAS-011, SC-MAS-014, OD-MAS-17, OD-MAS-18; design-system §9.2, §9.3; screen spec SCR-M01-001, SCR-M01-004.

## 2. Current → New

| # | Hiện tại | Mong muốn | Quyết định 2026-11-23 |
|---|---|---|---|
| 1 | Nút "Chuyển động: bật/tắt" ở header của mọi màn du khách (M01 và M02) | **Bỏ khỏi header.** Một công tắc "Chuyển động của Mila" duy nhất ở màn **Tài nguyên** (SCR-M01-004). Mặc định bật; thiết bị yêu cầu giảm chuyển động thì bắt đầu ở tắt (như hiện tại). Trạng thái vẫn chỉ trong lần tải trang, không lưu | A, đặt ở Tài nguyên |
| 2 | Sau khi chọn ngôn ngữ lần đầu: Mila lớn hiện trong đầu màn danh mục, nói 001 rồi 002, danh mục dùng được ngay. Bong bóng giữ sẵn chỗ cho cả câu nên trông trống khi chữ đang hiện dần (ảnh 1) | **Lớp phủ giới thiệu** (mục 3): Mila và một bong bóng ở **chính giữa màn**, nền mờ che cả màn; dòng "Chạm để bắt đầu". Chạm để đọc xong và đóng. **Không có nút "Bỏ qua"** | Phương án (b), câu mới, căn giữa, bỏ "Bỏ qua" |
| 3 | Đầu màn danh mục: nút "Gợi ý tuyến" và Mila cùng hàng, Mila cao làm thừa khoảng trống phía trên nút; dải đồi trang trí bị ẩn khi có Mila (ảnh 2) | **Hai cột** (mục 4): trái là tiêu đề và "Gợi ý tuyến"; phải là dải đồi, Mila đứng trên đồi. Đầu màn cao bằng Mila | Ổn (mockup) |
| 4 | Chạm Mila ở danh mục: Mila nhảy sang trái, bong bóng nằm cạnh, danh sách bị đẩy và dải đồi mất (ảnh 3) | Mila **giữ nguyên chỗ**; bong bóng mở ngay dưới đầu màn, đuôi chỉ lên Mila; chỉ danh sách trượt xuống, trượt về khi bong bóng đóng | Ổn (mockup) |
| 5 | 056: "Giờ cất máy và ngắm rừng thôi! Ở điểm sau nhớ quét mã nhé." | "Bây giờ tham quan thôi! Ở điểm sau nhớ quét mã nhé." | OK (cả bản EN) |

## 3. Lớp phủ giới thiệu (thay chế độ `INTRO` trong đầu màn)

| Mục | Nội dung |
|---|---|
| Khi nào | Như hiện tại: một lần, ngay sau khi chọn ngôn ngữ lần đầu (chưa có `LanguagePreference`). Mở bằng link `/q/...` thì không hiện |
| Bố cục | Nền `--color-m01-deep` mờ phủ **cả màn** (header, nội dung, thanh tab). Bong bóng "giấy dã ngoại" và Mila 200 px (ảnh vẫy tay MA-01) **căn giữa theo chiều dọc và ngang**; dưới Mila là dòng gợi ý "Chạm để bắt đầu" / "Tap to start" |
| Lời (MSG-MAS-001, một bong bóng) | VI: "Chào bạn! Mình là Mila, rái cá thám hiểm của Cúc Phương. Mình sẽ đồng hành cùng bạn trong suốt chuyến tham quan này. Cùng chọn một tuyến nhé!" · EN (nháp): "Hi! I'm Mila, Cúc Phương's otter explorer. I'll be with you throughout this visit. Let's pick a route!" |
| MSG-MAS-002 | Bỏ (gộp vào 001) |
| Chạm | Chạm bất kỳ đâu trên lớp phủ: chữ đang hiện dần thì hiện hết; chữ đã hiện hết thì lớp phủ đóng, Mila về chỗ đứng ở đầu danh mục (`DOCK`) |
| Thoát khác | Nút Back của điện thoại và phím Esc đóng ngay. Không có nút "Bỏ qua" và không có nút đóng × trên bong bóng này |
| Không tự đóng | Lớp phủ chờ du khách chạm (không tự ẩn theo thời gian đọc) |
| Trợ năng | `role="dialog"`, `aria-modal="true"`, tên "Mila"; focus vào lớp phủ khi mở, trả về tiêu đề trang khi đóng; Enter/Space như chạm. Câu đầy đủ đọc một lần (chữ hiện dần chỉ để nhìn, như R-20) |
| Giảm chuyển động / công tắc tắt | Không animation, chữ hiện ngay; vẫn là lớp phủ chờ chạm |
| Lỗi | Ảnh Mila hỏng hoặc lỗi engine → không hiện lớp phủ, danh mục như cũ (BR-MAS-16) |

**Cần chấp nhận khi duyệt (ngoại lệ của luật hiện có):**

- BR-MAS-02 và US-MAS-01 ghi Mila không bao giờ che màn và danh mục dùng được ngay trong lúc giới thiệu. Lớp phủ là **ngoại lệ duy nhất**: một lần, ngay sau khi chọn ngôn ngữ, đóng bằng một lần chạm.
- §5.4 "Bubble length ≤ 90 ký tự, tối đa 2 câu": câu giới thiệu mới dài khoảng 140 ký tự, 3 câu. Đề xuất ghi ngoại lệ cho riêng câu 001 (bong bóng lớp phủ rộng hơn, không tự ẩn). SC-MAS-006 (≤ 90 ký tự) chỉ áp cho câu của catalog, không cho 001 — ghi rõ.
- OD-MAS-18 (xác nhận sau lời giới thiệu, đã hoãn 2026-11-22) → **Đã quyết** bằng lớp phủ này.

## 4. Đầu màn danh mục (SCR-M01-001)

| Mục | Nội dung |
|---|---|
| Bố cục | Lưới hai cột. Trái: tiêu đề "Danh mục tuyến" (một dòng) và nút "Gợi ý tuyến" xếp dọc. Phải: dải đồi trang trí (`hills`) và Mila `DOCK` đứng trên đồi |
| Cỡ Mila | 112 px như hiện tại khi màn rộng ≥ 360 px; **88 px** khi hẹp hơn (320 px), để tiêu đề không xuống dòng. Thêm token `--mascot-size-dock-catalog-narrow` (88px) |
| Dải đồi | Luôn hiện, nằm sau Mila (bỏ luật ẩn đồi khi có Mila của Phase 12) |
| Bong bóng (chạm Mila, các câu khác ở danh mục) | Mở **dưới** đầu màn, toàn chiều rộng tối đa `--mascot-bubble-max-width` căn phải, đuôi chỉ lên Mila. Mila không đổi chỗ. Danh sách tuyến trượt xuống bằng chiều cao bong bóng (chuyển động `--duration-mascot-pop`; giảm chuyển động thì không trượt) và trượt về khi bong bóng đóng. Bong bóng không che nút, tiêu đề hay thẻ tuyến |

## 5. Công tắc chuyển động ở Tài nguyên (SCR-M01-004)

- Một hàng "Chuyển động của Mila" với công tắc bật/tắt (`role="switch"`, `aria-checked`), dưới tiêu đề màn, trên danh sách gói. Câu phụ ngắn: "Tắt để Mila đứng yên."
- Bỏ `MascotMotionToggle` khỏi `VisitorLayout` và `FieldLayout`.
- **WCAG 2.2.2:** cơ chế dừng chuyển động vẫn có, nhưng ở một màn khác (tab Tài nguyên) thay vì trên mỗi màn. Trên màn chuyến đi (M02), du khách phải rời chuyến đi để tới tab Tài nguyên. Cần chấp nhận điểm này khi duyệt; SC-MAS-014 sửa thành "… trừ khi công tắc chuyển động có trong app (SCR-M01-004)".

## 6. Phạm vi file được phép (sau khi duyệt)

### 6.1 Tài liệu

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | v1.3: US-MAS-01 (lớp phủ), BR-MAS-02 (ngoại lệ lớp phủ), BR-MAS-21 (công tắc ở SCR-M01-004), §5.1 (`INTRO` thành lớp phủ; cỡ 88 px ở màn hẹp), §5.4 (ngoại lệ độ dài câu 001), §5.6 (001 mới, bỏ 002, 056 mới), SC-MAS-006, SC-MAS-014, OD-MAS-17 (ghi chú), OD-MAS-18 (đã quyết), §12 |
| `docs/design/design-system.md` | §9.2 token `--mascot-size-dock-catalog-narrow`; §9.3 lớp phủ giới thiệu và bong bóng dưới đầu màn danh mục; vị trí công tắc chuyển động |
| `docs/mascot/*.md` | Behavior Matrix (MAS-B-001, 002, 009, 056), Dialogue Library, State Machine (`INTRO` modal), Asset spec (AN-INTRO), Testing Checklist |
| `screens/screen-spec/M01/screen-spec-SCR-M01-001.md` | Hero hai cột, lớp phủ giới thiệu, bong bóng dưới hero, bỏ nút chuyển động ở header |
| `screens/screen-spec/M01/screen-spec-SCR-M01-004.md` | Hàng công tắc "Chuyển động của Mila" |
| `screens/screen-spec/M02/screen-spec-SCR-M02-001.md` | Bỏ nút chuyển động ở header; câu 056 mới |
| `docs/function list/function-list-Mascot.md`, `README.md`, `docs/README.md` | Đồng bộ |

### 6.2 Gói Spec-Kit và code

| Đường dẫn | Nội dung |
|---|---|
| `specs/005-visitor-mascot/**` | spec, research (lớp phủ, công tắc), contracts, quickstart, tasks: **Phase 18** mới |
| `src/shared/mascot/**`, `src/app/mascot/**` | Lớp phủ giới thiệu; câu 001 mới, bỏ 002, 056 mới; công tắc dùng lại `motion.ts` |
| `src/modules/m01/catalog/CatalogPage.tsx` (+ `.module.css`) | Hero hai cột, dải đồi luôn hiện, slot bong bóng dưới hero |
| `src/modules/m01/offline-package/OfflinePage.tsx` (+ `.module.css`) | Hàng công tắc chuyển động |
| `src/modules/m01/layout/VisitorLayout.tsx`, `src/modules/m02/layout/FieldLayout.tsx` | Bỏ nút chuyển động khỏi header |
| `src/shared/ui/tokens.css` | Token cỡ 88 px |
| `e2e/**` | Lớp phủ (chạm, Back, Esc, focus, giảm chuyển động); hero ở 320/390 px không chồng chéo; công tắc ở Tài nguyên dừng cử chỉ |

## 7. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role, lifecycle, field, DAC, validation, contract liên module | Không đổi |
| Screen | SCR-M01-001 (hero, lớp phủ), SCR-M01-004 (công tắc), header của SCR-M01-* và SCR-M02-* (bỏ nút) |
| Accessibility | Lớp phủ là hộp thoại có focus và thoát bằng Back/Esc; công tắc chuyển động chuyển sang một màn (mục 5) |
| Dữ liệu | Không lưu gì mới (BR-MAS-18) |
| MVP priority | Mila vẫn Could: tắt cờ Mila thì không có lớp phủ, không có công tắc, header như trước khi có Mila |

## 8. Explicit non-goals

- Không đổi bước chọn ngôn ngữ, danh sách tuyến hay bất kỳ câu cố định nào của M01/M02.
- Không lưu trạng thái công tắc chuyển động hay việc đã xem giới thiệu (vẫn theo `LanguagePreference` như hiện tại).
- Không thêm dependency, không backend.

## 9. Thứ tự sau khi duyệt

1. spec-Mascot v1.3, design-system §9.
2. Bộ thiết kế, screen spec SCR-M01-001, 004, SCR-M02-001, function list, README.
3. Gói 005: Phase 18 (test viết trước).
4. Code Phase 18, thử lại trên điện thoại.

## 10. Validation gates

- `npm run ci`, `npx playwright test` PASS (cổng kiểm trống trước khi chạy).
- Test: lớp phủ chỉ hiện một lần sau khi chọn ngôn ngữ; chạm lần đầu hiện hết chữ, lần sau đóng; Back/Esc đóng; focus vào và trả về; không có nút "Bỏ qua".
- Test bố cục 320/360/390/430 px: tiêu đề một dòng, Mila không đè nút/tiêu đề/thẻ tuyến, bong bóng dưới hero không che gì.
- Test: header không còn nút chuyển động; tắt công tắc ở Tài nguyên thì không còn cử chỉ tự động trên mọi màn (SC-MAS-011).

## 11. Khi duyệt

Người duyệt điền "Người duyệt", "Ngày duyệt", đổi trạng thái thành **APPROVED**, và xác nhận ba điểm ở mục 3 (ngoại lệ "không che màn", ngoại lệ độ dài câu 001) và mục 5 (công tắc chỉ ở Tài nguyên với WCAG 2.2.2). Bản EN của câu 001 có thể sửa khi duyệt.

## 12. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-23 | Thử trên điện thoại; mockup lớp phủ và đầu màn danh mục | Chủ dự án chốt hướng |
| 2026-11-23 | Duyệt brief; không thử lại trên điện thoại trước khi đẩy PR | APPROVED |
