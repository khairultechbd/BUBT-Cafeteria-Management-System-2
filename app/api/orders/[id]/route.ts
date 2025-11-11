import { type NextRequest, NextResponse } from "next/server"

// Proxy to Express backend
const EXPRESS_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(`${EXPRESS_BACKEND_URL}/api/orders/${id}`, {
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    const response = await fetch(`${EXPRESS_BACKEND_URL}/api/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const response = await fetch(`${EXPRESS_BACKEND_URL}/api/orders/${id}`, {
      method: "DELETE",
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
