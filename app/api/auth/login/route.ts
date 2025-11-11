import { type NextRequest, NextResponse } from "next/server"

// Proxy to Express backend
const EXPRESS_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${EXPRESS_BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
