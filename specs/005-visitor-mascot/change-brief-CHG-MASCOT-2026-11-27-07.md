# Change Brief CHG-MASCOT-2026-11-27-07 — Màn Chuyến đi lúc đang đi: thẻ tuyến, điểm tiếp theo, hàng đã quét bấm được, Mila nói điểm tiếp theo

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-27-07 |
| Trạng thái | **APPROVED** (2026-11-27). Được sửa spec-Mascot lên v1.7, spec-M02 lên v3.5, đồng bộ tài liệu dẫn xuất và code frontend theo §3 |
| Người duyệt | Chủ dự án (chat 2026-11-27: "Sửa hết luôn cho tôi từ đầu đến cuối"; chọn lấy tên tuyến từ gói offline đã tải và sửa spec-M02 lên v3.5 cho việc đó). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-27 |
| Loại thay đổi (runbook §4) | Behavioral change của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.6 → v1.7) và [spec-M02](../../docs/spec/spec-M02.md) (v3.4 → v3.5), cộng sửa hình thức ở design-system §5 "M02", §5.3. Chỉ frontend. Không đổi spec-M01, spec-M03, hình dạng contract, entity hay dữ liệu đồng bộ |
| Liên quan | [CHG-MASCOT-2026-11-25-06](change-brief-CHG-MASCOT-2026-11-25-06.md); [CHG-MOTION-2026-11-24-01](../006-visitor-motion/change-brief-CHG-MOTION-2026-11-24-01.md) (thanh tiến trình hành trình) |

## 1. Source

Tester góp ý nhóm 2 · A "Màn Chuyến đi trong lúc đi" (M02-04, M02-13, M02-14; bảng test và ảnh so sánh "Hiện tại / Mong đợi", chat 2026-11-27). M02-13 và M02-14 đạt về chức năng; góp ý là về hình thức:

| # | Hiện tại | Mong đợi |
|---|---|---|
| 1 | Không có tên tuyến; tiến độ chỉ là chữ nhỏ cạnh tiêu đề "Hành trình" | Thẻ "Tuyến đang đi" có tên tuyến, thanh chia theo số điểm, "k/n điểm đã quét" và "Còn r điểm" |
| 2 | Ô gợi ý đầu màn và Mila (MSG-MAS-030) nói cùng một ý | Mila nói điểm tiếp theo: "Điểm tiếp theo: {tên}. Đến nơi, tìm tem QR rồi bấm Quét QR nhé!" |
| 3 | Hàng đã quét bấm được nhưng không có dấu hiệu | Vòng ✓ thay số, mũi tên › bên phải, "Đã quét QR · hh:mm" |
| 4 | Không biết điểm nào là điểm tiếp theo | Điểm tiếp theo viền vàng, nhãn "Tiếp theo" |
| 5 | Nút Quét QR ở đáy màn | Giữ nguyên |

## 2. Quyết định (chat 2026-11-27)

| # | Quyết định |
|---|---|
| D1 | Thẻ tuyến ở đầu hành trình khi có phiên: nhãn "Tuyến đang đi", tên tuyến, thanh tiến trình chia đoạn, câu "Đã quét QR: k/n điểm" (giữ nguyên chữ cũ) và "Còn r điểm" / "Đã quét mã ở tất cả các điểm" |
| D2 | Tên tuyến lấy từ `routeEssentials.name` của gói `SAN_SANG` đang dùng của cùng `routeId` (spec-M02 v3.5). Không có gói, hoặc đọc lỗi: thẻ không có dòng tên, phần còn lại giữ nguyên. Không thêm trường vào `SelectedRouteContext v3` hay `PlaySession` (chủ dự án chọn phương án này) |
| D3 | Thanh tiến trình hành trình: mỗi điểm một đoạn theo thứ tự hiển thị — đã quét màu success, điểm tiếp theo màu amber, còn lại rãnh mờ. Thay thanh "đường mòn" một dải của v1.4 trên SCR-M02-001; thanh đường mòn vẫn dùng cho gói tải trước. Khi quay về sau lượt ghé mới, đoạn của điểm đó sáng lên (T1) |
| D4 | "Điểm tiếp theo" = điểm chưa quét đầu tiên theo thứ tự hiển thị. Chỉ là gợi ý: quét theo thứ tự nào cũng được (BR-M02-006), không khóa điểm nào. Quét hết thì không có điểm tiếp theo |
| D5 | Hàng đã quét: vòng ✓ (màu success) thay số thứ tự, mũi tên › bên phải. Danh sách có thứ tự vẫn đọc số cho trình đọc màn hình. Hàng điểm tiếp theo: viền amber, nhãn "Tiếp theo" |
| D6 | Mila: MSG-MAS-030 (bắt đầu chuyến) và MSG-MAS-056 (quay về sau lượt ghé mới) đổi thành câu nói điểm tiếp theo `{next}`; MSG-MAS-033 (chạm giữa chặng) bỏ "Còn {r} điểm" vì thẻ tuyến đã hiện. Không có điểm tiếp theo thì không nói. BR-MAS-02 bỏ ngoại lệ "030 gần với câu gợi ý bắt đầu phiên". Câu của mockup "Đến nơi, tìm tem QR…" đổi thành "Tìm tem QR ở đó rồi bấm Quét QR nhé!" vì "đến nơi/tới nơi" ngụ ý có mặt (BR-MAS-04, SC-M02-013; danh sách từ cấm của test catalog) |
| D7 | Mila **giữ chỗ cũ** trên nút Quét (spec-Mascot §5.1 không đổi). Mockup của tester đặt Mila dưới thẻ tuyến, nhưng Mila đứng (DOCK) cao 128 px; đặt ở đầu màn sẽ đẩy cả hành trình xuống mỗi lúc |

