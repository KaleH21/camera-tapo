# Hợp đồng API dự kiến (v1)

Prefix `/api/v1`. JSON theo snake_case. Thời gian ISO 8601 UTC (`2026-10-30T10:00:00Z`). Pagination bằng `limit`/`cursor`, giới hạn `limit` tối đa 100. FastAPI sinh OpenAPI từ schema thật; file này là hợp đồng thiết kế và cần cập nhật khi code.

## Auth

| Method | Path | Quyền | Mục đích |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Nhận session cookie HttpOnly; rate limit |
| POST | `/auth/logout` | Đã đăng nhập | Hủy session |
| GET | `/auth/me` | Đã đăng nhập | Vai trò và thông tin tối thiểu |
| GET | `/users` | Admin | Danh sách tài khoản, không có password hash |
| POST | `/users` | Admin | Tạo tài khoản Viewer (username, password tối thiểu 12 ký tự) |

Endpoint thay đổi trạng thái dùng CSRF protection khi dùng cookie. Không dùng token trong query string.

## Camera và media

| Method | Path | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | `/cameras` | Viewer | Danh sách + trạng thái, không có secret |
| POST | `/cameras` | Admin | Tạo camera; host LAN, port, path, username, password |
| PATCH | `/cameras/{id}` | Admin | Sửa cấu hình; password chỉ đổi khi có giá trị mới |
| DELETE | `/cameras/{id}` | Admin | Xóa camera theo chính sách giữ sự kiện |
| POST | `/cameras/{id}/test` | Admin | Test RTSP, kết quả đã lọc secret |
| GET | `/cameras/{id}/live/index.m3u8` | Viewer | HLS manifest được xác thực |
| GET | `/cameras/{id}/live/{segment}` | Viewer | HLS segment được xác thực; chỉ tên file hợp lệ |

`GET /cameras` ví dụ: `{ "items": [{ "id": "uuid", "name": "Cửa trước", "status": "online", "last_frame_at": "2026-10-30T10:00:00Z", "live_url": "/api/v1/cameras/uuid/live/index.m3u8" }] }`.

Admin nhận thêm `host`, `port`, `stream_path`, `username`; Viewer không nhận các trường cấu hình kết nối. Mật khẩu không được trả cho cả hai vai trò.

## Sự kiện và người quen

| Method | Path | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET | `/events?camera_id=&classification=&from=&to=&limit=&cursor=` | Viewer | Danh sách |
| GET | `/events/{id}` | Viewer | Chi tiết |
| GET | `/events/{id}/snapshot` | Viewer | Ảnh có auth, no-store |
| PATCH | `/events/{id}/review` | Admin | Xác nhận/đổi nhãn, lý do tùy chọn |
| GET | `/people` | Viewer | Danh sách người đã đăng ký, không có embedding |
| POST | `/people` | Admin | Tạo người với tên/quan hệ/consent metadata |
| POST | `/people/{id}/samples` | Admin | Upload ảnh mẫu; kiểm tra định dạng, kích thước, số mặt |
| DELETE | `/people/{id}` | Admin | Xóa người + ảnh mẫu + embedding; ghi audit tối thiểu |

`classification` chỉ nhận `known`, `unknown`, `uncertain`, `unprocessed`; `person_id` chỉ có khi `known`.

## Cảnh báo

| Method | Path | Quyền | Mục đích |
| --- | --- | --- | --- |
| GET/PATCH | `/alert-settings` | Admin | Bật/tắt, cooldown, quiet hours, camera, người nhận |
| POST | `/alert-settings/test` | Admin | Yêu cầu gửi thử qua adapter đã cấu hình |
| GET | `/notifications?event_id=&status=` | Admin | Lịch sử gửi và lỗi đã lọc token |
| POST | `/push-subscriptions` | Đã đăng nhập | Đăng ký Web Push của thiết bị sau khi người dùng cho phép |
| DELETE | `/push-subscriptions/{id}` | Chủ sở hữu/Admin | Hủy đăng ký thiết bị |

## Lỗi và giới hạn

Lỗi thống nhất: `{ "error": { "code": "CAMERA_OFFLINE", "message": "Camera đang mất kết nối", "request_id": "..." } }`. Dùng 400/422 dữ liệu sai, 401 chưa đăng nhập, 403 thiếu quyền, 404 không thấy hoặc không được phép xem, 409 xung đột, 429 giới hạn, 503 camera/adapter tạm ngừng. Không trả URL RTSP, token, stack trace. Media endpoint có `Cache-Control: private, no-store` hoặc cache ngắn phù hợp segment và kiểm tra quyền ở mọi request.
