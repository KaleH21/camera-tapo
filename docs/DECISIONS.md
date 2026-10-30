# Quyết định, giả định và câu hỏi cần chốt

## Đã chọn cho bản thiết kế đầu

| Quyết định | Lý do | Điều kiện xem lại |
| --- | --- | --- |
| React + TypeScript + Vite, FastAPI | Đúng yêu cầu và dễ chia frontend/backend | Chỉ đổi khi có ràng buộc triển khai mới |
| RTSP trong LAN → FFmpeg → HLS → browser | Browser không phát RTSP trực tiếp; dễ làm MVP | Cần độ trễ dưới 1 giây hoặc audio tương tác |
| SQLite + outbox ban đầu | Đủ đơn giản cho một hộ gia đình, ít camera | Nhiều node/worker ghi cao hoặc contention đo được |
| Worker riêng cho media và AI | FFmpeg/model có thể lỗi, cần cô lập API | Chỉ gom process nếu đo đủ an toàn |
| Zalo adapter sau cùng | Phụ thuộc quyền/loại tin và điều kiện người nhận | Khi tài khoản thật được xác minh |
| Web Push/PWA là cảnh báo mặc định | Không cần gói OA trả phí; phù hợp mục tiêu miễn phí | Nếu thiết bị không hỗ trợ hoặc độ tin cậy không đạt |
| Tailscale Serve cho xem từ xa | VPN riêng, HTTPS, không public camera/web; gói Personal hiện miễn phí | Số người dùng vượt giới hạn hoặc muốn tự vận hành VPN |

## Giả định tạm thời

- Dùng trong một hộ gia đình, **một Tapo C220**, xem trong LAN và từ xa qua VPN.
- Tài khoản Admin quản lý hệ thống; viewer là người nhà được cấp quyền.
- C220 có nguồn điện và được TP-Link liệt kê hỗ trợ RTSP; phiên bản phần cứng/firmware cụ thể vẫn cần xác minh trên máy thật. [TP-Link C220 datasheet](https://static.tp-link.com/upload/product-overview/2025/202509/20250925/Tapo%20C220%202.0%262.6_Datasheet.pdf)
- Không cần ghi hình liên tục trong V1.
- Lưu dữ liệu và xử lý AI tại chỗ.

## Câu hỏi cho chủ dự án, ưu tiên trước từng phase

1. **Trước Phase 1:** máy và hệ điều hành chạy server là gì, phiên bản phần cứng/firmware C220 là gì, điện thoại dùng Android hay iPhone?
2. **Trước Phase 2:** khu vực camera, thời gian giữ snapshot/event, có muốn lưu clip ngắn hay chỉ snapshot?
3. **Trước Phase 3:** ai được đăng ký, có đồng ý của từng người chưa, bao nhiêu ảnh/người và ảnh đánh giá độc lập có sẵn không, mức báo sai chấp nhận được?
4. **Trước Phase 4b:** nếu vẫn cần Zalo, có chấp nhận trả phí gói OA/OpenAPI không; có OA doanh nghiệp, UID người nhận và loại tin/template phù hợp không?

Không cần chặn Phase 0 vì các câu hỏi này. Với câu trả lời chưa có, coding agent dùng adapter giả và ghi giả định rõ trong báo cáo.

## Nguồn tham khảo chính thức (kiểm tra 30/10/2026)

- [TP-Link RTSP/ONVIF FAQ](https://www.tp-link.com/us/support/faq/2680/): tài khoản camera riêng, URL `/stream1`/`/stream2`, port 554, giới hạn một số model.
- [Zalo OA OpenAPI — khởi tạo và cấp quyền](https://oa.zalo.me/home/documents/guides/Khoi-tao-ung-dung-va-cap-quyen_117071366476220195): OA, ứng dụng, quyền và webhook.
- [Zalo OA — các loại tin](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511?tab=library): điều kiện gửi theo loại tin; cần kiểm tra lại lúc tích hợp.
- [Zalo OA — chính sách tương tác](https://oa.zalo.me/home/documents/vie/policy/tuong-tac-cua-oa-voi-nguoi-dung): tần suất và nội dung phù hợp.
- [Zalo OA — OpenAPI trả phí](https://oa.zalo.me/home/resources/library/tinh-nang-mo-rong-nang-cap-zalo-oa_2410156908111809541): tích hợp tự động không mặc định miễn phí.
- [Tailscale Personal](https://tailscale.com/pricing): gói miễn phí hiện có tối đa 6 người dùng; kiểm tra lại khi triển khai.
- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve): phục vụ web qua HTTPS trong tailnet.
- [Apple Web Push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers): trên iPhone cần web app trên Home Screen và quyền thông báo.
