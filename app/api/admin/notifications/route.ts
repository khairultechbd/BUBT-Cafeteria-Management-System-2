import { type NextRequest, NextResponse } from "next/server"

// Mock database
const notifications: any[] = [
  {
    id: "1",
    message: "New order: Biryani",
    orderId: "1",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
