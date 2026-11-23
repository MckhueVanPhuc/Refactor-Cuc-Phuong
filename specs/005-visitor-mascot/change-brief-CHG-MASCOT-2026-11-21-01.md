# Change Brief CHG-MASCOT-2026-11-21-01 — Mascot Mila đồng hành cùng du khách ở M01 và M02

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-21-01 |
| Trạng thái | **APPROVED** (2026-11-21). Được đồng bộ tài liệu (§4.1), tạo gói Spec-Kit và code frontend theo phạm vi §4 và non-goals §7 |
| Người duyệt | Chủ dự án (người dùng của phiên làm việc; duyệt trong chat 2026-11-21: "theo đề xuất của bạn"). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-21 |
| Loại thay đổi (runbook §4) | Behavioral change mới ([spec-Mascot](../../docs/spec/spec-Mascot.md) v1.0) cộng phạm vi code **chỉ frontend**. Không đổi hành vi, contract, entity hay dữ liệu của spec-M01, spec-M02, spec-M03 |
| Liên quan | [spec-Mascot.md](../../docs/spec/spec-Mascot.md) v1.0; bộ thiết kế [docs/mascot/](../../docs/mascot/README.md); quyết định người dùng 2026-11-20 và 2026-11-21 |

## 1. Source

[spec-Mascot](../../docs/spec/spec-Mascot.md): US-MAS-01…08, FR-MAS-001…010, BR-MAS-01…18, giới hạn tạm §5.4, message catalog §5.6, SC-MAS-001…010. Các rule M01/M02 được trích dẫn và giữ nguyên: spec-M01 US-M01-01…06; spec-M02 FR-M02-007, 009; BR-M02-005, 006, 007, 008, 009, 015, 016, 021, 022, 023, 024; SC-M02-013; §5.1; §6.4.

## 2. Current → New

| Hiện tại | Mong muốn |
|---|---|
| Phản hồi cho du khách chỉ bằng chữ: toast "Đã ghi nhận lượt quét.", câu cố định khi lỗi, một câu gợi ý khi bắt đầu phiên | Mila (rái cá thám hiểm) xuất hiện ở vị trí cố định của các màn M01/M02, phản ứng với sự kiện thật bằng tư thế, chuyển động và bong bóng thoại ngắn VI/EN; câu cố định giữ nguyên |
| Không có hỗ trợ khi quét mãi không được | Mila gợi ý khi scanner mở lâu không đọc được mã và khi lỗi giống nhau lặp lại |
| Không có cảm giác tiến độ ngoài dòng "Đã quét QR: n/tổng" | Mila ăn mừng khi lượt ghé được ghi lần đầu và khi kết thúc chuyến, nêu "{k}/{n}" lấy từ phiên |
| Motion giới hạn ở bảng design-system §4.3; §5.4 cấm thêm chuyển động | Design-system mở rộng motion cho mascot (người dùng cho phép 2026-11-20) |

## 3. Rationale

- Mục tiêu sản phẩm: chuyển từ website cung cấp thông tin sang trải nghiệm khám phá có tương tác (yêu cầu người dùng 2026-11-20).
- Không đụng nghiệp vụ, dữ liệu hay backend, nên rủi ro thấp và tắt được nếu cần.
- Ưu tiên MVP: **Could** (OD-MAS-08, quyết định 2026-11-21). Không chặn luồng Must nào.

## 4. Phạm vi file được phép (sau khi duyệt)

