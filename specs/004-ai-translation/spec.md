# Feature Specification: AI Integration — Dịch theo yêu cầu cho editor M03

**Feature Branch**: `004-ai-translation` *(định danh thư mục; tài liệu đang ở git branch `docs/ai-translation`)*

**Created**: 2026-11-03

**Status**: Draft — bản dẫn xuất (Layer 3) từ [docs/spec/spec-AI_integration.md](../../docs/spec/spec-AI_integration.md) v1.0

**Input**: Change Brief [CHG-AI-2026-11-03-01](change-brief-CHG-AI-2026-11-03-01.md) (APPROVED 2026-11-03). Nguồn chuẩn: spec-AI_integration v1.0 (mọi quyết định nghiệp vụ đã chốt ở §10); [function-list-AI.md](../../docs/function%20list/function-list-AI.md); ranh giới priority: [MVP-Scope.md](../../MVP-Scope.md) §3.5 (Could). Consumer: editor M03 (SCR-M03-002, 003, 008). Các rule M03 được trích dẫn và giữ nguyên: [spec-M03](../../docs/spec/spec-M03.md) v3.7 BR-M03-A02, A04, C06, F02, F11, L01, L12, §5.1, §5.3.

> **Quy tắc dẫn xuất.** File này không phải nguồn sự thật. Mọi hành vi và contract lấy từ spec-AI_integration; nếu mâu thuẫn, spec canonical thắng. Không thêm requirement, không đổi tên contract (`TranslationRequest`, `TranslationResult`). Không đổi bất kỳ rule, contract, entity, state hay permission nào của spec-M03. Mọi chữ hiển thị là tiếng Việt giản dị theo spec-AI §5.5 và spec-M03 §5.4–5.6. Không có chi tiết kỹ thuật (tech stack, tên function, endpoint thuộc plan).

## Ranh giới Producer → Consumer

| Hướng | Contract | Ghi chú (nguồn: spec-AI §5.2, §11) |
|---|---|---|
| AI Integration → editor M03 | `TranslationRequest` / `TranslationResult` | Chỉ `vi` → `en`; text nguồn của đúng một trường; kết quả là chữ thuần; lỗi là tín hiệu riêng, không phải `TranslationResult`. |
| AI Integration → dịch vụ dịch bên ngoài | Text nguồn của một trường | Chỉ gọi từ server cho admin `ACTIVE`; khóa dịch vụ không bao giờ tới trình duyệt (BR-AI-08, BR-AI-10). |

M01, M02 và mọi contract liên module của M03 không đổi.

## User Scenarios & Testing *(mandatory)*

Priority: cả capability là **Could** (MVP-Scope §3.5); thứ tự P1–P3 dưới đây là thứ tự giao trong package này. Ba story cùng dùng một nút "→" và một contract.

### User Story 1 - Dịch một trường khi bấm — US-AI-01 (Priority: P1)

Admin gõ tiếng Việt vào một trường song ngữ, bấm nút "→" của trường đó; ô tiếng Anh nhận bản dịch. Không có gì được lưu.

**Why this priority**: Đây là giá trị chính của capability (FR-AI-001, 002): giảm gõ hai lần cho 14 trường song ngữ.

**Independent Test**: Trên một editor M03, điền ô tiếng Việt của một trường, bấm "→", thấy "Đang dịch…" rồi ô tiếng Anh có chữ; rời trang mà không lưu thì hiện hộp "thay đổi chưa lưu".

**Acceptance Scenarios**:

1. **Given** ô tiếng Việt của một trường trong spec-AI §5.1 có chữ, **When** admin bấm "→" của trường đó, **Then** trường hiện "Đang dịch…" (MSG-AI-TRANSLATING) và ô tiếng Anh nhận bản dịch (BR-AI-01, BR-AI-02).
2. **Given** ô tiếng Anh đã có chữ, **When** admin bấm "→", **Then** bản dịch thay chữ cũ, không có hộp xác nhận (BR-AI-02; BR-M03-L12 giữ nguyên).
3. **Given** ô tiếng Việt trống hoặc chỉ có khoảng trắng, hoặc trường đó đang dịch, **Then** nút "→" của trường đó không bấm được (BR-AI-01).
4. **Given** form hoặc trường đang chỉ đọc, **Then** nút "→" không có hoặc không bấm được (BR-AI-07).
5. **Given** vừa dịch xong, **When** admin rời editor mà không bấm "Lưu bản nháp", **Then** hiện hộp thay đổi chưa lưu như hiện nay; bản nháp đã lưu không đổi (BR-AI-06, BR-M03-F11).
6. **Given** trường một dòng (tên, mô tả ngắn, điểm nổi bật, chú thích), **Then** bản dịch không có xuống dòng; trường dài giữ xuống dòng (BR-AI-11).
7. **Given** bản dịch dài hơn giới hạn của trường, **Then** chữ được điền đủ, không bị cắt; bộ đếm ký tự báo vượt và khi lưu hiện MSG-LIMIT-TEXT như khi tự gõ (BR-AI-06).
8. **Given** route editor có nhiều điểm nổi bật và nhiều ảnh chi tiết, **Then** mỗi mục điểm nổi bật và mỗi chú thích ảnh có nút "→" riêng; không có nút dịch cả form (BR-AI-01).