## 3. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-M02.md` | v3.5: §5.1 "Content inputs" (M02 đọc `routeEssentials.name`), §7 Journey map, §11 dòng M01 package, change notes |
| `docs/spec/spec-Mascot.md` | v1.7: BR-MAS-02, BR-MAS-12, §5.6 (030, 033, 056, `{next}`), §11, change notes |
| `docs/design/design-system.md` | §5 "M02 — Field Experience", §5.3 thanh tiến trình hành trình, thẻ tuyến |
| `docs/mascot/MASCOT_DIALOGUE_LIBRARY.md` | MAS-MSG-030, 033, 056 |
| `screens/screen-spec/M02/screen-spec-SCR-M02-001.md` | Phần tử E-07, E-25, E-26 (mới), bảng copy |
| `specs/005-visitor-mascot/**` | Brief này, contract sự kiện, tasks Phase 21, validation report §21 |
| `src/shared/mascot/**` | Câu, luật, trạng thái `tripNext` |
| `src/modules/m02/{journey,session,i18n,testing}/**` | Thẻ tuyến, thanh chia đoạn, hàng đã quét/tiếp theo, đọc tên tuyến, chữ |
| `e2e/**` | Test liên quan |

## 4. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor, field, DAC, contract, report | Không đổi. `routeEssentials.name` đã có trong mọi gói sẵn sàng (spec-M01 §6); M02 chỉ đọc để hiển thị |
| Lifecycle | Không đổi |
| Screen | SCR-M02-001 khi có phiên: thẻ tuyến, hàng đã quét, điểm tiếp theo |
| Câu chữ | M02: "Tuyến đang đi", "Còn {r} điểm", "Đã quét mã ở tất cả các điểm", "Tiếp theo". Mila: 030, 033, 056 đổi chữ |
| Truy cập | Thanh có `role="progressbar"`; trạng thái mỗi hàng vẫn bằng chữ ("Đã quét QR", "Chưa quét", "Tiếp theo"), không chỉ bằng màu |
| Hiệu năng | Đọc gói một lần khi mở màn; hiệu ứng bằng `transform`/`opacity` |
| Dependency, backend, dữ liệu | Không |

## 5. Non-goals

- Không bắt buộc thứ tự quét, không khóa điểm.
- Không thêm tên tuyến vào handoff hay dữ liệu đồng bộ.
- Không đổi chỗ của Mila (D7), không đổi màn khách tự do.
- Không sửa mockup HTML tĩnh `screens/html/mockup-SCR-M02-001.html` (ghi nhận là stale).

## 6. Validation gates

- `npm run ci` PASS; `npx playwright test --project=m02` PASS.
- Chụp kiểm ở 390 px: 0/3, 1/3 (có điểm tiếp theo), 3/3; có và không có gói.

## 7. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-27 | Tester góp ý; chủ dự án duyệt làm trọn, chọn tên tuyến từ gói offline, spec-M02 v3.5 | Xong |
| 2026-11-27 | spec-Mascot v1.7, spec-M02 v3.5, tài liệu dẫn xuất, code, test (tasks T123–T127; validation report §21) | Xong |
