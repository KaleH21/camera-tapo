# Triển khai LAN/VPN

Ứng dụng chỉ nên phục vụ trên mạng nội bộ hoặc tailnet. Giữ camera ở LAN; không port-forward RTSP 554. Trước khi triển khai thực tế, xác nhận hệ điều hành và phần cứng server, cài FFmpeg/FFprobe, gán IP cố định cho C220, rồi thử `/stream1` hoặc `/stream2` bằng Camera Account riêng.

Trong development, `dev.py` chạy FastAPI và Vite. Khi đưa lên máy luôn bật, build frontend, phục vụ `frontend/dist` và reverse proxy `/api` về FastAPI trên **cùng origin**. Dùng Tailscale Serve để cấp HTTPS trong tailnet; đặt `COOKIE_SECURE=true`. Không chạy Vite development server hoặc dùng Tailscale Funnel làm đường truy cập production.

Sau khi biết máy đích, bổ sung cấu hình service/reverse proxy phù hợp và kiểm tra trên điện thoại ở mạng di động có VPN.
