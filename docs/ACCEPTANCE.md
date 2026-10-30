# Kịch bản nghiệm thu

Đánh dấu `[x]` sau khi kiểm chứng bằng mã và thiết bị tương ứng; ghi lệnh, kết quả, ngày, model camera trong báo cáo phase. Các mục phần cứng/Zalo có thể ghi `blocked: thiếu thiết bị/tài khoản`, không được tự nhận đã đạt.

## Phase 0

- [x] Một lệnh được tài liệu hóa khởi động frontend + backend trong dev (`README_APP.md`; smoke test HTTP: UI 200, API health 200, API chưa xác thực 401).
- [x] `/health` trả trạng thái API; config thiếu secret báo lỗi rõ, không in secret (test API và kiểm tra startup).
- [x] Typecheck/lint/test liên quan chạy thành công (30/10/2026: pytest, tsc, ESLint, Vite build).
- [x] `.env.example` chỉ có giá trị giả; không có credential thật trong repo.

## Phase 1

- [ ] Admin thêm/test/sửa/xóa camera; Viewer không sửa được.
- [ ] Tapo thật phát RTSP trong LAN; xác nhận model/firmware, stream path và camera account.
- [ ] Tapo C220 được gán IP ổn định trong LAN; server không cần công khai RTSP.
- [ ] Browser desktop/mobile xem live; hai viewer dùng chung một ingest.
- [ ] Khi điện thoại ở mạng di động và đã kết nối VPN, xem được web bằng HTTPS; thiết bị ngoài VPN không truy cập được.
- [ ] Dừng camera: trạng thái offline, UI không treo; mở lại: tự phục hồi.
- [ ] Manifest/segment/snapshot trả 401/403 khi không có quyền; secret RTSP không lộ ở network tab, API, log.
- [ ] Tắt server dọn FFmpeg và file HLS tạm.

## Phase 2

- [ ] Video test có người tạo event; nhiều frame liên tiếp gom thành một event.
- [ ] Không có người không tạo event; lỗi model không làm sập API.
- [ ] Snapshot chỉ xem khi đăng nhập; retention xóa đúng hạn.

## Phase 3

- [ ] Admin đăng ký và xóa người quen; Viewer không thao tác được.
- [ ] Mặt rõ của người đã đăng ký có thể thành `known`; người chưa đăng ký đủ chất lượng thành `unknown`.
- [ ] Mặt mờ/khuất/không thấy mặt thành `uncertain`, không tạo cảnh báo unknown.
- [ ] Review thủ công ghi audit; xóa người xóa sample và embedding.
- [ ] Có báo cáo đo sai số trên dữ liệu đã đồng ý trước khi bật cảnh báo.

## Phase 4 — Web Push

- [ ] Adapter giả chứng minh dedupe, cooldown, quiet hours, retry và nút tắt.
- [ ] Đăng ký/hủy đăng ký thiết bị, cấp quyền từ thao tác người dùng; gửi thử tới đúng thiết bị.
- [ ] Kiểm tra push khi app đóng trên thiết bị thật; với iPhone, PWA đã được thêm vào Home Screen.
- [ ] Event vẫn lưu nếu Web Push không hoạt động; không gửi trùng khi worker restart.

## Phase 4b — Zalo tùy chọn

- [ ] Chủ dự án chấp nhận gói OA/OpenAPI có phí; loại tin/người nhận/template đã được xác nhận từ nguồn chính thức.
- [ ] Gửi thử bằng API chính thức tới đúng người nhận; báo lỗi rõ khi token/quyền/hạn mức sai.
- [ ] Tắt Zalo không ảnh hưởng cảnh báo Web Push.

## Phase 5

- [ ] Backup/restore thử thành công; quyền truy cập và mã hóa backup được kiểm tra.
- [ ] Hệ thống ổn định sau mất mạng/mất điện; có trạng thái và metric đủ chẩn đoán.
