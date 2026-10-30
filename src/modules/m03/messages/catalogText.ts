// Danh mục thông báo — câu chữ cố định của spec-M03 §5.6 (research R-18; BR-M03-L13).
// Sinh từ bảng §5.6 bằng script; sửa câu chữ ở spec trước rồi sinh lại, không sửa tay ở đây.
// `{...}` là placeholder, điền bằng giá trị hiển thị thường (tên, số, hh:mm, dd/mm/yyyy), không bao giờ là id hay mã.

export const MESSAGE_CATALOG = {
  // Draft saved (the whole form, BR-M03-F11)
  "MSG-SAVED": "Đã lưu bản nháp.",
  // Publication succeeded
  "MSG-PUBLISHED": "Đã xuất bản. Du khách sẽ thấy nội dung mới.",
  // Text longer than its limit
  "MSG-LIMIT-TEXT": "{Tên ô} dài quá {tối đa} ký tự (hiện có {số}). Hãy rút gọn.",
  // Distance or duration not above 0
  "MSG-NUMBER-POSITIVE": "{Tên ô} phải lớn hơn 0.",
  // Distance or duration above its maximum
  "MSG-NUMBER-TOO-BIG": "{Tên ô} không được lớn hơn {tối đa} {đơn vị}.",
  // Distance with more than one decimal place
  "MSG-NUMBER-DECIMALS": "{Tên ô} chỉ nhận tối đa 1 chữ số sau dấu phẩy.",
  // A route list already holds the maximum number of checkpoints
  "MSG-LIMIT-CHECKPOINTS": "Tuyến đã đủ {tối đa} điểm dừng. Hãy bỏ bớt điểm dừng trước khi thêm.",
  // A checkpoint already holds the maximum number of visit points
  "MSG-LIMIT-QR": "Điểm dừng \"{tên}\" đã đủ {tối đa} điểm tham quan. Hãy thu hồi hoặc bỏ bớt điểm tham quan trước khi thêm.",
  // Report period longer than the maximum
  "MSG-REPORT-SPAN": "Khoảng thời gian chọn quá dài. Hãy chọn tối đa {tối đa} ngày.",
  // File over its size limit
  "MSG-FILE-TOO-BIG": "{Loại tệp} \"{tên tệp}\" nặng {số} MB, tối đa {tối đa} MB. Hãy nén nhỏ hơn rồi tải lại.",
  // Unsupported file type
  "MSG-FILE-TYPE": "Tệp \"{tên tệp}\" không đúng định dạng. Chỉ nhận {danh sách định dạng}.",
  // Too many images (a visit point, or the route gallery)
  "MSG-COUNT-IMAGES": "{Tên điểm tham quan hoặc tên tuyến} đã đủ {tối đa} ảnh. Hãy xóa bớt ảnh trước khi thêm.",
  // Too many audio/video files
  "MSG-COUNT-AV": "{Tên điểm tham quan} đã đủ {tối đa} tệp âm thanh/video. Hãy xóa bớt trước khi thêm.",
  // Audio/video added to an offline checkpoint
  "MSG-AV-OFFLINE": "Điểm dừng \"{tên}\" là loại cần tải trước nên chỉ nhận chữ và ảnh. Âm thanh và video chỉ dùng cho điểm dừng có mạng.",
  // Audio/video file without a spoken language
  "MSG-AV-LANGUAGE-MISSING": "Hãy chọn ngôn ngữ cho tệp \"{tên tệp}\": Tiếng Việt, Tiếng Anh hoặc Không lời.",
  // Review screen: audio/video exists in only one language
  "MSG-AV-ONE-LANGUAGE": "Điểm tham quan \"{tên}\" chỉ có âm thanh/video {ngôn ngữ}. Du khách chọn {ngôn ngữ còn lại} sẽ không thấy các tệp này.",
  // Switching to offline while audio/video exist
  "MSG-MODE-HAS-AV": "Chưa đổi được sang \"Cần tải trước\" vì còn âm thanh/video ở: {danh sách}. Hãy xóa chúng trước.",
  // Adding a visit point before the checkpoint has a saved connectivity mode
  "MSG-MODE-REQUIRED-FIRST": "Hãy chọn loại kết nối cho điểm dừng và lưu lại trước khi thêm điểm tham quan.",
  // Contradictory tags
  "MSG-TAG-CONFLICT": "Tuyến độ khó {độ khó} không thể gắn nhãn {nhãn}. Hãy đổi độ khó hoặc bỏ nhãn.",
  // Checkpoint name already used
  "MSG-CHECKPOINT-NAME-TAKEN": "Đã có điểm dừng tên \"{tên}\". Hãy dùng tên khác, hoặc chọn điểm dừng đó trong tuyến.",
  // A checkpoint added twice to a route
  "MSG-CHECKPOINT-DUPLICATE": "Điểm dừng \"{tên}\" đã có trong danh sách của tuyến.",
  // Route map removed while the tick was set
  "MSG-MAP-TICK-CLEARED": "Đã bỏ chọn \"dùng sơ đồ khi không có mạng\" vì tuyến không còn sơ đồ.",
  // After a selection of several files; the second sentence only when some file failed
  "MSG-UPLOAD-SUMMARY": "Đã tải {số}/{tổng} tệp. Chưa tải được: {danh sách}.",
  // Uploaded file not yet saved into the draft
  "MSG-UPLOADED-NOT-SAVED": "Đã tải lên — chưa lưu vào bản nháp.",
  // First save of a new visit point
  "MSG-QR-CREATED": "Đã thêm điểm tham quan \"{tên}\".",
  // Editor heading when a draft is on screen
  "MSG-VERSION-DRAFT": "Bản nháp — du khách chưa thấy.",
  // Editor heading when the published version is on screen
  "MSG-VERSION-PUBLISHED": "Đang hiển thị cho du khách.",
  // Label of the visitor preview
  "MSG-PREVIEW-DRAFT": "Bản xem trước — du khách chưa thấy nội dung này.",
  // Leaving an editor with unsaved changes
  "MSG-UNSAVED-CHANGES": "Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này.",
  // Required field empty at publication
  "MSG-MISSING-FIELD": "Còn thiếu: {tên ô}.",
  // Only one language present
  "MSG-MISSING-LANGUAGE": "{Tên ô}: còn thiếu bản {tiếng Việt / tiếng Anh}.",
  // Route list has no active checkpoint
  "MSG-NO-ACTIVE-CHECKPOINT": "Tuyến cần ít nhất một điểm dừng đang hoạt động trong danh sách thì mới xuất bản được.",
  // Publication would leave an active route without an active checkpoint
  "MSG-ROUTE-LAST-CHECKPOINT": "Không thể bỏ điểm dừng này vì tuyến sẽ không còn điểm dừng nào đang hoạt động. Hãy thêm điểm dừng khác hoặc đóng tạm tuyến trước.",
  // Review screen notice (route)
  "MSG-CHECKPOINT-LEFT-OUT": "Điểm dừng \"{tên}\" đang tạm đóng nên chưa nằm trong hành trình của tuyến.",
  // Review screen notice (checkpoint)
  "MSG-QR-LEFT-OUT": "Điểm tham quan \"{tên}\" chưa sẵn sàng: {điều còn thiếu}. Điểm này chưa được xuất bản lần này.",
  // Usage rights not confirmed
  "MSG-RIGHTS-NOT-CONFIRMED": "Hãy xác nhận quyền sử dụng cho \"{tên tệp}\" trước khi xuất bản.",
  // Field-verification tick missing
  "MSG-ONLINE-NOT-VERIFIED": "Hãy tick xác nhận đã khảo sát thực địa, có sóng ổn định, cho điểm dừng \"{tên}\".",
  // Safety warning empty and not confirmed
  "MSG-SAFETY-CONFIRM": "Hãy nhập cảnh báo an toàn, hoặc tick xác nhận tuyến không có cảnh báo an toàn cần nêu.",
  // Offline size over the ceiling for a route
  "MSG-OFFLINE-TOO-BIG": "Gói tải trước của tuyến \"{tên tuyến}\" sẽ nặng khoảng {số} MB, vượt mức {tối đa} MB. Ảnh nặng nhất: {danh sách}. Hãy nén hoặc bớt ảnh.",
  // Stored image cannot be read
  "MSG-IMAGE-NOT-READABLE": "Chưa đọc được ảnh \"{tên tệp}\" đã tải lên. Hãy tải lại ảnh này.",
  // Stale save
  "MSG-STALE": "{Tên người} vừa sửa mục này lúc {giờ}. Bấm Tải lại để xem bản mới nhất. Nội dung bạn đang gõ vẫn được giữ trên màn hình để bạn sao chép.",
  // Another operation running on the same route or checkpoint
  "MSG-ROUTE-BUSY": "Đang có thao tác khác chạy trên {tên tuyến hoặc điểm dừng}. Hãy thử lại sau ít phút.",
  // Review screen impact note
  "MSG-AFFECTED-ROUTES": "Thay đổi này ảnh hưởng {số} tuyến: {danh sách}. Gói tải trước của du khách ở các tuyến đó cần cập nhật.",
  // Publication did not complete
  "MSG-PUBLISH-FAILED": "Chưa xuất bản được. Những gì du khách đang thấy vẫn như cũ. Hãy thử lại sau ít phút.",
  // Restore while a draft exists
  "MSG-DRAFT-EXISTS": "Đang có bản nháp chưa xuất bản. Hãy xuất bản hoặc bỏ thay đổi trước, rồi mới khôi phục bản cũ.",
  // Restore of a version that no longer fits the current limits
  "MSG-RESTORE-BLOCKED": "Chưa khôi phục được bản này vì có chỗ không còn hợp với giới hạn hiện nay: {danh sách chỗ cần sửa}. Hãy sửa từ bản đang xuất bản.",
  // Revoking the last active QR
  "MSG-LAST-QR": "Không thể thu hồi mã QR cuối cùng của điểm dừng đang hoạt động. Hãy thêm mã QR khác hoặc đóng tạm điểm dừng trước.",
  // Archiving a checkpoint still listed
  "MSG-CHECKPOINT-IN-USE": "Chưa thể lưu trữ điểm dừng này vì tuyến {danh sách} vẫn có trong danh sách. Hãy bỏ điểm dừng khỏi các tuyến đó trước.",
  // Closing dialog for a checkpoint
  "MSG-CLOSE-AFFECTS-ROUTES": "Điểm dừng này có trong {số} tuyến: {danh sách}.",
  // Closing dialog when routes would run out of active checkpoints
  "MSG-CLOSE-ROUTE-AUTO": "Các tuyến sau sẽ tự đóng tạm vì hết điểm dừng hoạt động: {danh sách}.",
  // Closing did not complete
  "MSG-CLOSE-FAILED": "Chưa đóng được điểm dừng, mọi thứ vẫn như cũ. Hãy thử lại. Nếu khẩn cấp, bạn có thể bấm \"Đóng tạm các tuyến liên quan\".",
  // Reopen checks failed
  "MSG-REOPEN-BLOCKED": "Chưa mở lại được. Cần xử lý trước: {danh sách}.",
  // Review screen when a checkpoint's connectivity mode changes
  "MSG-REPRINT-MODE-CHANGED": "Loại kết nối của điểm dừng \"{tên}\" sẽ đổi. Sau khi xuất bản, hãy in lại mã QR của các điểm tham quan để dòng hướng dẫn trên tem đúng với thực tế.",
  // Downloading the image of an unpublished QR
  "MSG-QR-PRINT-UNPUBLISHED": "Điểm tham quan này chưa xuất bản. Nếu dán mã ra thực địa, người quét sẽ thấy mã không hợp lệ.",
  // Removing the last active manager
  "MSG-LAST-REVIEWER": "Không thể khóa hoặc hạ quyền người quản lý cuối cùng.",
  // Action not allowed for the role
  "MSG-NO-PERMISSION": "Bạn chưa có quyền làm việc này. Hãy nhờ quản lý.",
  // Report page, under the title
  "MSG-REPORT-UPDATED": "Số liệu tính đến {giờ} ngày {ngày}.",
  // Report page when no trip has ever been received
  "MSG-REPORT-NO-DATA-YET": "Chưa có chuyến đi nào được gửi về hệ thống.",
  // Report page, under the update line
  "MSG-REPORT-SCOPE": "Chỉ tính các chuyến đi đã kết thúc và đã gửi về hệ thống; số liệu không cập nhật tức thời.",
  // Under the RPT-02 table
  "MSG-REPORT-VISIT-MEANING": "Một lượt ghé là một lần quét mã QR, không chứng minh du khách đã có mặt tại chỗ.",
  // No trip in the selected period
  "MSG-REPORT-EMPTY": "Không có chuyến đi nào trong khoảng thời gian đã chọn.",
  // Any unexpected failure
  "MSG-GENERIC": "Có lỗi xảy ra. Nội dung bạn nhập vẫn được giữ. Hãy thử lại, nếu vẫn lỗi hãy báo quản lý.",
  // Wrong email or password
  "MSG-LOGIN-FAILED": "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại.",
  // Signed in with the provider but no active account or role, or the account is locked
  "MSG-LOGIN-DENIED": "Tài khoản này chưa được phép vào hệ thống. Hãy nhờ quản lý.",
  // Signed-in session ended
  "MSG-SESSION-EXPIRED": "Phiên làm việc đã hết hạn. Hãy đăng nhập lại.",
  // No connection to the server
  "MSG-NETWORK-FAILED": "Chưa kết nối được. Hãy kiểm tra mạng rồi thử lại.",
  // After a password-recovery request (same text whether or not the email exists)
  "MSG-RECOVERY-SENT": "Nếu email này có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
  // Invitation or recovery link wrong or expired
  "MSG-LINK-INVALID": "Liên kết này không dùng được hoặc đã hết hạn. Nếu là lời mời, hãy nhờ quản lý gửi lại; nếu là khôi phục mật khẩu, hãy yêu cầu lại.",
  // Invitation email not a valid address
  "MSG-EMAIL-INVALID": "Email chưa đúng. Hãy kiểm tra lại.",
  // Invitation to an email that already has an account
  "MSG-EMAIL-TAKEN": "Email {email} đã có tài khoản. Nếu tài khoản đang chờ nhận lời mời, hãy bấm Gửi lại lời mời.",
  // Invitation sent
  "MSG-INVITE-SENT": "Đã gửi lời mời tới {email}.",
  // Invitation sent again to a pending account
  "MSG-INVITE-RESENT": "Đã gửi lại lời mời tới {email}.",
  // Invitation not sent
  "MSG-INVITE-FAILED": "Chưa gửi được lời mời. Hãy thử lại sau ít phút.",
  // Report period with only one date, or a from-date after the to-date
  "MSG-REPORT-DATES-INVALID": "Hãy chọn đủ ngày bắt đầu và ngày kết thúc, ngày bắt đầu không được sau ngày kết thúc.",
  // Confirmation dialog: close a route
  "MSG-CONFIRM-CLOSE-ROUTE": "Tuyến \"{tên}\" sẽ ẩn khỏi lựa chọn của du khách; các chuyến đang đi không bị dừng.",
  // Confirmation dialog: reopen a route
  "MSG-CONFIRM-REOPEN-ROUTE": "Tuyến \"{tên}\" sẽ lại hiện cho du khách chọn.",
  // Confirmation dialog: archive a route
  "MSG-CONFIRM-ARCHIVE-ROUTE": "Lưu trữ tuyến \"{tên}\" không thể hoàn tác; dữ liệu vẫn được giữ cho lịch sử và báo cáo.",
  // Confirmation dialog: discard a never-published route
  "MSG-CONFIRM-DISCARD-ROUTE": "Hủy tuyến \"{tên}\": tuyến chưa từng xuất bản này sẽ không dùng được nữa.",
  // Confirmation dialog: reopen a checkpoint
  "MSG-CONFIRM-REOPEN-CHECKPOINT": "Mở lại điểm dừng \"{tên}\" sẽ đưa điểm dừng trở lại các tuyến: {danh sách}; gói tải trước của du khách ở các tuyến đó cần cập nhật.",
  // Confirmation dialog: archive a checkpoint
  "MSG-CONFIRM-ARCHIVE-CHECKPOINT": "Lưu trữ điểm dừng \"{tên}\" không thể hoàn tác; các điểm tham quan của điểm dừng này sẽ bị thu hồi.",
  // Confirmation dialog: discard a never-published checkpoint
  "MSG-CONFIRM-DISCARD-CHECKPOINT": "Hủy điểm dừng \"{tên}\": điểm dừng chưa từng xuất bản và các điểm tham quan nháp của nó sẽ không dùng được nữa.",
  // Confirmation dialog: revoke a visit point
  "MSG-CONFIRM-REVOKE-QR": "Thu hồi mã QR của \"{tên}\": người quét mã này sẽ thấy mã không hợp lệ; gói tải trước của du khách ở các tuyến liên quan cần cập nhật.",
  // Confirmation dialog: discard a never-published visit point
  "MSG-CONFIRM-DISCARD-QR": "Hủy điểm tham quan \"{tên}\": mã QR của nó sẽ không bao giờ được dùng lại.",
  // Confirmation dialog: publish after the review screen
  "MSG-CONFIRM-PUBLISH": "Xuất bản \"{tên mục}\": du khách sẽ thấy nội dung mới ngay sau khi xuất bản.",
  // The authentication provider refuses a new password
  "MSG-PASSWORD-REJECTED": "Mật khẩu này chưa được chấp nhận. Hãy chọn mật khẩu khác dài hơn và khó đoán hơn.",
  // The two password entries differ
  "MSG-PASSWORD-MISMATCH": "Hai lần nhập mật khẩu chưa giống nhau. Hãy nhập lại.",
} as const;
