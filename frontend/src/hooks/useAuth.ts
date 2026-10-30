import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authApi } from '../services/authApi'
import type { User } from '../types/models'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    authApi.me().then(setUser).catch(() => {}).finally(() => setBooting(false))
  }, [])

  async function login(username: string, password: string) {
    setUser(await authApi.login(username, password))
  }

  async function logout() {
    if (!user) return
    try {
      await authApi.logout(user.csrf_token)
      setUser(null)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return { user, booting, login, logout }
}

