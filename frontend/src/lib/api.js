const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? '/api' : '/_/backend/api')

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}
