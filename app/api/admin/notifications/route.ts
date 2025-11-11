import { type NextRequest, NextResponse } from "next/server"

// Proxy to Express backend
const EXPRESS_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get("admin") === "true" 
      ? `${EXPRESS_BACKEND_URL}/api/notifications/admin/all`
      : `${EXPRESS_BACKEND_URL}/api/notifications`
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
