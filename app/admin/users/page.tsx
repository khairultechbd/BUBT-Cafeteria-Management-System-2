"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/search-input"
import { StatusBadge } from "@/components/status-badge"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  department?: string
  dbKey?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    department: "",
    studentId: "",
  })
  const [passwordFormData, setPasswordFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
  })
  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      const response = await apiFetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error("Failed to fetch users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const response = await apiFetch(`/api/users/${userId}/approve`, {
        method: "PUT",
      })

      if (response.ok) {
        await fetchUsers()
        toast({
          variant: "success",
          title: "User Approved",
          description: "The user has been approved successfully.",
        })
      } else {
        const data = await response.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to approve user",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve user",
      })
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const response = await apiFetch(`/api/users/${userId}/reject`, {
        method: "PUT",
      })

      if (response.ok) {
        await fetchUsers()
        toast({
          variant: "default",
          title: "User Rejected",
          description: "The user has been rejected.",
        })
      } else {
        const data = await response.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to reject user",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject user",
      })
    }
  }

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department || "General",
        }),
      })

      if (response.ok) {
        setShowCreateForm(false)
        setFormData({ name: "", email: "", password: "", role: "student", department: "" })
        await fetchUsers()
        toast({
          variant: "success",
          title: "Success",
          description: "User created successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to create user",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create user",
      })
    }
  }

  const handleEdit = (u: AdminUser) => {
    setEditingUser(u)
    setEditFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department || "",
      studentId: (u as any).studentId || "",
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await apiFetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        setEditingUser(null)
        await fetchUsers()
        toast({
          variant: "success",
          title: "Success",
          description: "User updated successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to update user",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user",
      })
    }
  }

  const handleChangePassword = async (userId: string) => {
    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Passwords do not match",
      })
      return
    }

    if (!passwordFormData.password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password is required",
      })
      return
    }

    try {
      const response = await apiFetch(`/api/users/${userId}/password`, {
        method: "PUT",
        body: JSON.stringify({ password: passwordFormData.password }),
      })

      if (response.ok) {
        setShowPasswordForm(null)
        setPasswordFormData({ password: "", confirmPassword: "" })
        await fetchUsers()
        toast({
          variant: "success",
          title: "Success",
          description: "Password updated successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to change password",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password",
      })
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await apiFetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers()
        toast({
          variant: "success",
          title: "Success",
          description: "User deleted successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to delete user",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete user",
      })
    }
  }

  const filteredUsers = users.filter((u) =>
    debouncedSearch === ""
      ? true
      : u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

  if (!user || user.role !== "admin") return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                <p className="text-muted-foreground">Approve or reject pending users, create new users</p>
              </div>
              <Button onClick={() => setShowCreateForm(!showCreateForm)} className="bg-green-600 hover:bg-green-700">
                + Create New User
              </Button>
            </div>

            {showCreateForm && (
              <Card className="bg-muted border-2">
                <CardHeader>
                  <CardTitle>Create New User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Password *</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Department</label>
                      <Input
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Department (optional)"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleCreateUser} className="bg-green-600 hover:bg-green-700">
                      Create User
                    </Button>
                    <Button onClick={() => setShowCreateForm(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <SearchInput placeholder="Search users by name or email..." value={searchQuery} onChange={setSearchQuery} />

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No users found</p>
                <p className="text-sm">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u) => (
                  <Card key={u.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{u.name}</h3>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                            <div className="mt-2">
                              <StatusBadge status={u.status} />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          {u.status === "pending" && (
                            <>
                              <Button
                                onClick={() => handleApprove(u.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button onClick={() => handleReject(u.id)} variant="destructive" className="flex-1">
                                Reject
                              </Button>
                            </>
                          )}
                          <Button onClick={() => handleEdit(u)} variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            onClick={() => setShowPasswordForm(showPasswordForm === u.id ? null : u.id)}
                            variant="outline"
                            size="sm"
                          >
                            Change Password
                          </Button>
                          <Button onClick={() => handleDelete(u.id)} variant="destructive" size="sm">
                            Delete
                          </Button>
                        </div>
                        {showPasswordForm === u.id && (
                          <div className="mt-2 p-3 bg-muted rounded space-y-2">
                            <Input
                              type="password"
                              placeholder="New Password"
                              value={passwordFormData.password}
                              onChange={(e) =>
                                setPasswordFormData({ ...passwordFormData, password: e.target.value })
                              }
                            />
                            <Input
                              type="password"
                              placeholder="Confirm Password"
                              value={passwordFormData.confirmPassword}
                              onChange={(e) =>
                                setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
                              }
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleChangePassword(u.id)}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Update Password
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowPasswordForm(null)
                                  setPasswordFormData({ password: "", confirmPassword: "" })
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name *</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Role *</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status *</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Department</label>
                <Input
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  placeholder="Department"
                />
              </div>
              {editFormData.role === "student" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Student ID</label>
                  <Input
                    value={editFormData.studentId}
                    onChange={(e) => setEditFormData({ ...editFormData, studentId: e.target.value })}
                    placeholder="Student ID"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleUpdateUser} className="flex-1 bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setEditingUser(null)
                    setEditFormData({
                      name: "",
                      email: "",
                      role: "",
                      status: "",
                      department: "",
                      studentId: "",
                    })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