### 4.1 Tài liệu (giai đoạn G1b)

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | Lên v1.0 khi các OD-MAS mở đã được trả lời |
| `AGENTS.md` | §2 phạm vi code; §3.1 thêm spec-Mascot vào nguồn sự thật; §4 thêm dòng sở hữu cho `docs/spec/spec-Mascot.md`, `docs/mascot/`, `assets/mascot/` |
| `.specify/memory/constitution.md` | Chỉ dòng nguồn trích AGENTS.md §3.1, như đợt AI |
| `MVP-Scope.md` | Một dòng năng lực Mascot với priority đã chốt; §4 Won't giữ nguyên |
| `docs/function list/function-list-Mascot.md` | Tệp mới, dẫn xuất từ spec |
| `docs/design/design-system.md` | §4.3, §5.4, mục Mascot mới (slot, kích thước, bong bóng, token), §8 |
| `screens/screen-spec/M01/*`, `screens/screen-spec/M02/*`, `screens/screen list/screen-list-M01.md`, `screen-list-M02.md` | Slot và câu thoại trong bảng copy; coverage |
| `docs/architecture/environment.md` | Chỉ khi OD-MAS-15 chọn có công tắc phát hành |
| `README.md`, `docs/README.md`, `docs/mascot/**` | Đồng bộ mô tả, link, trạng thái |

### 4.2 Gói Spec-Kit và code (giai đoạn G3–G9)

| Đường dẫn | Nội dung |
|---|---|
| `specs/005-visitor-mascot/**` | Gói Spec-Kit (spec, plan, research, contracts, quickstart, tasks, checklists, validation report) |
| `src/shared/mascot/**` | Engine: sự kiện, máy trạng thái, luật, ưu tiên, hẹn giờ, thư viện lời thoại, registry ảnh. Không import module nào |
| `src/app/mascot/**`, `src/app/App.tsx` | Host React, slot, component; gắn một lần trong App |
| `src/modules/m01/**`, `src/modules/m02/**` | **Chỉ**: lời gọi phát sự kiện tại các điểm đã liệt kê ([Technical spec](../../docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md) §4), khai báo slot trong layout, test tương ứng. Không đổi logic, kiểu trả về hay thứ tự ghi dữ liệu |
| `src/shared/ui/tokens.css` | Token mới cho mascot sau khi design-system được sửa |
| `assets/mascot/**` | Ảnh do người dùng cung cấp (`source/`) và bản WebP do agent xuất (`web/`) |
| `assets/icons/` | Dùng lại `leaf.svg` có sẵn cho hiệu ứng lá rơi; chỉ vẽ icon mới nếu plan cần (agent được vẽ icon, quyết định 2026-11-10) |
| `vite.config.ts` | Mẫu precache hẹp cho `assets/mascot-*.webp` |
| `e2e/**` | E2E cho mascot trên `dev:fake` và stack local |
| `.env.example` | Chỉ tên biến công khai nếu OD-MAS-15 chọn có công tắc |

## 5. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role | Không đổi |
| Lifecycle/status | Không đổi; mascot không có trạng thái nghiệp vụ |
| Field/type, DAC | Không đổi; không entity, cột, store IndexedDB hay migration mới |
| Validation rule | Không đổi |
| Cross-module contract | Không đổi. Sự kiện mascot là thông báo trong bộ nhớ của trình duyệt, không phải contract giữa module |
| Report | Không đổi |
| Screen | SCR-M01-001…004, SCR-M02-001…004: thêm slot và câu thoại; mọi câu cố định giữ nguyên |
| MVP priority | Could |
| Data retention | Không lưu gì; không gửi gì ra khỏi thiết bị; không analytics mới |
| Dịch vụ bên ngoài | Không |
| Dependency | Không thêm dependency runtime (tech-stack §12) |
| Hiệu năng | Ngân sách: ảnh mascot trong precache khoảng 350 KB trở xuống; mã engine khoảng 12 KB gzip trở xuống (đo khi cài) |

## 6. Expected consumers

Du khách trên các màn M01 và M02. M03 không dùng.

## 7. Explicit non-goals

