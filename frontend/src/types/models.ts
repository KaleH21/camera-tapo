export type User = {
  username: string
  role: 'admin' | 'viewer'
  csrf_token: string
}

export type CameraItem = {
  id: string
  name: string
  host?: string
  port?: number
  stream_path?: string
  username?: string
  enabled: boolean
  status: 'online' | 'offline' | 'disabled'
  last_frame_at: string | null
  live_url: string
}

export type CameraForm = {
  name: string
  host: string
  port: number
  stream_path: string
  username: string
  password: string
}

export const blankCameraForm: CameraForm = {
  name: '', host: '', port: 554, stream_path: '/stream1', username: '', password: '',
}

export type Viewer = { id: string; username: string; role: string }
export type View = 'overview' | 'cameras' | 'settings'

