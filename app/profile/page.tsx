"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setFormData({ name: parsedUser.name, email: parsedUser.email, password: "" })
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiFetch("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        const updatedUser = { ...user, ...data.user }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        toast({
          variant: "success",
          title: "Success",
          description: "Profile updated successfully!",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to update profile",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating your profile",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
              <p className="text-muted-foreground">Manage your account information</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">New Password (optional)</label>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{user.status}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
