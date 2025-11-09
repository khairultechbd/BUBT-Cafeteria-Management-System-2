"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { SearchInput } from "@/components/search-input"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { apiFetch } from "@/lib/api"

interface Order {
  _id?: string
  id?: string
  userId?: {
    _id?: string
    id?: string
    name?: string
    email?: string
  } | string | null
  productId?: {
    _id?: string
    id?: string
    name?: string
    price?: number
  } | string | null
  quantity?: number
  totalPrice?: number
  status?: string
  createdAt?: string
}

interface Notification {
  _id?: string
  id?: string
  orderId?: string
  order?: Order | null
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  dbKey?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterRead, setFilterRead] = useState("all")
  const debouncedSearch = useDebounce(searchTerm, 300)

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
    fetchNotifications()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    let filtered = notifications

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((notif) => notif.type === filterType)
    }

    // Filter by read status
    if (filterRead !== "all") {
      const isRead = filterRead === "read"
      filtered = filtered.filter((notif) => notif.read === isRead)
    }

    // Filter by search term
    if (debouncedSearch) {
      filtered = filtered.filter((notif) => {
        const userName = notif.order?.userId && typeof notif.order.userId === 'object' 
          ? notif.order.userId.name || '' 
          : ''
        const userEmail = notif.order?.userId && typeof notif.order.userId === 'object' 
          ? notif.order.userId.email || '' 
          : ''
        const productName = notif.order?.productId && typeof notif.order.productId === 'object' 
          ? notif.order.productId.name || '' 
          : ''
        const message = notif.message || ''
        const title = notif.title || ''
        
        return (
          userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          userEmail.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          message.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          title.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      })
    }

    setFilteredNotifications(filtered)
  }, [debouncedSearch, filterType, filterRead, notifications])

  const fetchNotifications = async () => {
    try {
      const response = await apiFetch("/api/notifications/admin/all")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        console.error("Failed to fetch notifications")
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string, dbKey?: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchNotifications()
        const statusMessages: Record<string, string> = {
          accepted: "Order accepted successfully!",
          rejected: "Order rejected",
          served: "Order marked as served!",
          completed: "Order completed successfully!",
        }
        toast({
          variant: "success",
          title: "Status Updated",
          description: statusMessages[newStatus] || `Order status updated to ${newStatus}`,
        })
      } else {
        const data = await response.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to update order status",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      })
    }
  }

  const handleMarkAsRead = async (notificationId: string, dbKey?: string) => {
    try {
      // Find the notification's dbKey
      const notification = notifications.find(n => (n.id || n._id) === notificationId)
      const notificationDbKey = notification?.dbKey || "db1"
      
      const response = await apiFetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      })

      if (response.ok) {
        await fetchNotifications()
        toast({
          variant: "success",
          title: "Notification marked as read",
        })
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await apiFetch("/api/notifications/read-all", {
        method: "PUT",
      })

      if (response.ok) {
        await fetchNotifications()
        toast({
          variant: "success",
          title: "All notifications marked as read",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all as read",
      })
    }
  }

  const getOrderUserName = (order?: Order | null) => {
    if (!order?.userId) return "Unknown User"
    if (typeof order.userId === 'object' && order.userId !== null) {
      return order.userId.name || 'Unknown User'
    }
    return 'Unknown User'
  }

  const getOrderUserEmail = (order?: Order | null) => {
    if (!order?.userId) return ""
    if (typeof order.userId === 'object' && order.userId !== null) {
      return order.userId.email || ''
    }
    return ''
  }

  const getProductName = (order?: Order | null) => {
    if (!order?.productId) return "Product Deleted"
    if (typeof order.productId === 'object' && order.productId !== null) {
      return order.productId.name || 'Product Deleted'
    }
    return 'Product Deleted'
  }

  const getProductPrice = (order?: Order | null) => {
    if (!order?.productId) return 0
    if (typeof order.productId === 'object' && order.productId !== null) {
      return order.productId.price || 0
    }
    return 0
  }

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      order_placed: "bg-blue-100 text-blue-800",
      order_accepted: "bg-green-100 text-green-800",
      order_rejected: "bg-red-100 text-red-800",
      order_served: "bg-purple-100 text-purple-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order_placed: "New Order",
      order_accepted: "Order Accepted",
      order_rejected: "Order Rejected",
      order_served: "Order Served",
    }
    return labels[type] || type
  }

  if (!user || user.role !== "admin") return null

  const unreadCount = notifications.filter(n => !n.read).length
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    pendingOrders: notifications.filter(n => n.order?.status === "pending").length,
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Order Notifications</h1>
                <p className="text-muted-foreground">Manage and respond to all order notifications</p>
              </div>
              {unreadCount > 0 && (
                <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                  Mark All as Read ({unreadCount})
                </Button>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Notifications</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Unread</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Read</p>
                    <p className="text-2xl font-bold text-green-600">{stats.read}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search by customer name, email, product, or message..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="order_placed">New Orders</option>
                    <option value="order_accepted">Accepted</option>
                    <option value="order_rejected">Rejected</option>
                    <option value="order_served">Served</option>
                  </select>
                  <select
                    value={filterRead}
                    onChange={(e) => setFilterRead(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No notifications found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notif) => (
                  <Card
                    key={notif.id || notif._id}
                    className={`hover:shadow-lg transition-shadow ${
                      !notif.read ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${getTypeBadgeColor(notif.type)}`}>
                              {getTypeLabel(notif.type)}
                            </span>
                            {!notif.read && (
                              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">New</span>
                            )}
                            {notif.order?.status && <StatusBadge status={notif.order.status} />}
                          </div>
                          <CardTitle className="text-lg">{notif.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notif.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!notif.read && (
                          <Button
                            onClick={() => handleMarkAsRead(notif.id || notif._id || "", notif.dbKey)}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    {notif.order && (
                      <CardContent className="pt-0">
                        <div className="bg-muted p-4 rounded-lg space-y-3">
                          {/* Order Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Customer</p>
                              <p className="font-medium">{getOrderUserName(notif.order)}</p>
                              <p className="text-sm text-muted-foreground">{getOrderUserEmail(notif.order)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Product</p>
                              <p className="font-medium">{getProductName(notif.order)}</p>
                              <p className="text-sm">
                                Quantity: {notif.order.quantity || 1} × ৳{getProductPrice(notif.order)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Total Amount</p>
                              <p className="text-xl font-bold text-primary">৳{notif.order.totalPrice || 0}</p>
                            </div>
                            
                            {/* Action Buttons */}
                            {notif.order.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleUpdateStatus(notif.orderId || "", "accepted", notif.dbKey)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Accept
                                </Button>
                                <Button
                                  onClick={() => handleUpdateStatus(notif.orderId || "", "rejected", notif.dbKey)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {notif.order.status === "accepted" && (
                              <Button
                                onClick={() => handleUpdateStatus(notif.orderId || "", "served", notif.dbKey)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Mark Served
                              </Button>
                            )}
                            {notif.order.status === "served" && (
                              <Button
                                onClick={() => handleUpdateStatus(notif.orderId || "", "completed", notif.dbKey)}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    )}
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
