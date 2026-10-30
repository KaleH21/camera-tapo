import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole, X } from 'lucide-react'
import { blankCameraForm, type CameraForm, type CameraItem } from '../types/models'

type Props = {
  editing: CameraItem | null
  busy: boolean
  onSave: (form: CameraForm) => Promise<boolean>
  onClose: () => void
}

export function CameraDialog({ editing, busy, onSave, onClose }: Props) {
  const [form, setForm] = useState<CameraForm>(editing ? {
    name: editing.name, host: editing.host || '', port: editing.port || 554,
    stream_path: editing.stream_path || '/stream1', username: editing.username || '', password: '',
  } : { ...blankCameraForm })

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (await onSave(form)) onClose()
  }

  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-head"><div>
        <span className="overline">CẤU HÌNH THIẾT BỊ</span>
        <h2 id="modal-title">{editing ? 'Chỉnh sửa camera' : 'Thêm camera mới'}</h2>
      </div><button className="icon-button" aria-label="Đóng" onClick={onClose}><X size={20} /></button></div>
      <p className="modal-intro">Sử dụng Camera Account đã tạo trong ứng dụng Tapo. Camera cần có IP cố định trong mạng nhà.</p>
      <form onSubmit={submit} className="camera-form">
        <label htmlFor="cam-name">Tên camera</label>
        <input id="cam-name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}
          placeholder="Ví dụ: Phòng khách" maxLength={80} required />
        <div className="form-columns">
          <div><label htmlFor="cam-host">Địa chỉ IP trong LAN</label>
            <input id="cam-host" value={form.host} onChange={event => setForm({ ...form, host: event.target.value })}
              placeholder="192.168.1.100" required /></div>
          <div><label htmlFor="cam-port">Cổng RTSP</label>
            <input id="cam-port" type="number" min="1" max="65535" value={form.port}
              onChange={event => setForm({ ...form, port: Number(event.target.value) })} required /></div>
        </div>
        <label htmlFor="cam-stream">Luồng phát</label>
        <select id="cam-stream" value={form.stream_path} onChange={event => setForm({ ...form, stream_path: event.target.value })}>
          <option value="/stream1">/stream1 · Chất lượng cao</option>
          <option value="/stream2">/stream2 · Tiết kiệm băng thông</option>
        </select>
        <div className="form-columns">
          <div><label htmlFor="cam-user">Camera Account</label>
            <input id="cam-user" autoComplete="off" value={form.username}
              onChange={event => setForm({ ...form, username: event.target.value })} required /></div>
          <div><label htmlFor="cam-password">Mật khẩu {editing && <span>(để trống nếu giữ nguyên)</span>}</label>
            <input id="cam-password" type="password" autoComplete="new-password" value={form.password}
              onChange={event => setForm({ ...form, password: event.target.value })} required={!editing} /></div>
        </div>
        <div className="form-note"><LockKeyhole size={16} /> Mật khẩu được mã hóa trên server và không hiển thị lại.</div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
          <button className="primary-button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu camera'} <ArrowRight size={17} /></button>
        </div>
      </form>
    </div>
  </div>
}
