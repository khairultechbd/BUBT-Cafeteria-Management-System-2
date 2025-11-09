"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const DEPARTMENTS = [
  { id: "1", name: "Computer Science", code: "CSE" },
  { id: "2", name: "Business Administration", code: "BBA" },
  { id: "3", name: "Engineering", code: "ENG" },
  { id: "4", name: "Law", code: "LAW" },
  { id: "5", name: "Arts & Humanities", code: "AH" },
]

export default function DepartmentPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Departments</h1>
              <p className="text-muted-foreground">Browse all available departments at BUBT</p>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading departments...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPARTMENTS.map((dept) => (
                  <Card key={dept.id}>
                    <CardHeader>
                      <CardTitle>{dept.name}</CardTitle>
                      <CardDescription>Department Code: {dept.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        This department serves students and faculty with quality cafeteria services.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
