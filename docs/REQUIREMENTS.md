# Yêu cầu sản phẩm

## 1. Bối cảnh và mục tiêu

Chủ nhà có **một Tapo C220**, muốn xem camera trong trình duyệt ở nhà hoặc từ xa, theo dõi trạng thái kết nối, lưu sự kiện có người xuất hiện và nhận cảnh báo khi người đó chưa được nhận diện là thành viên đã đăng ký. Cảnh báo miễn phí ưu tiên Web Push; Zalo tự động là tích hợp tùy chọn nếu có OA OpenAPI hợp lệ.

**Ưu tiên:** (P0) xem live ổn định, an toàn trong LAN và qua VPN; (P1) sự kiện/phát hiện người; (P2) đăng ký và nhận diện người quen; (P3) cảnh báo Web Push; (P4) Zalo tùy chọn.

## 2. Vai trò

- **Admin gia đình:** cấu hình camera, người quen, ngưỡng, người nhận, thời gian lưu.
- **Viewer:** xem live và sự kiện; không xem/sửa bí mật kết nối, không đăng ký khuôn mặt.
- Bản đầu có thể chỉ một Admin, nhưng API và dữ liệu phải sẵn chỗ cho phân quyền.

## 3. Yêu cầu chức năng

| ID | Ưu tiên | Yêu cầu | Tiêu chí chính |
| --- | --- | --- | --- |
| FR-01 | P0 | Cấu hình một hoặc nhiều camera Tapo qua IP LAN, tài khoản camera, stream path | Có nút kiểm tra kết nối; không trả mật khẩu trong API |
| FR-02 | P0 | Xem live trong trình duyệt desktop/mobile | Có loading, offline, reconnect; không lộ URL RTSP |
| FR-03 | P0 | Xem trạng thái camera | Online/offline, lần nhận frame cuối, lỗi đã lọc bí mật |
| FR-04 | P0 | Đăng nhập và phân quyền | Chỉ người được phép mới xem live/ảnh/sự kiện |
| FR-05 | P1 | Phát hiện người và tạo sự kiện | Mỗi đợt hiện diện có một event, không tạo event cho từng frame |
| FR-06 | P1 | Xem danh sách, lọc và chi tiết sự kiện | Theo camera, thời gian, trạng thái; snapshot có quyền truy cập |
| FR-07 | P2 | Đăng ký người quen với sự đồng ý | Nhiều ảnh mẫu, xóa được ảnh và embedding |
| FR-08 | P2 | Phân loại `known`, `unknown`, `uncertain` | Chỉ `known` nếu đủ độ tin cậy; hiển thị độ tin cậy dạng tham khảo |
| FR-09 | P2 | Xác nhận/sửa nhãn thủ công | Có audit ai sửa và khi nào |
| FR-10 | P3 | Cảnh báo Web Push cho sự kiện `unknown` hợp lệ | Dedupe, cooldown, retry có giới hạn, lưu trạng thái gửi |
| FR-11 | P3 | Cấu hình giờ yên lặng, camera và người nhận | Có thể tắt toàn bộ cảnh báo tức thời |
| FR-12 | P3 | Gửi thử cảnh báo | Chỉ Admin; xem được lỗi cấu hình/điều kiện gửi |
| FR-13 | P0 | Xem từ xa qua VPN trên điện thoại/máy tính đã cấp quyền | Không cần mở port camera hoặc website ra Internet công khai |
| FR-14 | P4 | Gửi Zalo qua OA OpenAPI nếu người dùng chọn dịch vụ có phí | Adapter riêng, không làm hỏng Web Push nếu Zalo lỗi |

## 4. Yêu cầu phi chức năng và mục tiêu ban đầu

- Triển khai một hộ gia đình, **một camera C220**; cấu trúc cho phép tăng số camera sau khi đo tài nguyên thực tế.
- Live view hướng tới độ trễ vài giây, phụ thuộc HLS segment, mạng và thiết bị. Không hứa độ trễ cố định trước đo đạc.
- Khi camera mất kết nối, worker tự retry với backoff; trang vẫn dùng được và báo trạng thái.
- Một camera chỉ có một tiến trình ingest cho mỗi stream được chọn; nhiều người xem dùng chung đầu ra.
- Lưu thời gian UTC trong DB, hiển thị theo múi giờ người dùng; mặc định `Asia/Bangkok`.
- Có health/readiness riêng; snapshot/event không bị mất do lỗi gửi cảnh báo.
- Mục tiêu vận hành: chạy trên máy/NAS trong LAN, có dung lượng và CPU đủ cho số camera/model được chọn.

## 5. Ngoài phạm vi bản đầu

- Ghi hình 24/7, cloud backup, âm thanh hai chiều, PTZ, điều khiển camera qua Tapo cloud.
- Mở RTSP trực tiếp ra Internet hoặc gửi tin bằng API Zalo không chính thức.
- Tự động quyết định người lạ là nguy hiểm; nhận diện khuôn mặt không dùng làm kiểm soát ra vào.

## 6. Phụ thuộc cần xác minh

- Tapo C220 được TP-Link liệt kê hỗ trợ RTSP; vẫn cần xác nhận phiên bản phần cứng/firmware và thử trên thiết bị thật. Tạo **Camera Account** riêng trong Tapo app. Stream thường là `/stream1` (chất lượng cao) hoặc `/stream2` (thấp), cổng 554. [TP-Link C220 datasheet](https://static.tp-link.com/upload/product-overview/2025/202509/20250925/Tapo%20C220%202.0%262.6_Datasheet.pdf), [TP-Link RTSP FAQ](https://www.tp-link.com/us/support/faq/2680/)
- Zalo OA OpenAPI được mô tả là tính năng trả phí; tin vào GMF có thể miễn phí theo chính sách tin nhắn nhưng việc tự động gửi qua OpenAPI vẫn cần gói/quyền hợp lệ. Không thiết kế dựa trên giả định có API Zalo cá nhân miễn phí. [Zalo OpenAPI](https://oa.zalo.me/home/resources/library/tinh-nang-mo-rong-nang-cap-zalo-oa_2410156908111809541), [Zalo các loại tin](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511?tab=library)
