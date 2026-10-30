import { Camera, House, LogOut, Settings2, ShieldCheck, X } from 'lucide-react'
import { Brand } from './Brand'
import type { User, View } from '../types/models'

type Props = {
  user: User
  view: View
  cameraCount: number
  mobileOpen: boolean
  onViewChange: (view: View) => void
  onClose: () => void
  onLogout: () => void
}

export function Sidebar({ user, view, cameraCount, mobileOpen, onViewChange, onClose, onLogout }: Props) {
  function navigate(next: View) {
    onViewChange(next)
    onClose()
  }

  return <>
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-head">
        <Brand />
        <button className="mobile-close" aria-label="Đóng menu" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="sidebar-caption">KHÔNG GIAN CỦA BẠN</div>
      <nav aria-label="Điều hướng chính">
        <button className={`nav-item ${view === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}>
          <House size={19} /> Tổng quan
        </button>
        <button className={`nav-item ${view === 'cameras' ? 'active' : ''}`} onClick={() => navigate('cameras')}>
          <Camera size={19} /> Camera <span className="nav-count">{cameraCount}</span>
        </button>
        <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}>
          <Settings2 size={19} /> Hệ thống
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note"><ShieldCheck size={18} /><div>
          <strong>Kết nối riêng tư</strong><span>Chỉ truy cập qua mạng nhà hoặc VPN của bạn.</span>
        </div></div>
        <div className="profile">
          <div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div>
          <div className="profile-text"><strong>{user.username}</strong><span>
            {user.role === 'admin' ? 'Quản trị viên' : 'Người xem'}
          </span></div>
          <button aria-label="Đăng xuất" title="Đăng xuất" onClick={onLogout}><LogOut size={18} /></button>
        </div>
      </div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Đóng menu" onClick={onClose} />}
  </>
}

