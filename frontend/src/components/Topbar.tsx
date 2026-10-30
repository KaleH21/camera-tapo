import { Menu, RefreshCw } from 'lucide-react'
import type { User, View } from '../types/models'

const labels: Record<View, string> = { overview: 'Tổng quan', cameras: 'Camera', settings: 'Hệ thống' }

type Props = { user: User; view: View; onOpenMenu: () => void; onRefresh: () => void }

export function Topbar({ user, view, onOpenMenu, onRefresh }: Props) {
  return <header className="topbar">
    <button className="mobile-menu" aria-label="Mở menu" onClick={onOpenMenu}><Menu size={22} /></button>
    <div className="breadcrumb"><span>Không gian của tôi</span><span className="crumb-separator">/</span><strong>{labels[view]}</strong></div>
    <div className="top-actions">
      <span className="connection-pill"><span className="tiny-dot" /> Hệ thống đang hoạt động</span>
      <button className="icon-button" aria-label="Làm mới" title="Làm mới" onClick={onRefresh}><RefreshCw size={18} /></button>
      <div className="top-avatar">{user.username.slice(0, 1).toUpperCase()}</div>
    </div>
  </header>
}

