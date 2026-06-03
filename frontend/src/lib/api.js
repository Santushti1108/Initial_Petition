const API_BASE = import.meta.env.VITE_API_BASE || "/api"

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

export async function analyzePetition(file) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(apiUrl("/analyze"), {
    method: "POST",
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Analysis failed")
  }
  return data
}
