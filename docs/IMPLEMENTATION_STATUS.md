# Trạng thái triển khai — 30/10/2026

## Đã triển khai

- Phase 0: monorepo `frontend/`, `backend/`, `infra/`; Vite/React/TypeScript; FastAPI; SQLite migration; cấu hình typed từ environment; `/health`, `/ready`; lệnh dev chung; test và build.
- Phase 1 phần mềm: đăng nhập Admin/Viewer bằng cookie HttpOnly và CSRF token, tạo Viewer, quản lý camera, giới hạn host trong subnet LAN, mã hóa mật khẩu camera, kiểm tra RTSP bằng FFprobe, một tiến trình FFmpeg/HLS cho mỗi camera, gateway manifest/segment có xác thực, giao diện live và trạng thái offline.
- Thiết kế UI dùng `ui-ux-pro-max`: dashboard tối, trạng thái bằng chữ và màu, form có nhãn, touch target rõ, responsive, focus và reduced motion.

## Kiểm chứng

- `backend/.venv/Scripts/python -m pytest backend/tests -q`: 2 passed.
- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`: đạt.
- `npm.cmd audit --audit-level=low`: 0 vulnerabilities sau cập nhật Vite/ESLint.
- Smoke test `dev.py`: `GET /health` 200, UI 200, `GET /api/v1/cameras` chưa đăng nhập 401.

## Chưa kiểm chứng / chưa triển khai

- Không có camera C220 và FFmpeg trên máy làm việc, nên chưa thể kiểm chứng ingest, codec, số viewer, tự phục hồi và dọn file/process trên thiết bị thật.
- Chưa có máy server, VPN và điện thoại đích; chưa thử HTTPS/Tailscale Serve từ mạng di động.
- Phase 2–4 (sự kiện, nhận diện, Web Push, Zalo) chưa bắt đầu theo thứ tự roadmap.
- Chưa có cấu hình production vì hệ điều hành và máy server chưa được xác định. Trước khi sử dụng thật cần triển khai reverse proxy cùng origin qua HTTPS và đặt `COOKIE_SECURE=true`.

## Phụ thuộc cần biết để tiếp tục Phase 1

Máy/hệ điều hành chạy server, phần cứng và firmware Tapo C220, hệ điều hành điện thoại. Không cần gửi mật khẩu Camera Account qua chat.
