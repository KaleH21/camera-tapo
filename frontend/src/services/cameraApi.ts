import { api } from '../lib/http'
import type { CameraForm, CameraItem } from '../types/models'

export const cameraApi = {
  list: () => api<{ items: CameraItem[] }>('/api/v1/cameras'),
  create: (form: CameraForm, csrf: string) =>
    api<CameraItem>('/api/v1/cameras', { method: 'POST', body: JSON.stringify(form) }, csrf),
  update: (cameraId: string, form: CameraForm, csrf: string) => {
    const payload = form.password ? form : Object.fromEntries(Object.entries(form).filter(([key]) => key !== 'password'))
    return api<CameraItem>(`/api/v1/cameras/${cameraId}`, { method: 'PATCH', body: JSON.stringify(payload) }, csrf)
  },
  remove: (cameraId: string, csrf: string) =>
    api<void>(`/api/v1/cameras/${cameraId}`, { method: 'DELETE' }, csrf),
  test: (cameraId: string, csrf: string) =>
    api<{ ok: boolean; message: string }>(`/api/v1/cameras/${cameraId}/test`, { method: 'POST' }, csrf),
}

