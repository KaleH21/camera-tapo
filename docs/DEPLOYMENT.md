# Triển khai Tapo C220 và hai chế độ xem

## Thiết bị và mạng

- Một camera **Tapo C220** trong LAN, IP ổn định bằng DHCP reservation. Không ghi IP/mật khẩu thật trong repo.
- Một máy chạy server luôn bật, kết nối được tới C220 qua LAN. Hệ điều hành và cấu hình CPU/RAM/disk chưa chốt; xác nhận trước Phase 1 để chọn script/container phù hợp.
- TP-Link liệt kê C220 hỗ trợ RTSP. Tạo **Camera Account** riêng trong Tapo app. Kiểm tra `/stream1` (chất lượng cao) và `/stream2` (thấp) trên port 554 bằng VLC/FFmpeg trước khi nối vào website. Không dùng mật khẩu tài khoản Tapo cloud thay cho Camera Account. [TP-Link RTSP FAQ](https://www.tp-link.com/us/support/faq/2680/), [C220 datasheet](https://static.tp-link.com/upload/product-overview/2025/202509/20250925/Tapo%20C220%202.0%262.6_Datasheet.pdf)

## Chế độ 1: trong mạng nhà

Browser → địa chỉ nội bộ của server → React/FastAPI → HLS có auth. Server → C220 qua RTSP trong LAN. Có đăng nhập ứng dụng ngay cả khi ở trong nhà. Khi triển khai Web Push/PWA trên điện thoại, dùng HTTPS cho URL mà người dùng đăng ký push; HTTP LAN thông thường không đủ secure context.

Để PWA và subscription không bị chia thành hai origin, **ưu tiên dùng cùng URL HTTPS của Tailscale Serve cả khi ở nhà lẫn khi ở ngoài**. Địa chỉ LAN là đường dự phòng/xử lý sự cố. Nếu muốn dùng địa chỉ LAN làm URL chính, cần cấu hình HTTPS hợp lệ riêng trước khi bật PWA/Web Push.

## Chế độ 2: từ xa

**Mặc định:** Tailscale trên server và điện thoại/máy tính của người nhà. Tailscale Serve cung cấp URL HTTPS riêng trong tailnet tới web app trên server. Người dùng mở VPN rồi truy cập URL này; camera vẫn ở LAN, RTSP không rời mạng nhà. Gói Personal hiện $0 và tối đa 6 người dùng; chính sách giá có thể đổi. [Tailscale Personal](https://tailscale.com/pricing), [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve)

- Chỉ dùng **Serve** (private tailnet), không dùng Funnel (public Internet) cho bản đầu.
- Giới hạn người được tham gia tailnet, bật xác thực tài khoản và phân quyền web; đăng xuất/revoke khi mất thiết bị.
- Khi dùng Web Push, server cần Internet outbound để gửi tới push service. Điện thoại có thể nhận push qua dịch vụ của trình duyệt, nhưng link sự kiện chỉ mở được khi điện thoại kết nối VPN; kiểm tra trên thiết bị thật.
- Nếu không muốn dùng Tailscale, WireGuard tự vận hành là lựa chọn thay thế; cần xem router/CGNAT và cấu hình HTTPS riêng. Không đổi lựa chọn mặc định khi chưa có nhu cầu.

## Ảnh người thân và nhận diện

- Người dùng sẽ thu thập ảnh người thân có sự đồng ý. Upload qua giao diện Admin khi Phase 3 hoàn thành; không thả ảnh vào repo hay thư mục public.
- Dùng model nhận diện **tiền huấn luyện** để tạo embedding từ ảnh mẫu, sau đó so khớp. Với một số ảnh gia đình, đây là điểm khởi đầu thực tế hơn train model mới từ đầu. Chỉ fine-tune nếu thử nghiệm cho thấy cần và có dữ liệu đủ tốt.
- Thu ảnh ở nhiều góc/điều kiện sáng; giữ bộ ảnh kiểm tra độc lập với ảnh đăng ký. Kiểm tra cả người chưa đăng ký và trường hợp không thấy mặt.

## Cảnh báo miễn phí và Zalo

- Mặc định: Web Push/PWA. Trên iPhone, web app cần được thêm vào Home Screen rồi người dùng cấp quyền thông báo; Apple nói không cần tham gia Apple Developer Program. Trên mọi nền tảng, giao hàng phụ thuộc quyền và điều kiện nền của thiết bị. [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- Zalo OA có tin GMF được mô tả miễn phí, nhưng **OpenAPI để website tự động gửi là tính năng trả phí** và còn phụ thuộc gói/quyền của OA. Vì mục tiêu hiện tại là miễn phí, Phase 4b chưa là phạm vi bắt buộc. [Zalo các loại tin](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511?tab=library), [Zalo OpenAPI](https://oa.zalo.me/home/resources/library/tinh-nang-mo-rong-nang-cap-zalo-oa_2410156908111809541)
