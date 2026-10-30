import { useState } from 'react'
import { CameraDialog } from './components/CameraDialog'
import { PageHeading } from './components/PageHeading'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useAuth } from './hooks/useAuth'
import { useCameras } from './hooks/useCameras'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import type { CameraItem, View } from './types/models'

function App() {
  const { user, booting, login, logout } = useAuth()
  const cameras = useCameras(user)
  const [view, setView] = useState<View>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dialog, setDialog] = useState<{ editing: CameraItem | null } | null>(null)

  if (booting) return <div className="boot"><div className="spinner" /><span>Đang khởi động Tapo Home Monitor</span></div>
  if (!user) return <LoginPage onLogin={login} />

  function openEdit(camera: CameraItem) {
    cameras.setSelectedId(camera.id)
    setDialog({ editing: camera })
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main">Đến nội dung chính</a>
    <Sidebar user={user} view={view} cameraCount={cameras.cameras.length} mobileOpen={mobileMenuOpen}
      onViewChange={setView} onClose={() => setMobileMenuOpen(false)} onLogout={logout} />
    <div className="main-area">
      <Topbar user={user} view={view} onOpenMenu={() => setMobileMenuOpen(true)} onRefresh={cameras.refresh} />
      <main id="main" className="content">
        <PageHeading view={view} user={user} onAdd={() => setDialog({ editing: null })} />
        {view === 'settings'
          ? <SettingsPage user={user} cameraCount={cameras.cameras.length} onlineCount={cameras.onlineCount} />
          : <DashboardPage cameras={cameras.cameras} selectedId={cameras.selectedId} selected={cameras.selected}
              canManage={user.role === 'admin'} busy={cameras.busy} onSelect={cameras.setSelectedId}
              onAdd={() => setDialog({ editing: null })} onEdit={openEdit} onTest={cameras.test}
              onDelete={cameras.remove} onSettings={() => setView('settings')} />}
      </main>
    </div>
    {dialog && <CameraDialog key={dialog.editing?.id || 'new'} editing={dialog.editing} busy={cameras.busy}
      onSave={form => cameras.save(form, dialog.editing)} onClose={() => setDialog(null)} />}
  </div>
}

export default App
