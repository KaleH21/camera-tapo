# Roadmap triển khai cho coding agent

Mỗi phase phải chạy được độc lập sau khi hoàn thành. Không gắn chặt UI với model AI hoặc Zalo API.

## Phase 0 — Khung dự án và môi trường

**Làm:** monorepo `frontend/`, `backend/`, `infra/`; React/TypeScript/Vite, FastAPI, cấu hình typed, `.env.example`, lint/typecheck, Docker Compose hoặc script chạy local, migration, health endpoint, README chạy dự án. Dùng camera giả hoặc video test trong môi trường phát triển. Thiết kế cho một Tapo C220; xem `DEPLOYMENT.md`.

**Hoàn thành khi:** frontend và backend khởi động, gọi `/health`, chạy kiểm tra tự động; secret không nằm trong repo. Ghi rõ cách cài FFmpeg và cách kiểm tra model Tapo hỗ trợ RTSP.

## Phase 1 — Camera và live view (MVP)

**Làm:** đăng nhập Admin/Viewer, cấu hình C220, test RTSP, media worker FFmpeg, HLS gateway có auth, trang live, trạng thái và reconnect. Đầu tiên chứng minh với video/RTSP giả, sau đó kiểm tra camera thật. Thêm hướng dẫn truy cập từ xa qua VPN; không public web/RTSP.

**Hoàn thành khi:** hai browser xem cùng camera mà chỉ có một ingest; tắt camera thì UI báo offline và reconnect sau khi camera lên; đóng ứng dụng dọn process/segments; RTSP secret không xuất hiện trong network tab/log/API. Xem `ACCEPTANCE.md`.

## Phase 2 — Phát hiện người và sự kiện

**Làm:** frame sampling, detection adapter (có fake để test), gom frame thành episode, snapshot riêng tư, trang sự kiện, chính sách lưu/xóa. Ghi lại model và cấu hình được dùng.

**Hoàn thành khi:** một đợt người xuất hiện tạo một event, không spam mỗi frame; mất camera không làm sập API; event có thể xem và xóa theo thời hạn.

## Phase 3 — Nhận diện người quen

**Làm:** UI quản lý người/consent/ảnh mẫu, quality gate, embedding từ model tiền huấn luyện theo model version, `known`/`unknown`/`uncertain`, review thủ công. Tách ảnh đăng ký và ảnh đánh giá; đo precision/recall trên bộ dữ liệu gia đình được đồng ý; chỉ bật cảnh báo sau khi đo false positives thực tế.

**Hoàn thành khi:** ảnh mờ/không thấy mặt là `uncertain`; xóa người xóa ảnh và embedding; không xem được embedding qua API; đổi model có quy trình tái tạo embedding. Không đặt một ngưỡng “chuẩn” chung khi chưa hiệu chỉnh dữ liệu thật.

## Phase 4 — Cảnh báo Web Push miễn phí

**Làm:** PWA/service worker, cấp quyền nhận thông báo, subscription theo thiết bị, rule cho `unknown`, min observation, cooldown, quiet hours, outbox, retry, audit và gửi thử. Nội dung push chỉ gồm camera, thời gian và link đăng nhập vào event; không đặt ảnh/embedding trong payload.

**Hoàn thành khi:** một event gửi tối đa một thông báo mỗi thiết bị/rule; tắt cảnh báo chặn gửi mới; hủy đăng ký thiết bị có hiệu lực; lỗi push không làm mất event. Kiểm tra trên điện thoại/trình duyệt thực tế; không hứa nhận thông báo nếu người dùng tắt quyền hoặc hệ điều hành hạn chế chạy nền.

## Phase 4b — Zalo tùy chọn có phí

**Điều kiện vào:** người dùng chọn gói OA trả phí phù hợp và có OA/API chính thức đủ quyền, loại tin phù hợp, người nhận hợp lệ theo chính sách hiện hành. Nếu điều kiện này chưa đạt, giữ adapter giả; **không gọi API thật**.

**Làm:** tái sử dụng rule/outbox từ Phase 4, bổ sung Zalo adapter và gửi thử. Chỉ gửi link đăng nhập xem event nếu chính sách không cho ảnh. Trước khi bật thật, cập nhật tài liệu với API endpoint/quyền/template đã được xác nhận.

**Hoàn thành khi:** một event gửi tối đa một thông báo mỗi rule; lỗi tạm thời được retry có giới hạn; lỗi cố định hiển thị cho Admin; tắt cảnh báo chặn gửi mới; gửi thử tới đúng người nhận.

## Phase 5 — Vận hành

**Làm:** backup/restore, metrics CPU/RAM/disk, rotation log, retention job, tài liệu cập nhật/rollback, kiểm thử mất điện/mạng và kiểm tra lại truy cập từ xa an toàn.

**Hoàn thành khi:** khôi phục từ backup trên môi trường thử, có cảnh báo dung lượng và camera offline, không mất secret hoặc file nhạy cảm vào log/backup không mã hóa.

## Các quyết định chỉ chốt sau đo đạc

- Model detection/face recognition, FPS sampling, confidence threshold, độ dài HLS segment.
- Nâng SQLite lên PostgreSQL, thêm broker, GPU hay WebRTC.
- Máy chạy server, chi tiết VPN; giải pháp Zalo cụ thể chỉ khi chủ dự án chấp nhận chi phí.
