import { type NextRequest, NextResponse } from "next/server"

// Mock database
const users: any[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@bubt.edu.bd",
    password: "admin123",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    name: "Test User",
    email: "user@bubt.edu.bd",
    password: "user123",
    role: "user",
    status: "active",
  },
  {
    id: "3",
    name: "Pending User",
    email: "pending@bubt.edu.bd",
    password: "pending123",
    role: "user",
    status: "pending",
  },
]

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id
    const user = users.find((u) => u.id === userId)

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    user.status = "rejected"

    return NextResponse.json({ message: "User rejected", user })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
