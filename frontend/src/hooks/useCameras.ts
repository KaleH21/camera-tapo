import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cameraApi } from '../services/cameraApi'
import type { CameraForm, CameraItem, User } from '../types/models'

export function useCameras(user: User | null) {
  const [cameras, setCameras] = useState<CameraItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const refreshErrorShown = useRef(false)
  const activeUser = useRef(user)

  const refresh = useCallback(async () => {
    const requester = activeUser.current
    if (!requester) return
    try {
      const data = await cameraApi.list()
      if (activeUser.current !== requester) return
      setCameras(data.items)
      setSelectedId(previous => data.items.some(item => item.id === previous) ? previous : data.items[0]?.id || null)
      refreshErrorShown.current = false
    } catch (error) {
      if (activeUser.current !== requester) return
      if (!refreshErrorShown.current) toast.error((error as Error).message)
      refreshErrorShown.current = true
    }
  }, [])

  useEffect(() => {
    activeUser.current = user
    if (!user) {
      setCameras([])
      setSelectedId(null)
      refreshErrorShown.current = false
      return
    }
    refresh()
    const timer = window.setInterval(refresh, 7000)
    return () => window.clearInterval(timer)
  }, [user, refresh])

  const selected = cameras.find(camera => camera.id === selectedId)
  const onlineCount = cameras.filter(camera => camera.status === 'online').length

  async function save(form: CameraForm, editing: CameraItem | null): Promise<boolean> {
    if (!user) return false
    setBusy(true)
    try {
      const saved = editing
        ? await cameraApi.update(editing.id, form, user.csrf_token)
        : await cameraApi.create(form, user.csrf_token)
      setSelectedId(saved.id)
      toast.success('Đã lưu camera')
      await refresh()
      return true
    } catch (error) {
      toast.error((error as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function test(camera: CameraItem) {
    if (!user) return
    setBusy(true)
    try {
      const result = await cameraApi.test(camera.id, user.csrf_token)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setBusy(false)
      refresh()
    }
  }

  async function remove(camera: CameraItem) {
    if (!user || !window.confirm(`Xóa camera “${camera.name}”?`)) return
    try {
      await cameraApi.remove(camera.id, user.csrf_token)
      toast.success('Đã xóa camera')
      await refresh()
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return { cameras, selectedId, setSelectedId, selected, onlineCount, busy, refresh, save, test, remove }
}
