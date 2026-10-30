# Tapo Home Monitor — ứng dụng MVP

Xem [docs/CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md) để biết vai trò từng tầng và vị trí file sau khi tách cấu trúc.

Mã nguồn `frontend/` (React, TypeScript, Vite) và `backend/` (FastAPI, SQLite) triển khai Phase 0 và phần mềm của Phase 1. Hệ thống chỉ dành cho LAN/VPN. **Không mở port 554 hoặc website ra Internet công khai.**

## Chạy trên máy phát triển

Cần Python 3.11+, Node.js 20+ và FFmpeg/FFprobe trong `PATH`. Trên Windows có thể dùng `winget install Gyan.FFmpeg`, sau đó mở terminal mới và chạy `ffmpeg -version` và `ffprobe -version`. Cài thư viện:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
cd frontend
npm.cmd install
cd ..
```

Sao chép `backend/.env.example` thành `backend/.env`. Tạo secret bằng hai lệnh sau; điền giá trị vào `.env` và đặt mật khẩu Admin dài, duy nhất:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
backend/.venv/Scripts/python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Đặt `CAMERA_ALLOWED_CIDRS` theo mạng chứa camera, ví dụ `192.168.1.0/24`. Chạy **một lệnh** từ thư mục gốc:

```powershell
backend/.venv/Scripts/python dev.py
```

Nếu muốn chạy backend và frontend ở hai cửa sổ PowerShell riêng, từ thư mục gốc dùng:

```powershell
backend/.venv/Scripts/python.exe -m uvicorn app.main:app --app-dir backend --reload --reload-dir backend --host 127.0.0.1 --port 8000
```

Ở cửa sổ thứ hai dùng `cd frontend` rồi `npm.cmd run dev`. Tùy chọn `--app-dir backend` là bắt buộc khi gọi `app.main:app` từ thư mục gốc; nếu đã `cd backend` thì không cần tùy chọn này.

Mở <http://localhost:5173>. API: <http://127.0.0.1:8000/health>, OpenAPI: <http://127.0.0.1:8000/docs>. Vite proxy `/api` tới FastAPI. `COOKIE_SECURE=false` chỉ dùng với HTTP local; khi phục vụ qua HTTPS đặt `true` và dùng cùng origin cho UI/API.

Đăng nhập bằng Admin trong `.env`, thêm camera Tapo C220 với IP LAN và **Camera Account** riêng đã tạo trong app Tapo. Chọn `/stream1` hoặc `/stream2`. Trong mục Hệ thống, Admin có thể tạo tài khoản Viewer. Trước khi tích hợp, thử stream trên thiết bị thật bằng VLC/FFprobe. Đặt DHCP reservation cho IP camera. Nếu camera offline, UI tự làm mới trạng thái sau 7 giây; nút Kiểm tra dùng FFprobe. Một tiến trình FFmpeg được chia sẻ cho mọi người xem cùng camera. Tắt server sẽ dừng FFmpeg và xóa HLS tạm.

Để xem từ xa, cài Tailscale trên server và thiết bị người nhà, cấu hình **Tailscale Serve** tới ứng dụng web qua HTTPS. Chỉ dùng Serve trong tailnet, không dùng Funnel. Cần cấu hình reverse proxy cùng origin cho frontend và `/api` khi triển khai production. Hiện repo chưa có cấu hình production vì hệ điều hành/máy server chưa được xác nhận.

## Kiểm tra

```powershell
backend/.venv/Scripts/python -m pytest backend/tests -q
cd frontend
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

## Giới hạn hiện tại

Chưa kiểm chứng C220 thật, điện thoại, VPN/HTTPS, codec/độ trễ và FFmpeg trên máy đích. Phase 2–4 (phát hiện người, nhận diện, cảnh báo) chưa triển khai. Bootstrap Admin chỉ tạo nếu chưa có tài khoản cùng tên; đổi mật khẩu trong `.env` sau đó sẽ không đổi mật khẩu trong DB. Xóa `backend/data` chỉ phù hợp môi trường thử nghiệm và sẽ xóa mọi cấu hình.