- Không backend: không bảng, RPC, Edge Function, migration, secret hay cấu hình cloud.
- Không đổi spec-M01, spec-M02, spec-M03, contract, entity, DAC hay Physical Schema.
- Không điểm số, bảng xếp hạng, huy hiệu, phần thưởng, mảnh ghép, câu đố. MVP-Scope §4 giữ nguyên.
- Không nút ẩn, thu nhỏ hay chế độ yên lặng (quyết định 2026-11-21).
- Không âm thanh, không chatbot, không AI.
- Không chuyển ảnh mascot sang SVG; không vẽ lại nhân vật. Agent chỉ cắt, đổi cỡ, nén ảnh người dùng cung cấp.
- Không đưa ảnh mascot vào repo trước khi người dùng xác nhận quyền sử dụng (OD-MAS-07).
- Không commit, push, deploy nếu người dùng chưa yêu cầu.

## 8. Thứ tự đề xuất sau khi duyệt

1. Trả lời OD-MAS-08…16 ([spec-Mascot](../../docs/spec/spec-Mascot.md) §10); đưa spec lên v1.0.
2. Sửa AGENTS.md (§2, §3.1, §4) và dòng nguồn của constitution.
3. Đồng bộ tài liệu dẫn xuất theo §4.1.
4. Chạy chuỗi Spec-Kit cho `specs/005-visitor-mascot/`: specify → clarify → plan → tasks → analyze.
5. Code theo tasks:
   - Engine trước (chạy được trên `dev:fake` với ảnh tạm, không phát hành).
   - Pilot 3 khoảnh khắc: giới thiệu, lượt ghé mới, kết thúc chuyến.
   - Sau đó M02 đầy đủ, M01, chạm để hỏi.
   - Cuối cùng kiểm thực địa ([roadmap](../../docs/mascot/MASCOT_IMPLEMENTATION_ROADMAP.md) G4–G9).

## 9. Validation gates

- `npm run ci` PASS (typecheck, lint token, unit test, build), có và không có mascot.
- `npm run e2e` PASS cho `m01`, `m02`; test hiện có không bị sửa để "cho qua".
- Test riêng của mascot theo [Testing Checklist](../../docs/mascot/MASCOT_TESTING_CHECKLIST.md), gồm SC-MAS-001…010.
- Test kiến trúc: `src/shared/mascot` không import module; M02 vẫn chỉ import M01 qua `m01Port.ts`.
- Đo ngân sách precache và chunk.
- Phần không chạy được (thiết bị thật, Lighthouse) ghi `NOT RUN` kèm lý do.

## 10. Open questions

Không còn câu hỏi nghiệp vụ chặn: OD-MAS-01…16 đã chốt (spec-Mascot §10; OD-MAS-08…16 theo đề xuất, người dùng 2026-11-21). Còn chờ, không chặn tài liệu: Ban Quản lý duyệt câu nhắc thiên nhiên (OD-MAS-05); người dùng giao ảnh production và xác nhận quyền sử dụng (OD-MAS-06, 07), trước khi bật công tắc ở Production.

Các điểm kỹ thuật để plan chốt: tên và payload sự kiện; mẫu glob precache; cỡ ảnh xuất; cách đo ngân sách trong CI.

## 11. Khi duyệt

Người duyệt điền "Người duyệt", "Ngày duyệt" và đổi trạng thái thành **APPROVED**. Sau đó agent thực hiện bước 1–3 của §8.

## 12. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-21 | Bước 1 §8: OD-MAS-01…16 chốt; spec-Mascot lên v1.0 | Xong |
| 2026-11-21 | Bước 2 §8: AGENTS.md §2, §3.1, §4; constitution 2.1.0 → 2.2.0 | Xong |
| 2026-11-21 | Bước 3 §8: MVP-Scope §3.6; function-list-Mascot; design-system §4.3, §5.4, §7, §9; screen spec SCR-M01-001…004, SCR-M02-001…004; screen list M01/M02; environment (`VITE_FEATURE_MASCOT`); README.md, docs/README.md; docs/mascot | Xong |
| — | Bước 4 §8: chuỗi Spec-Kit cho `specs/005-visitor-mascot/` | Chưa bắt đầu |
