import { useState } from 'react'
import { Camera, Clock3, MoreHorizontal, Radio, Settings2, Trash2 } from 'lucide-react'
import type { CameraItem } from '../types/models'

type Props = {
  cameras: CameraItem[]
  selectedId: string | null
  canManage: boolean
  busy: boolean
  onSelect: (id: string) => void
  onEdit: (camera: CameraItem) => void
  onTest: (camera: CameraItem) => void
  onDelete: (camera: CameraItem) => void
}

export function CameraList({ cameras, selectedId, canManage, busy, onSelect, onEdit, onTest, onDelete }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  return <div className="panel camera-panel">
    <div className="panel-heading"><div>
      <div className="section-kicker neutral">THIẾT BỊ CỦA BẠN</div>
      <h2>Danh sách camera</h2>
    </div><span className="count-badge">{cameras.length}</span></div>
    <div className="camera-list">
      {cameras.map(camera => <div className={`camera-row ${selectedId === camera.id ? 'selected' : ''}`} key={camera.id}>
        <button className="camera-pick" onClick={() => onSelect(camera.id)}>
          <div className="camera-thumb"><Camera size={22} /></div>
          <div className="camera-copy"><strong>{camera.name}</strong>
            <span>{camera.host ? `${camera.host} · ${camera.stream_path}` : 'Camera gia đình'}</span></div>
        </button>
        <div className="camera-row-end"><span className={`status-dot ${camera.status}`} title={camera.status} />
          {canManage && <div className="row-menu-wrap">
            <button className="more-button" aria-label={`Tùy chọn ${camera.name}`}
              onClick={() => setOpenMenu(openMenu === camera.id ? null : camera.id)}><MoreHorizontal size={19} /></button>
            {openMenu === camera.id && <div className="row-menu">
              <button onClick={() => { setOpenMenu(null); onEdit(camera) }}><Settings2 size={15} /> Chỉnh sửa</button>
              <button disabled={busy} onClick={() => { setOpenMenu(null); onTest(camera) }}><Radio size={15} /> Kiểm tra</button>
              <button className="danger" onClick={() => { setOpenMenu(null); onDelete(camera) }}><Trash2 size={15} /> Xóa camera</button>
            </div>}
          </div>}
        </div>
      </div>)}
      {cameras.length === 0 && <div className="camera-empty">Camera sẽ xuất hiện ở đây sau khi bạn thêm thiết bị.</div>}
    </div>
    <div className="camera-panel-foot"><Clock3 size={15} /> Tự động làm mới mỗi 7 giây</div>
  </div>
}

