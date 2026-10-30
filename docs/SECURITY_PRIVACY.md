# Bảo mật và quyền riêng tư

## Mối đe dọa chính

1. Lộ tài khoản camera qua RTSP URL, log, browser hoặc file cấu hình.
2. Người ngoài xem live/snapshot khi truy cập trái phép API hoặc storage.
3. Camera host do người dùng nhập dẫn đến SSRF vào mạng nội bộ ngoài phạm vi camera.
4. Nhận diện sai khiến người quen bị cảnh báo hoặc người chưa đăng ký bị coi là người quen.
5. Gửi cảnh báo trùng/lặp nhiều lần hoặc sai người nhận.
6. Lộ ảnh mẫu/embedding qua backup, static path hoặc log.

## Kiểm soát bắt buộc

- Camera chỉ kết nối từ server trong LAN. Validate host/IP vào allowlist subnet đã cấu hình; chặn localhost, metadata/cloud endpoints và đổi DNS bất ngờ. Nếu cho nhập hostname, resolve và kiểm tra IP trước mỗi lần kết nối.
- Secret RTSP và Zalo ở secret store/environment; nếu lưu DB phải mã hóa bằng khóa không nằm cùng DB. Mask trong API/UI/log, không truyền qua query string.
- Session cookie HttpOnly, Secure khi HTTPS, SameSite; bảo vệ CSRF cho request thay đổi dữ liệu. Hash password bằng thuật toán phù hợp hiện hành và rate limit login.
- Mỗi request HLS/snapshot kiểm tra quyền. Chặn path traversal bằng ID/tên segment được allowlist; storage nằm ngoài thư mục static.
- HTTPS khi truy cập ngoài host; không port-forward camera. Truy cập từ xa ưu tiên VPN; nếu reverse proxy, có auth và cấu hình TLS.
- Validate upload ảnh: dung lượng, MIME thực, giới hạn pixel, xử lý EXIF nếu cần. Không thực thi nội dung upload.
- VAPID key/Web Push subscription và token Zalo (nếu dùng) có quyền tối thiểu và quy trình xoay vòng. Notification adapter ghi lỗi đã lọc; không log payload chứa token/số điện thoại.
- Có rate limit/cooldown/dedupe cho cảnh báo và nút tắt nhanh.

## Quyền riêng tư và nhận diện

- Chỉ đăng ký khuôn mặt của thành viên đã đồng ý; ghi thời điểm và phạm vi đồng ý. Với trẻ em, người giám hộ quyết định theo quy định áp dụng.
- Thông báo rõ camera đang hoạt động ở khu vực được giám sát. Hạn chế camera ở khu vực riêng tư.
- Không lưu frame toàn bộ liên tục chỉ để nhận diện. Detection giảm FPS; snapshot chỉ tạo cho event theo cấu hình.
- Embedding vẫn là dữ liệu sinh trắc nhạy cảm: mã hóa khi lưu, không hiển thị qua API, xóa cùng ảnh mẫu. Không dùng dịch vụ cloud recognition mặc định.
- `unknown` là “không khớp dữ liệu đã đăng ký”; `uncertain` là “không đủ chất lượng/tin cậy”. Không hiển thị từ ngữ kết luận danh tính hay hành vi.
- Cảnh báo chỉ sau nhiều bằng chứng và cooldown; Admin xem lại được event, sửa nhãn và điều chỉnh ngưỡng. Không tự động khóa cửa hoặc hành động vật lý từ kết quả nhận diện.
- Ảnh người thân được dùng làm mẫu cho model tiền huấn luyện; bộ ảnh đánh giá phải tách khỏi ảnh đăng ký. Không mặc định huấn luyện model từ đầu bằng vài ảnh gia đình vì dễ khớp sai trên dữ liệu mới.

## Cổng kiểm tra trước khi bật Zalo thật

Zalo là kênh **tùy chọn có thể phát sinh phí**. Theo tài liệu OA, OpenAPI cần gói trả phí; tin GMF miễn phí không đồng nghĩa với tích hợp tự động hoàn toàn miễn phí. [Zalo OpenAPI](https://oa.zalo.me/home/resources/library/tinh-nang-mo-rong-nang-cap-zalo-oa_2410156908111809541), [Zalo GMF](https://oa.zalo.me/home/documents/guides/quan-ly-nhom-gmf_1954166378348758227)

- Xác nhận OA và ứng dụng đã có quyền gửi phù hợp, đã có UID/người nhận hợp lệ và người nhận đồng ý nhận tin.
- Xác nhận loại tin cảnh báo này được chính sách hiện hành cho phép; nếu cần template thì phải được duyệt. Đoạn tích hợp dùng API chính thức, không dùng session/cookie của Zalo cá nhân hoặc reverse engineering.
- Xác nhận chi phí, quota, rate limit, nội dung, giờ gửi; thử với một người nhận và có nút tắt.
- OA OpenAPI có điều kiện tương tác và loại tin khác nhau; ví dụ tin Tư vấn qua OpenAPI chịu giới hạn thời gian từ tương tác cuối, nên **không mặc định phù hợp cảnh báo dài hạn**. [Tổng quan loại tin Zalo OA](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511?tab=library)

Tài liệu này là hướng thiết kế kỹ thuật; khi vận hành thực tế cần kiểm tra chính sách Zalo và quy định quyền riêng tư tại nơi sử dụng.
