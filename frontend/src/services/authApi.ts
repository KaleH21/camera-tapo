import { api } from '../lib/http'
import type { User } from '../types/models'

export const authApi = {
  me: () => api<User>('/api/v1/auth/me'),
  login: (username: string, password: string) =>
    api<User>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: (csrf: string) => api('/api/v1/auth/logout', { method: 'POST' }, csrf),
}

