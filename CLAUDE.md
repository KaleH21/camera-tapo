# Hướng dẫn cho Claude khi coding trong repo này

Đọc `README.md` và toàn bộ `docs/*.md` liên quan trước khi sửa mã. Tài liệu này là nguồn yêu cầu; nếu phát hiện mâu thuẫn, ghi rõ và sửa tài liệu cùng với mã.

## Cách làm

1. Làm theo từng phase trong `docs/ROADMAP.md`; không nhảy thẳng sang nhận diện/Zalo khi live view chưa ổn định.
2. Trước khi code một phase: tóm tắt thiết kế ngắn, danh sách file, phụ thuộc, rủi ro và tiêu chí nghiệm thu. Sau đó triển khai, chạy kiểm tra cần thiết, báo kết quả và hạn chế còn lại.
3. Dùng React + TypeScript + Vite cho frontend, FastAPI + Python cho backend. Tách adapter camera, media, recognition, notification để thay thế được.
4. Giữ mã dễ đọc; không thêm dịch vụ hay framework chỉ vì tiện. Khi thêm dependency, giải thích lý do và khóa phiên bản tương thích.
5. Viết test cho logic có rủi ro: phân quyền, state của camera, ngưỡng/cooldown cảnh báo, xóa dữ liệu, lỗi từ bên thứ ba. Không viết test chỉ lặp lại implementation.
6. Cập nhật `docs/API.md`, `docs/DATA_MODEL.md`, `docs/DECISIONS.md` khi hợp đồng hay lựa chọn thay đổi.

## Ranh giới bắt buộc

- Không đưa RTSP URL chứa tài khoản, token Zalo, ảnh thật hoặc embedding thật vào code, log, fixture, README hay commit. Dùng `.env.example` với giá trị giả.
- Không để trình duyệt kết nối RTSP trực tiếp. Backend/media worker đọc RTSP; frontend nhận stream phát được trong browser qua endpoint đã xác thực.
- Không mở port 554 ra Internet. Truy cập từ xa nếu cần dùng VPN hoặc reverse proxy HTTPS có xác thực.
- Không coi nhận diện khuôn mặt là chắc chắn. Có trạng thái `unknown` và `uncertain`, có ngưỡng điều chỉnh và xem lại thủ công.
- Không khẳng định có thể gửi Zalo cá nhân bằng token bất kỳ. Phải dùng API chính thức và xác minh loại OA/tin, quyền, hạn mức, template, người nhận, chi phí trước khi bật gửi thật.
- Cảnh báo miễn phí mặc định là Web Push/PWA. Không gắn Zalo OpenAPI vào phạm vi bắt buộc khi người dùng chưa chọn gói OA trả phí.
- Ảnh người thân dùng để tạo mẫu/embedding từ model tiền huấn luyện và hiệu chỉnh ngưỡng; không mặc định train một model mới từ đầu. Tách ảnh đăng ký và ảnh đánh giá để tránh kết quả đo sai lệch.
- Với một phase chưa thể tích hợp vì thiếu phần cứng/tài khoản, tạo adapter giả và kiểm thử được; ghi rõ bước xác minh trên thiết bị thật.

## Definition of done chung

- Chạy được bằng lệnh được ghi trong README ứng dụng tương lai; có `.env.example`, hướng dẫn cài FFmpeg nếu cần.
- Typecheck/lint/test liên quan đạt; API có OpenAPI schema và ví dụ lỗi.
- Tài nguyên media/worker được dọn khi shutdown; lỗi camera không làm chết API.
- Endpoint nhạy cảm có xác thực; ảnh/clip/embedding không được phục vụ như static công khai.
- Hoàn tất checklist tương ứng trong `docs/ACCEPTANCE.md`.
