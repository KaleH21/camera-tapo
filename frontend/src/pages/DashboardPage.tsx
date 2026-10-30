import { ArrowRight, CircleHelp } from 'lucide-react'
import { CameraList } from '../components/CameraList'
import { LivePanel } from '../components/LivePanel'
import { StatsGrid } from '../components/StatsGrid'
import type { CameraItem } from '../types/models'

type Props = {
  cameras: CameraItem[]
  selectedId: string | null
  selected?: CameraItem
  canManage: boolean
  busy: boolean
  onSelect: (id: string) => void
  onAdd: () => void
  onEdit: (camera: CameraItem) => void
  onTest: (camera: CameraItem) => void
  onDelete: (camera: CameraItem) => void
  onSettings: () => void
}

export function DashboardPage(props: Props) {
  return <>
    <StatsGrid cameras={props.cameras} />
    <section className="workspace-grid">
      <LivePanel cameras={props.cameras} selected={props.selected} canManage={props.canManage}
        onSelect={props.onSelect} onAdd={props.onAdd} />
      <CameraList cameras={props.cameras} selectedId={props.selectedId} canManage={props.canManage}
        busy={props.busy} onSelect={props.onSelect} onEdit={props.onEdit}
        onTest={props.onTest} onDelete={props.onDelete} />
    </section>
    <div className="info-strip">
      <div className="info-icon"><CircleHelp size={20} /></div>
      <div><strong>Mẹo kết nối</strong><span>Để xem từ xa, hãy kết nối VPN gia đình trước khi mở trang này.</span></div>
      <button onClick={props.onSettings}>Tìm hiểu thêm <ArrowRight size={15} /></button>
    </div>
  </>
}
