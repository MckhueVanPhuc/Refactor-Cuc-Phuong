# Mascot Documentation — Cúc Phương Quest

Bộ tài liệu thiết kế hệ thống hành vi cho mascot rái cá đồng hành của du khách (M01, M02).

| Trường | Giá trị |
|---|---|
| Trạng thái | Tài liệu thiết kế. Quyết định của người dùng 2026-11-21 đã áp vào (tên Mila; không nút ẩn/chế độ yên lặng; chạm để hỏi đơn giản). Hành vi canonical: [spec-Mascot](../spec/spec-Mascot.md) v1.0 (baseline 2026-11-21; brief CHG-MASCOT-2026-11-21-01 APPROVED). Chưa có code |
| Branch khi viết | `feat/m02-end-screen-redesign` (không commit) |
| Phạm vi | Màn du khách M01, M02. M03 không đổi |

## 1. Thứ tự đọc

| # | Tài liệu | Trả lời câu hỏi | Người đọc chính |
|---|---|---|---|
| 1 | [MASCOT_PRODUCT_BRIEF.md](MASCOT_PRODUCT_BRIEF.md) | Mascot là ai, để làm gì, nguyên tắc nào không được phá | Mọi người |
| 2 | [MASCOT_BUSINESS_REQUIREMENTS.md](MASCOT_BUSINESS_REQUIREMENTS.md) | Kết quả kiểm tra repo, yêu cầu, business rule, ảnh hưởng, **quyết định cần chốt** | Chủ dự án, BA |
| 3 | [MASCOT_USER_JOURNEY.md](MASCOT_USER_JOURNEY.md) | Màn nào có thật, hành trình du khách, mascot xuất hiện ở đâu | Product, UX |
| 4 | [MASCOT_BEHAVIOR_MATRIX.md](MASCOT_BEHAVIOR_MATRIX.md) | Trigger → điều kiện → hành động → lời thoại cho từng tình huống | UX, dev, QA |
| 5 | [MASCOT_STATE_MACHINE.md](MASCOT_STATE_MACHINE.md) | Trạng thái, sự kiện, ưu tiên, phát hiện không hoạt động | Dev |
| 6 | [MASCOT_DIALOGUE_LIBRARY.md](MASCOT_DIALOGUE_LIBRARY.md) | Toàn bộ câu VI/EN, cooldown, cấu trúc nội dung | Biên tập, dịch |
| 7 | [MASCOT_ASSET_SPECIFICATION.md](MASCOT_ASSET_SPECIFICATION.md) | Đánh giá ảnh concept, định dạng, danh sách asset, đặc tả tạo ảnh, animation | Họa sĩ, dev |
| 8 | [MASCOT_TECHNICAL_SPECIFICATION.md](MASCOT_TECHNICAL_SPECIFICATION.md) | Kiến trúc frontend, điểm phát sự kiện trong code hiện có, offline, truy cập | Dev |
| 9 | [MASCOT_TESTING_CHECKLIST.md](MASCOT_TESTING_CHECKLIST.md) | Ca kiểm thử | QA, dev |
| 10 | [MASCOT_IMPLEMENTATION_ROADMAP.md](MASCOT_IMPLEMENTATION_ROADMAP.md) | Giai đoạn, phụ thuộc, Definition of Done | Chủ dự án |
| 11 | [MASCOT_IMAGE_PRODUCTION_GUIDE.md](MASCOT_IMAGE_PRODUCTION_GUIDE.md) | Cách tạo ảnh Mila: số lượng, yêu cầu kỹ thuật, prompt từng tư thế, checklist | Người tạo ảnh |

## 2. Vị trí so với nguồn sự thật của repo

Theo AGENTS.md §3.1, hành vi và contract chỉ được định nghĩa trong `docs/spec/`. Từ 2026-11-21, AGENTS.md §4 ghi `docs/mascot/` là bộ thiết kế dẫn xuất từ spec-Mascot, không phải baseline:

- Khi bộ tài liệu này mâu thuẫn với spec-M01, spec-M02, MVP-Scope hay design-system, **các tài liệu đó thắng**.
- Phần hành vi đã được đưa vào [docs/spec/spec-Mascot.md](../spec/spec-Mascot.md) (v1.0, MAS-D-02). Change brief: [CHG-MASCOT-2026-11-21-01](../../specs/005-visitor-mascot/change-brief-CHG-MASCOT-2026-11-21-01.md) (APPROVED). Phần hình thức đã vào design-system §9, câu chữ đã vào bảng copy của screen spec, và `docs/mascot/` là tài liệu thiết kế dẫn xuất (AGENTS.md §4).
- Ánh xạ ID: `MAS-MSG-nnn` ở đây tương ứng `MSG-MAS-nnn` trong spec; `MAS-FR`/`MAS-BR` ở đây là bản thiết kế, ID canonical là `FR-MAS-`/`BR-MAS-` trong spec.
- AGENTS.md §3.1 và §4 đã liệt kê spec-Mascot, `docs/mascot/` và `assets/mascot/` (2026-11-21).

## 3. Nguồn sự thật bên trong bộ tài liệu

| Nội dung | Nguồn thắng |
|---|---|
| Câu chữ | [spec-Mascot §5.6](../spec/spec-Mascot.md); [Dialogue Library](MASCOT_DIALOGUE_LIBRARY.md) giữ metadata (cooldown, thời lượng) |
| Tên và payload sự kiện, ưu tiên, luật không hoạt động | [State Machine](MASCOT_STATE_MACHINE.md) |
| Tư thế và animation (gồm luật chuyển tiếp, ngắt, đồng thời — §6.1, v1.1) | [Asset spec](MASCOT_ASSET_SPECIFICATION.md) |
| Từng tình huống | [Behavior Matrix](MASCOT_BEHAVIOR_MATRIX.md) (tham chiếu ba tài liệu trên) |

## 4. Hệ ID

| Tiền tố | Ý nghĩa | Tài liệu |
|---|---|---|
| `MAS-FR-`, `MAS-BR-`, `MAS-NFR-` | Yêu cầu, business rule, phi chức năng | BRD |
| `MAS-D-` | Quyết định cần chốt | BRD §7 |
| `MAS-B-` | Hành vi | Behavior Matrix |
| `MAS-MSG-` | Lời thoại | Dialogue Library |
| `MA-`, `FX-`, `AN-` | Asset, hiệu ứng, animation | Asset spec |
| `MAS-TC-` | Ca kiểm thử | Testing Checklist |
| `R1`–`R10` | Vai trò mascot | Product Brief §6 |

Mọi ID có tiền tố `MAS-` để không trùng với ID đã phát hành (FR-, BR-, SCR-…; AGENTS.md §3.3). Tham chiếu tới ID của spec (ví dụ BR-M02-021, SC-M02-013) giữ nguyên.

## 5. Nhãn trạng thái

**EXISTING** (đã cài, test tự động PASS), **SPECIFIED** (có trong spec/design-system, chưa thấy trong code), **PROPOSED** (đề xuất mới), **FUTURE** (bị chặn bởi MVP-Scope §4 Won't), **UNKNOWN** (không kiểm chứng được trong repo). Định nghĩa đầy đủ ở [BRD](MASCOT_BUSINESS_REQUIREMENTS.md).
