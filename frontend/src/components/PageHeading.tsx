import { Plus } from 'lucide-react'
import type { User, View } from '../types/models'

const copy: Record<View, { title: (username: string) => string; subtitle: string }> = {
  overview: { title: username => `Xin chào, ${username}`, subtitle: 'Một góc nhìn rõ ràng về ngôi nhà của bạn.' },
  cameras: { title: () => 'Camera của bạn', subtitle: 'Quản lý camera và theo dõi kết nối trực tiếp.' },
  settings: { title: () => 'Hệ thống', subtitle: 'Thông tin vận hành và quyền truy cập của hệ thống.' },
}

export function PageHeading({ view, user, onAdd }: { view: View; user: User; onAdd: () => void }) {
  return <div className="page-heading">
    <div><span className="overline">TAPO HOME MONITOR</span>
      <h1>{copy[view].title(user.username)}</h1><p>{copy[view].subtitle}</p></div>
    {user.role === 'admin' && view !== 'settings' && <button className="primary-button add-top" onClick={onAdd}>
      <Plus size={18} /> Thêm camera
    </button>}
  </div>
}
