import { useEffect, useRef, useState } from 'react'
import { VideoOff } from 'lucide-react'
import type { CameraItem } from '../types/models'

export function LivePlayer({ camera }: { camera: CameraItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<'loading' | 'playing' | 'error'>('loading')

  useEffect(() => {
    const video = videoRef.current
    if (!video || camera.status !== 'online') return
    setState('loading')
    const playing = () => setState('playing')
    const failed = () => setState('error')
    video.addEventListener('playing', playing)
    video.addEventListener('error', failed)
    let disposed = false
    let hls: InstanceType<typeof import('hls.js').default> | undefined
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = camera.live_url
      video.play().catch(() => {})
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (disposed) return
        if (!Hls.isSupported()) { setState('error'); return }
        hls = new Hls({ liveSyncDurationCount: 3, maxBufferLength: 20 })
        hls.loadSource(camera.live_url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setState('error')
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad()
            else hls?.recoverMediaError()
          }
        })
        video.play().catch(() => {})
      }).catch(() => { if (!disposed) setState('error') })
    }
    return () => {
      disposed = true
      hls?.destroy()
      video.pause()
      video.removeAttribute('src')
      video.removeEventListener('playing', playing)
      video.removeEventListener('error', failed)
    }
  }, [camera.id, camera.live_url, camera.status])

  return <div className="video-frame">
    <video ref={videoRef} autoPlay muted playsInline controls={state === 'playing'} aria-label={`Video trực tiếp ${camera.name}`} />
    {camera.status !== 'online' && <div className="video-placeholder">
      <div className="placeholder-icon"><VideoOff size={28} /></div>
      <strong>Camera chưa có tín hiệu</strong>
      <span>Kiểm tra nguồn điện, mạng LAN và tài khoản camera.</span>
    </div>}
    {camera.status === 'online' && state !== 'playing' && <div className="video-placeholder">
      <div className="spinner" />
      <strong>{state === 'loading' ? 'Đang tải luồng trực tiếp' : 'Đang kết nối lại'}</strong>
      <span>Vui lòng chờ trong giây lát.</span>
    </div>}
    <div className="video-top">
      <span className={`live-chip ${camera.status === 'online' ? '' : 'is-off'}`}>
        <span className="pulse-dot" />{camera.status === 'online' ? 'TRỰC TIẾP' : 'NGOẠI TUYẾN'}
      </span>
      <span className="video-name">{camera.name}</span>
    </div>
  </div>
}

