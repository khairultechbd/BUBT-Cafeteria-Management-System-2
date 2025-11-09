import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock database - in production, use real database
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 })
    }

    // Find user
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Check if user is approved
    if (user.status !== "active") {
      return NextResponse.json({ message: "Your account is not approved yet" }, { status: 403 })
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    return NextResponse.json({
      token,
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
