import { type NextRequest, NextResponse } from "next/server"

// Mock database - shared with route.ts
const orders: any[] = []

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()
    const orderId = params.id

    // Find and update order
    const orderIndex = orders.findIndex((o) => o.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    orders[orderIndex].status = status
    return NextResponse.json(orders[orderIndex])
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