---

### User Story 2 - Admin luôn làm chủ ô tiếng Anh — US-AI-02 (Priority: P1)

Ô tiếng Anh luôn gõ được; hệ thống không bao giờ tự dịch hay tự đổi ô tiếng Anh nếu admin không bấm "→".

**Why this priority**: Không có story này thì US-AI-01 có thể ghi đè chữ admin tự viết — rủi ro nội dung sai cho du khách (FR-AI-003).

**Independent Test**: Gõ, rời ô, mở lại form, xóa ô tiếng Anh, đổi ô tiếng Việt — ô tiếng Anh không bao giờ tự đổi; bấm "→" rồi gõ vào ô tiếng Anh trước khi kết quả về — kết quả bị bỏ.

**Acceptance Scenarios**:

1. **Given** ô tiếng Anh đã có chữ, **When** admin sửa ô tiếng Việt, **Then** ô tiếng Anh không đổi (BR-AI-03).
2. **Given** admin xóa trắng ô tiếng Anh, **Then** không có dịch tự động; ô vẫn trống đến khi admin gõ hoặc bấm "→" (BR-AI-03).
3. **Given** admin mở một mục đã có nội dung (tiếng Anh trống hay không), **Then** không có gì được dịch khi mở (BR-AI-05).
4. **Given** đã bấm "→", **When** admin gõ vào ô tiếng Anh hoặc sửa ô tiếng Việt trước khi kết quả về, **Then** kết quả bị bỏ im lặng và ô giữ nguyên chữ admin (BR-AI-04).

---

### User Story 3 - Lỗi dịch không chặn công việc — US-AI-03 (Priority: P2)

Khi dịch vụ chậm, mất kết nối hoặc từ chối, ô tiếng Anh giữ nguyên, admin được báo và có "Thử lại"; vẫn gõ tay, lưu và xuất bản như cũ.

**Why this priority**: Đảm bảo capability Could không bao giờ làm hỏng luồng Must của M03 (FR-AI-004, 005).

**Independent Test**: Cho dịch vụ dịch lỗi hoặc không phản hồi; bấm "→" thấy MSG-AI-FAILED kèm "Thử lại"; vẫn điền tay, lưu, xuất bản bình thường. Gọi dịch khi không phải admin `ACTIVE` thì bị từ chối.

**Acceptance Scenarios**:

1. **Given** dịch vụ lỗi, quá thời gian hoặc từ chối, **When** admin bấm "→", **Then** ô tiếng Anh giữ nguyên, trường hiện MSG-AI-FAILED kèm "Thử lại" (BR-AI-09).
2. **When** admin bấm "Thử lại", **Then** yêu cầu dịch của đúng trường đó được gửi lại; thông báo lỗi mất khi bấm "Thử lại", gõ vào ô tiếng Anh hoặc bấm "→" lại (BR-AI-09).
3. **Given** người gọi không có danh tính đã xác thực với `AdminAccount` `ACTIVE`, **Then** server từ chối và editor xử lý như lỗi (BR-AI-08).
4. **Given** một yêu cầu dịch, **Then** chỉ text nguồn của trường đó được gửi cho dịch vụ bên ngoài: không tài khoản, identifier, ghi chú nội bộ hay tệp (BR-AI-10).
5. **Given** dịch vụ không dùng được, **Then** mọi editor vẫn điền, lưu và xuất bản được đúng như spec-M03 (SC-AI-003).

---

### Edge Cases

