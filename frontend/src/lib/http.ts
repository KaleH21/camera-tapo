export async function api<T>(path: string, init?: RequestInit, csrf?: string): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error?.message || 'Không thể thực hiện yêu cầu')
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

