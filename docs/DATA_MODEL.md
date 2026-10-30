# Mô hình dữ liệu dự kiến

UUID làm khóa chính. Tất cả `created_at`/`updated_at` dùng UTC. Migration là nguồn tạo schema; không tạo bảng tự phát khi startup production.

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| `users` | `id`, `username`, `password_hash`, `role`, `disabled_at` | `role`: admin/viewer; không lưu mật khẩu thô |
| `sessions` | `id`, `user_id`, `expires_at`, `revoked_at` | Chỉ lưu hash của session token |
| `cameras` | `id`, `name`, `host`, `port`, `stream_path`, `username`, `credential_ref`, `enabled`, `created_at` | Secret lấy qua `credential_ref` từ secret store; nếu V1 dùng encrypted DB field, khóa mã hóa phải ở ngoài DB |
| `camera_status` | `camera_id`, `state`, `last_frame_at`, `last_error_code`, `updated_at` | Dữ liệu trạng thái; có thể lưu in memory và ghi snapshot định kỳ |
| `people` | `id`, `display_name`, `relationship`, `consent_recorded_at`, `consent_note`, `created_at` | Chỉ đăng ký khi có đồng ý phù hợp |
| `face_samples` | `id`, `person_id`, `file_ref`, `quality_score`, `model_version`, `created_at` | File riêng tư; kiểm tra ảnh đầu vào |
| `face_embeddings` | `id`, `sample_id`, `encrypted_vector_ref`, `model_version`, `created_at` | Không trả qua API; xóa theo người |
| `events` | `id`, `camera_id`, `started_at`, `ended_at`, `classification`, `person_id`, `confidence`, `snapshot_ref`, `review_state`, `created_at` | `person_id` nullable; confidence không phải xác suất danh tính |
| `event_reviews` | `id`, `event_id`, `reviewer_id`, `old_classification`, `new_classification`, `note`, `created_at` | Audit sửa nhãn |
| `alert_settings` | `id`, `enabled`, `cooldown_seconds`, `min_observation_seconds`, `quiet_hours_json`, `updated_at` | Có thể tách rule theo camera sau |
| `notification_outbox` | `id`, `event_id`, `channel`, `recipient_ref`, `dedupe_key`, `status`, `attempt_count`, `next_attempt_at`, `last_error_code`, `created_at`, `sent_at` | Unique `dedupe_key` tránh gửi trùng |
| `push_subscriptions` | `id`, `user_id`, `endpoint_ref`, `keys_encrypted_ref`, `device_label`, `created_at`, `last_success_at` | Khóa/endpoint nhạy cảm, xóa khi subscription hết hạn hoặc user yêu cầu |
| `audit_logs` | `id`, `actor_id`, `action`, `resource_type`, `resource_id`, `created_at` | Không lưu secret/ảnh trong payload |

## Quan hệ và ràng buộc

- `cameras` 1:N `events`; `people` 1:N `face_samples`; `face_samples` 1:N `face_embeddings` theo version model.
- `events.person_id` nullable. Nếu xóa người, đặt `person_id = NULL`, giữ event theo thời hạn lưu hoặc xóa theo lựa chọn của Admin.
- `notification_outbox.event_id` là FK, `dedupe_key` unique. Khóa gợi ý: `channel + event_id + rule_version`.
- Index `events(camera_id, started_at DESC)`, `events(classification, started_at DESC)`, `notification_outbox(status, next_attempt_at)`.
- Không nhét ảnh/video/embedding vào JSON response mặc định. DB chỉ chứa reference; file nằm ngoài web root.

## Vòng đời dữ liệu

| Loại | Mặc định đề xuất | Xóa |
| --- | --- | --- |
| HLS segment | Vài phút | Worker dọn liên tục, dọn khi camera bị xóa |
| Snapshot sự kiện | 30 ngày | Job dọn định kỳ; Admin xóa sớm được |
| Event metadata | 90 ngày | Job dọn định kỳ; có thể xuất trước khi xóa |
| Ảnh mẫu/embedding | Đến khi người đó rút đồng ý/xóa | Xóa ngay khỏi active storage và theo lịch backup |
| Notification log | 90 ngày | Job dọn định kỳ |
| Web Push subscription | Đến khi người dùng hủy hoặc endpoint hết hiệu lực | Xóa ngay khỏi active storage |
| Audit log | 180 ngày | Job dọn định kỳ, không chứa dữ liệu nhạy cảm |

Các mốc trên là mặc định thiết kế, cấu hình được; chốt theo nhu cầu thực tế trước khi triển khai. Backup cần có thời hạn lưu rõ và quy trình xóa hoặc hết hạn cho dữ liệu khuôn mặt.