- Admin bấm "→" ở hai trường khác nhau liên tiếp: mỗi trường có trạng thái riêng; kết quả của trường nào chỉ ghi vào ô tiếng Anh của trường đó (BR-AI-01, BR-AI-04).
- Admin sửa ô tiếng Việt khi đang dịch: kết quả bị bỏ (BR-AI-04); nút "→" bấm lại được sau khi lượt dịch kết thúc.
- Bản dịch chứa xuống dòng cho trường một dòng: xuống dòng bị bỏ (BR-AI-11).
- Bản dịch dài hơn giới hạn: điền đủ, báo vượt như khi tự gõ; không cắt (BR-AI-06).
- Giới thiệu điểm tham quan (tối thiểu 30 ký tự mỗi ngôn ngữ): bản dịch ngắn hơn vẫn được điền; kiểm tra hiện có của M03 báo như khi tự gõ (BR-AI-06).
- Thêm hoặc xóa một mục điểm nổi bật / ảnh chi tiết khi một chú thích đang dịch: kết quả chỉ ghi vào đúng mục đã bấm nếu mục đó còn và text nguồn chưa đổi; ngược lại bị bỏ (BR-AI-04).
- Mất phiên đăng nhập trước khi dịch: xử lý như lỗi (BR-AI-08, BR-AI-09); luồng phiên hết hạn của M03 không đổi.
- Thiếu khóa dịch vụ ở server: xử lý như lỗi (BR-AI-09).
- Bản nháp lỗi thời (stale): dịch không ảnh hưởng; lưu vẫn bị từ chối bằng MSG-STALE như hiện nay.

## Requirements *(mandatory)*

### Functional Requirements

Mỗi dòng giữ nguyên ID; BR/§ là tham chiếu nguồn, chi tiết đầy đủ nằm ở spec-AI_integration §5.3.

- **FR-AI-001**: Có nút "→" cho mỗi trường song ngữ trong phạm vi (spec-AI §5.1: 14 trường của editor tuyến, điểm dừng và điểm tham quan, gồm cả cảnh báo an toàn; mỗi mục điểm nổi bật và mỗi chú thích ảnh một nút) dịch text tiếng Việt sang tiếng Anh khi bấm. (BR-AI-01, BR-AI-07)
- **FR-AI-002**: Chỉ ghi bản dịch vào ô tiếng Anh của form đang mở; không bao giờ tự lưu, xuất bản hay đổi dữ liệu đã lưu. (BR-AI-02, BR-AI-06, BR-AI-11, BR-AI-12)
- **FR-AI-003**: Giữ ô tiếng Anh luôn sửa được; chỉ dịch khi bấm nút. (BR-AI-03, BR-AI-04, BR-AI-05)
- **FR-AI-004**: Khi lỗi, giữ nguyên form và dùng được, báo admin và cho "Thử lại". (BR-AI-09)
- **FR-AI-005**: Chỉ gọi dịch vụ dịch từ server cho admin đã xác thực có `AdminAccount` `ACTIVE`, không lộ khóa dịch vụ cho trình duyệt; chỉ gửi text nguồn. (BR-AI-08, BR-AI-10)

### Fields in scope (spec-AI §5.1)

| Editor | Trường | Một dòng / văn bản dài |
|---|---|---|
| Biên tập tuyến (SCR-M03-002) | `name`, `shortDescription`, `highlights[]` (mỗi mục), `gallery[].caption`, `routeMap.caption` | Một dòng |
| Biên tập tuyến (SCR-M03-002) | `description`, `startingPoint`, `participationRequirements`, `preparation`, `bestTime`, `safetyWarning` | Văn bản dài |
| Thư viện điểm dừng (SCR-M03-008) | `checkpointName` | Một dòng |
| Điểm tham quan (SCR-M03-003) | `objectName` | Một dòng |
| Điểm tham quan (SCR-M03-003) | `introductionText` | Văn bản dài |

### Key Entities *(include if feature involves data)*

Không có entity mới (spec-AI §6). Chỉ có:

- **TranslationRequest**: contract transport từ editor tới server — ngôn ngữ nguồn `vi`, đích `en`, text nguồn không rỗng trong giới hạn của trường, cờ cho phép xuống dòng hay không (spec-AI §5.2).
- **TranslationResult**: contract transport trả về — text tiếng Anh thuần, không xuống dòng khi trường là một dòng; không giới hạn theo độ dài trường (spec-AI §5.2).
- Trạng thái "đang dịch" và "lỗi" là UI state tạm thời của form đang mở; không lưu gì về việc một chữ có phải máy dịch hay không (BR-AI-12).

