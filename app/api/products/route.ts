import { type NextRequest, NextResponse } from "next/server"

// Proxy to Express backend
const EXPRESS_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const { searchParams } = new URL(request.url)
    const timeCategory = searchParams.get("timeCategory")
    
    const url = timeCategory 
      ? `${EXPRESS_BACKEND_URL}/api/products/time/${timeCategory}`
      : `${EXPRESS_BACKEND_URL}/api/products`
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const body = await request.json()
    
    const response = await fetch(`${EXPRESS_BACKEND_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
