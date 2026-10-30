import { Camera, Signal, WifiOff } from 'lucide-react'
import type { CameraItem } from '../types/models'

export function StatsGrid({ cameras }: { cameras: CameraItem[] }) {
  const online = cameras.filter(camera => camera.status === 'online').length
  const offline = cameras.filter(camera => camera.status === 'offline').length
  return <div className="stats-grid">
    <div className="stat-card">
      <div className="stat-icon blue"><Camera size={20} /></div>
      <div className="stat-label">Tổng camera</div>
      <div className="stat-value">{String(cameras.length).padStart(2, '0')}</div>
      <div className="stat-sub">Đã thêm vào hệ thống</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon green"><Signal size={20} /></div>
      <div className="stat-label">Đang trực tuyến</div>
      <div className="stat-value">{String(online).padStart(2, '0')}</div>
      <div className="stat-sub"><span className="tiny-dot" /> Cập nhật tự động</div>
    </div>
    <div className="stat-card">
      <div className="stat-icon amber"><WifiOff size={20} /></div>
      <div className="stat-label">Mất kết nối</div>
      <div className="stat-value">{String(offline).padStart(2, '0')}</div>
      <div className="stat-sub">Cần kiểm tra nếu kéo dài</div>
    </div>
  </div>
}

