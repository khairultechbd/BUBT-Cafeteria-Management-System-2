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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
