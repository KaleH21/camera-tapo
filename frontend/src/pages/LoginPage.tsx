import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Camera, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Brand } from '../components/Brand'

type Props = { onLogin: (username: string, password: string) => Promise<void> }

export function LoginPage({ onLogin }: Props) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(credentials.username, credentials.password)
      setCredentials({ username: '', password: '' })
    } catch (cause) {
      const message = (cause as Error).message
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="login-page">
    <div className="login-art">
      <Brand iconSize={24} />
      <div className="login-art-copy">
        <span className="eyebrow"><span className="tiny-dot" /> KHÔNG GIAN RIÊNG CỦA GIA ĐÌNH</span>
        <h1>An tâm hơn,<br /><em>mọi lúc.</em></h1>
        <p>Theo dõi ngôi nhà của bạn qua một giao diện riêng tư, rõ ràng và dễ sử dụng.</p>
        <div className="art-feature"><ShieldCheck size={20} /><span>Truy cập an toàn trong mạng riêng</span></div>
      </div>
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <div className="art-core"><Camera size={54} strokeWidth={1.4} /></div>
      <div className="art-caption"><span className="tiny-dot" /> Bảo vệ không gian của bạn</div>
    </div>
    <div className="login-panel"><div className="login-card">
      <div className="login-small-icon"><LockKeyhole size={22} /></div>
      <span className="overline">CHÀO MỪNG TRỞ LẠI</span>
      <h2>Đăng nhập</h2>
      <p>Nhập tài khoản của bạn để xem camera gia đình.</p>
      <form onSubmit={submit}>
        <label htmlFor="login-user">Tên đăng nhập</label>
        <input id="login-user" autoComplete="username" value={credentials.username}
          onChange={event => setCredentials({ ...credentials, username: event.target.value })}
          required placeholder="Nhập tên đăng nhập" />
        <label htmlFor="login-password">Mật khẩu</label>
        <div className="password-field">
          <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
            value={credentials.password} onChange={event => setCredentials({ ...credentials, password: event.target.value })}
            required placeholder="Nhập mật khẩu" />
          <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        <button className="primary-button login-submit" disabled={busy}>
          {busy ? 'Đang đăng nhập…' : 'Vào bảng điều khiển'} <ArrowRight size={18} />
        </button>
      </form>
      {error && <div role="alert" className="form-message">{error}</div>}
      <div className="login-foot"><LockKeyhole size={14} /> Chỉ dành cho thành viên được cấp quyền</div>
    </div></div>
  </main>
}
