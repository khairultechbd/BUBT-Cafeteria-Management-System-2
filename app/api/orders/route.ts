import { type NextRequest, NextResponse } from "next/server"

const orders: any[] = []

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // In production, verify JWT token
    // For now, return all orders
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { productId, quantity, userId, userName, userEmail } = await request.json()

    // Mock product lookup
    const products = [
      { id: "1", name: "Biryani", price: 150 },
      { id: "2", name: "Fried Rice", price: 120 },
      { id: "3", name: "Noodles", price: 100 },
      { id: "4", name: "Burger", price: 80 },
      { id: "5", name: "Pizza", price: 200 },
      { id: "6", name: "Samosa", price: 30 },
    ]

    const product = products.find((p) => p.id === productId)
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const totalPrice = product.price * quantity
    const newOrder = {
      id: Date.now().toString(),
      userId: userId || "unknown",
      userName: userName || "Guest",
      userEmail: userEmail || "guest@example.com",
      productName: product.name,
      quantity: quantity || 1,
      price: product.price,
      totalPrice: totalPrice,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    orders.push(newOrder)

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
