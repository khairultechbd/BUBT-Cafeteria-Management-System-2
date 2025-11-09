"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: {
    role: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const userLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/products", label: "Food Items" },
    { href: "/orders", label: "Orders" },
    { href: "/department", label: "Department" },
    { href: "/profile", label: "Profile" },
  ]

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "User Management" },
    { href: "/admin/food-items", label: "Food Items Management" },
    { href: "/admin/orders", label: "Orders Management" },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/profile", label: "Profile" },
  ]

  const links = user.role === "admin" ? adminLinks : userLinks

  return (
    <aside className="w-64 bg-card border-r border-border p-6 space-y-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">BUBT CMS</h1>
        <p className="text-sm text-muted-foreground">Cafeteria Management</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block px-4 py-2 rounded-md transition-colors",
              pathname === link.href ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
