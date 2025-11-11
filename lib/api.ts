export function getApiBaseUrl(): string {
  // Default to Express backend if env var not set
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
  return base.replace(/\/$/, "")
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBaseUrl()
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  // Debug: Log the API URL being used
  if (typeof window !== "undefined") {
    console.log(`[API] Calling: ${base}${path.startsWith("/") ? path : `/${path}`}`)
  }

  const headers: HeadersInit = {
    ...(options.headers || {}),
  }

  if (!("Content-Type" in headers) && options.body) {
    (headers as Record<string, string>)["Content-Type"] = "application/json"
  }

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  return fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers,
    cache: "no-store",
  })
}
