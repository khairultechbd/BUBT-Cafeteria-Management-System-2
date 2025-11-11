"use client"

import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { LogOut, User, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

interface TopbarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Get page title based on current route
  const getPageTitle = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length === 0) return "Dashboard"

    const lastSegment = pathSegments[pathSegments.length - 1]
    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="bg-card border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      {/* Left: App Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">B</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">BUBT CMS</h1>
          <p className="text-xs text-muted-foreground">Cafeteria Management</p>
        </div>
      </div>

      {/* Center: Page Title */}
      <div className="flex-1 text-center">
        <h2 className="text-xl font-semibold text-foreground">{getPageTitle()}</h2>
      </div>

      {/* Right: Theme Toggle, User Profile & Logout */}
      <div className="flex items-center gap-4">
        {mounted && (
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </Button>
        )}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  user.role === "admin" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100" : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                }`}
              >
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  )
}
