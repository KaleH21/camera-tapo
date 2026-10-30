import { Camera, ChevronDown, Plus } from 'lucide-react'
import { LivePlayer } from './LivePlayer'
import type { CameraItem } from '../types/models'

type Props = {
  cameras: CameraItem[]
  selected?: CameraItem
  canManage: boolean
  onSelect: (id: string) => void
  onAdd: () => void
}

export function LivePanel({ cameras, selected, canManage, onSelect, onAdd }: Props) {
  return <div className="panel live-panel">
    <div className="panel-heading"><div>
      <div className="section-kicker"><span className="tiny-dot" /> THEO DÕI THỜI GIAN THỰC</div>
      <h2>Trực tiếp</h2>
    </div>{selected && <div className="select-wrap">
      <select aria-label="Chọn camera" value={selected.id} onChange={event => onSelect(event.target.value)}>
        {cameras.map(camera => <option key={camera.id} value={camera.id}>{camera.name}</option>)}
      </select><ChevronDown size={16} />
    </div>}</div>
    {selected ? <>
      <LivePlayer camera={selected} />
      <div className="live-details">
        <div><span className="detail-label">TRẠNG THÁI</span>
          <strong className={selected.status === 'online' ? 'text-green' : 'text-muted'}>
            {selected.status === 'online' ? 'Đang trực tuyến' : selected.status === 'disabled' ? 'Đã tắt' : 'Mất kết nối'}
          </strong></div>
        <div><span className="detail-label">LUỒNG PHÁT</span>
          <strong>{selected.stream_path === '/stream1' ? 'Chất lượng cao' : selected.stream_path === '/stream2' ? 'Tiết kiệm băng thông' : 'Mặc định'}</strong></div>
        <div><span className="detail-label">FRAME GẦN NHẤT</span>
          <strong>{selected.last_frame_at ? new Date(selected.last_frame_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Bangkok' }) : 'Chưa có'}</strong></div>
      </div>
    </> : <div className="empty-live">
      <div className="empty-icon"><Camera size={34} /></div>
      <h3>Chưa có camera nào</h3>
      <p>Thêm camera Tapo C220 để bắt đầu theo dõi ngôi nhà của bạn.</p>
      {canManage && <button className="primary-button" onClick={onAdd}><Plus size={17} /> Thêm camera đầu tiên</button>}
    </div>}
  </div>
}

