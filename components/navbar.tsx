"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <nav className="bg-card border-b border-border px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <Button onClick={handleLogout} variant="outline">
        Logout
      </Button>
    </nav>
  )
}
