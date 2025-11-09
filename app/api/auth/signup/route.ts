import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock database - in production, use real database
const users: any[] = []

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if user exists
    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // In production, hash this!
      role: "user",
      status: "pending",
    }

    users.push(newUser)

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    return NextResponse.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
