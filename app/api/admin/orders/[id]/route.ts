import { type NextRequest, NextResponse } from "next/server"

// Proxy to Express backend
const EXPRESS_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    
    // Determine which endpoint to call based on the action
    const endpoint = body.action === "accept" 
      ? `${EXPRESS_BACKEND_URL}/api/orders/${id}/accept`
      : body.action === "reject"
      ? `${EXPRESS_BACKEND_URL}/api/orders/${id}/reject`
      : `${EXPRESS_BACKEND_URL}/api/orders/${id}/status`
    
    const response = await fetch(endpoint, {
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
