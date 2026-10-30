# Tapo Home Monitor — bộ tài liệu triển khai

**Đã có ứng dụng MVP:** xem [README_APP.md](README_APP.md) để cài đặt, chạy frontend/backend và xem phạm vi đã triển khai.

Mục tiêu: website xem **một camera Tapo C220** qua RTSP trong mạng nhà và từ xa qua VPN, sau đó mở rộng nhận diện người quen trong gia đình và cảnh báo khi phát hiện người chưa nhận diện. Frontend React, backend FastAPI. Repo hiện là **bộ đặc tả để triển khai**, chưa có mã ứng dụng.

## Bắt đầu với Claude

1. Đưa Claude vào thư mục repo và yêu cầu đọc [CLAUDE.md](CLAUDE.md).
2. Bắt đầu bằng prompt: `Đọc CLAUDE.md và docs/ROADMAP.md. Triển khai Phase 0 rồi Phase 1 theo thứ tự. Trước mỗi phase, nêu các file sẽ tạo và tiêu chí nghiệm thu; sau đó thực hiện và tự kiểm tra.`
3. Model đã chốt: **Tapo C220, một camera**; cần xem cả trong LAN và từ xa. Còn cần xác định máy/hệ điều hành chạy server. Không dán mật khẩu RTSP, token Zalo vào chat hoặc commit.

## Bản đồ tài liệu

| File | Nội dung |
| --- | --- |
| [CLAUDE.md](CLAUDE.md) | Quy tắc làm việc cho coding agent |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Mục tiêu, phạm vi, câu chuyện người dùng, phi chức năng |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Sơ đồ, luồng dữ liệu, quyết định kỹ thuật |
| [docs/API.md](docs/API.md) | Hợp đồng API và mã lỗi |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Bảng dữ liệu và vòng đời ảnh |
| [docs/SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md) | Bảo mật, quyền riêng tư, nhận diện khuôn mặt |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Các phase, thứ tự và tiêu chí hoàn thành |
| [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md) | Kịch bản nghiệm thu end to end |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Giả định, câu hỏi cần chốt và nguồn tham khảo |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hai chế độ truy cập và chuẩn bị Tapo C220 |

## Nguyên tắc sản phẩm

- Tự triển khai trong mạng gia đình; xem từ xa qua VPN, không công khai camera RTSP ra Internet.
- V1 tập trung **xem camera ổn định**. Nhận diện, Web Push và Zalo tùy chọn là các phase kế tiếp, có thể bật/tắt độc lập.
- “Người lạ” trong giao diện nghĩa là **người chưa khớp với danh sách đã đăng ký**, không phải kết luận về danh tính hay ý định.
- Ưu tiên lưu tối thiểu; người dùng có quyền xóa ảnh/đặc trưng khuôn mặt đã đăng ký.
- Cảnh báo miễn phí mặc định bằng Web Push/PWA. Zalo tự động chỉ bật khi có OA OpenAPI hợp lệ; tài liệu Zalo hiện mô tả OpenAPI là tính năng trả phí.

## Nguồn chính thức đã kiểm tra ngày 30/10/2026

- [TP-Link: xem Tapo qua RTSP/ONVIF](https://www.tp-link.com/us/support/faq/2680/)
- [Zalo OA: tổng quan các loại tin nhắn](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511?tab=library)
- [Zalo OA: khởi tạo ứng dụng và cấp quyền OpenAPI](https://oa.zalo.me/home/documents/guides/Khoi-tao-ung-dung-va-cap-quyen_117071366476220195)
- [Zalo OA: OpenAPI là tính năng trả phí](https://oa.zalo.me/home/resources/library/tinh-nang-mo-rong-nang-cap-zalo-oa_2410156908111809541)

Chính sách và API của bên thứ ba có thể đổi; kiểm tra lại trước khi tích hợp thực tế.
