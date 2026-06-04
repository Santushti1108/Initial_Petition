const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? "/_/backend/api" : "/api")

export function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

async function parseJsonResponse(res) {
  const text = await res.text()
  if (!text) {
    if (res.status === 405) {
      throw new Error(
        "Analysis API not reachable. Start the Flask backend (port 5000) or check deployment config."
      )
    }
    throw new Error(`Server returned ${res.status} with an empty response.`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      "Invalid response from server. Ensure the backend is running and API routes are configured."
    )
  }
}

export async function analyzePetition(file) {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(apiUrl("/analyze"), {
    method: "POST",
    body: formData,
  })

  const data = await parseJsonResponse(res)
  if (!res.ok) {
    throw new Error(data.error || "Analysis failed")
  }
  return data
}