### Messages (spec-AI §5.5)

| Key | Khi hiện | Chữ |
|---|---|---|
| MSG-AI-TRANSLATING | Trường đang dịch | Đang dịch… |
| MSG-AI-FAILED | Dịch trường lỗi (BR-AI-09) | Chưa dịch được. Hãy bấm "Thử lại" hoặc tự nhập tiếng Anh. |

Nút: ký tự "→" (không file icon), tên truy cập "Dịch sang tiếng Anh" (spec-AI §5.5, OD-AI-18).

## Success Criteria *(mandatory)*

### Measurable Outcomes

Giữ nguyên SC-AI-001…006 (spec-AI §7):

- **SC-AI-001**: Với mọi trường trong spec-AI §5.1, bấm "→" khi có chữ tiếng Việt thì ô tiếng Anh có chữ tiếng Anh; không bấm thì không trường nào bị dịch.
- **SC-AI-002**: Đổi ô tiếng Việt hoặc xóa ô tiếng Anh không bao giờ tự đổi ô tiếng Anh.
- **SC-AI-003**: Khi dịch vụ không dùng được, bấm "→" hiện MSG-AI-FAILED kèm "Thử lại", và mọi editor vẫn điền, lưu, xuất bản đúng như spec-M03.
- **SC-AI-004**: Không yêu cầu dịch nào tới dịch vụ nếu không có admin `ACTIVE` đã xác thực; khóa dịch vụ không xuất hiện trong bundle trình duyệt, file repository hay log.
- **SC-AI-005**: Dịch không bao giờ lưu bản nháp: rời editor sau khi dịch mà chưa lưu hiện hộp thay đổi chưa lưu của BR-M03-F11.
- **SC-AI-006**: Bản dịch dài hơn giới hạn trường được điền đủ và trường hiện MSG-LIMIT-TEXT.

## Assumptions

Nguồn: spec-AI §9, §10; change brief §7.

- Máy dịch có thể sai, nhất là tên riêng, tên loài và câu cảnh báo an toàn; admin đọc và sửa mọi kết quả và chịu trách nhiệm về chữ tiếng Anh được xuất bản; màn review bắt buộc (BR-M03-F02) là kiểm soát hiện có.
- Dịch vụ dịch có thể chậm hoặc không dùng được; editor phải dùng được đầy đủ khi không có nó.
- Dự án có khóa cho dịch vụ dịch; khóa là secret phía server theo từng môi trường. Cấu hình hay deploy lên cloud cần change brief triển khai riêng (AGENTS.md §2).
- Người dùng chấp nhận gửi text nháp chưa xuất bản cho nhà cung cấp, ở mọi gói dịch vụ (OD-AI-11).
- Không có bảng thuật ngữ cố định, không giới hạn số lần dịch, không lưu dấu "máy dịch" (OD-AI-10, 12, 13).
- Dependency: editor M03 hiện có (SCR-M03-002, 003, 008), xác thực admin của M03 (BR-M03-A04) và kiểm tra độ dài hiện có (spec-M03 §5.3). Thời gian chờ tối đa `AI_TRANSLATE_TIMEOUT_MS` là giá trị kỹ thuật, chốt trong plan.

### Open clarifications

Không còn mục `[NEEDS CLARIFICATION]` mở. Mọi quyết định nghiệp vụ OD-AI-01…18 đã chốt ngày 2026-11-03 (spec-AI §10).

## Traceability (ID → section nguồn)

Tất cả ID bên dưới tồn tại trong [docs/spec/spec-AI_integration.md](../../docs/spec/spec-AI_integration.md). Cột Function/Priority lấy từ MVP-Scope §3.5 và [function-list-AI.md](../../docs/function%20list/function-list-AI.md). BR viết tắt bỏ tiền tố `BR-AI-`.

| User story | US (spec §) | FR | BR | SC | Function / Priority |
|---|---|---|---|---|---|
| Story 1 | US-AI-01 (§3) | FR-AI-001, 002 | 01, 02, 05, 06, 07, 11, 12 | SC-AI-001, 005, 006 | FN-AI-001 / Could |
| Story 2 | US-AI-02 (§3) | FR-AI-003 | 03, 04 | SC-AI-002 | FN-AI-001 / Could |
| Story 3 | US-AI-03 (§3) | FR-AI-004, 005 | 08, 09, 10 | SC-AI-003, 004 | FN-AI-001, FN-AI-002 / Could |
