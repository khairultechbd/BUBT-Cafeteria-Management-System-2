"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsLoggedIn(true)
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">BUBT Cafeteria Management System</h1>
        <p className="text-lg text-muted-foreground">Manage your cafeteria orders efficiently</p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
