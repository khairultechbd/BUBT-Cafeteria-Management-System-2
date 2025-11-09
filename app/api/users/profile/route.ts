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
]

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password } = await request.json()

    // Mock user update - in production, extract user ID from JWT
    const user = users[0]
    if (name) user.name = name
    if (email) user.email = email
    if (password) user.password = password

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
