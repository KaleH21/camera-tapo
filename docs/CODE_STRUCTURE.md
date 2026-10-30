# Cấu trúc mã nguồn

## Frontend

```text
frontend/src/
├── App.tsx                 # Ghép luồng đăng nhập, điều hướng và các trang
├── pages/                  # Màn hình đăng nhập, dashboard, cài đặt
├── components/             # Thành phần giao diện nhỏ, có thể tái sử dụng
├── hooks/                  # Trạng thái và thao tác của auth/camera
├── services/               # Hàm gọi API theo miền dữ liệu
├── lib/http.ts             # HTTP client, cookie và CSRF header
├── types/models.ts         # Kiểu dữ liệu dùng chung
└── styles/                 # CSS nền, từng khu vực và responsive
```

Trang và component không tự ghép URL API. `services/` dùng `lib/http.ts`; hooks quản lý trạng thái và gọi services. `App.tsx` chỉ điều phối các màn hình và dialog.

## Backend

```text
backend/app/
├── main.py                 # Khởi tạo FastAPI, router và vòng đời ứng dụng
├── api/routes/             # Endpoint theo nhóm health/auth/users/cameras/media
├── api/dependencies.py     # Xác thực cookie, CSRF và quyền Admin
├── schemas/                # Kiểm tra đầu vào bằng Pydantic
├── repositories/           # Truy vấn SQLite
├── services/               # Nghiệp vụ auth, camera, RTSP và FFmpeg/HLS
└── core/                   # Cấu hình, DB/migration, hash và lỗi API
```

Router nhận request và gọi service/repository; không mở kết nối SQLite hoặc tạo FFmpeg trực tiếp. Repository chỉ phụ trách lưu và đọc dữ liệu. Media service giữ một FFmpeg cho mỗi camera; mọi endpoint HLS vẫn đi qua dependency xác thực. Migration ở `backend/migrations/`, dữ liệu runtime ở `backend/data/` và không commit.

Các URL API, cấu trúc response và lệnh chạy trong `README_APP.md` giữ nguyên sau refactor.
