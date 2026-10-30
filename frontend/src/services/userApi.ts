import { api } from '../lib/http'
import type { Viewer } from '../types/models'

export const userApi = {
  list: () => api<{ items: Viewer[] }>('/api/v1/users'),
  createViewer: (username: string, password: string, csrf: string) =>
    api<Viewer>('/api/v1/users', { method: 'POST', body: JSON.stringify({ username, password }) }, csrf),
}
