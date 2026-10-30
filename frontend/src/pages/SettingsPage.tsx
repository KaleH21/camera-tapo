import { useEffect, useState, type FormEvent } from 'react'
import { Activity, Eye, Plus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { userApi } from '../services/userApi'
import type { User, Viewer } from '../types/models'

type Props = { user: User; cameraCount: number; onlineCount: number }

export function SettingsPage({ user, cameraCount, onlineCount }: Props) {
  const [viewers, setViewers] = useState<Viewer[]>([])
  const [form, setForm] = useState({ username: '', password: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user.role !== 'admin') return
    userApi.list().then(data => setViewers(data.items)).catch(error => toast.error((error as Error).message))
  }, [user])

  async function addViewer(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await userApi.createViewer(form.username, form.password, user.csrf_token)
      setForm({ username: '', password: '' })
      setViewers((await userApi.list()).items)
      toast.success('Đã tạo tài khoản người xem')
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const viewerAccounts = viewers.filter(item => item.role === 'viewer')
  return <div className="settings-grid">
    <section className="panel setting-panel">
      <div className="setting-icon"><ShieldCheck size={24} /></div>
      <h2>Truy cập an toàn</h2>
      <p>Luồng RTSP chỉ được xử lý trên server trong mạng LAN. Trình duyệt nhận HLS qua API có xác thực.</p>
      <div className="setting-row"><span>Vai trò hiện tại</span>
        <strong>{user.role === 'admin' ? 'Quản trị viên' : 'Người xem'}</strong></div>
      <div className="setting-row"><span>Truy cập từ xa</span><strong>Qua VPN riêng</strong></div>
    </section>
    <section className="panel setting-panel">
      <div className="setting-icon violet"><Activity size={24} /></div>
      <h2>Trạng thái triển khai</h2>
      <p>Phiên bản đầu tập trung vào xem live ổn định. Sự kiện, nhận diện và cảnh báo sẽ được phát triển ở các giai đoạn tiếp theo.</p>
      <div className="setting-row"><span>Camera đã cấu hình</span><strong>{cameraCount}</strong></div>
      <div className="setting-row"><span>Camera trực tuyến</span><strong>{onlineCount}</strong></div>
    </section>
    {user.role === 'admin' && <section className="panel setting-panel viewer-panel">
      <div className="setting-icon"><Eye size={24} /></div>
      <h2>Người xem</h2>
      <p>Tạo tài khoản cho người nhà. Người xem có thể xem live nhưng không thay đổi cấu hình camera.</p>
      <div className="viewer-list">
        {viewerAccounts.map(item => <div className="setting-row" key={item.id}><span>{item.username}</span><strong>Người xem</strong></div>)}
        {viewerAccounts.length === 0 && <span className="viewer-empty">Chưa có người xem.</span>}
      </div>
      <form onSubmit={addViewer} className="viewer-form">
        <label htmlFor="viewer-name">Tên đăng nhập</label>
        <input id="viewer-name" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })}
          minLength={3} maxLength={40} pattern="[a-zA-Z0-9_-]+" required />
        <label htmlFor="viewer-password">Mật khẩu (tối thiểu 12 ký tự)</label>
        <input id="viewer-password" type="password" autoComplete="new-password" value={form.password}
          onChange={event => setForm({ ...form, password: event.target.value })} minLength={12} required />
        <button className="primary-button" disabled={busy}><Plus size={16} /> Tạo người xem</button>
      </form>
    </section>}
  </div>
}
