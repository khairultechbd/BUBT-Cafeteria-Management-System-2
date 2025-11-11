"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { SearchInput } from "@/components/search-input"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

interface Order {
  _id?: string
  id?: string
  userId: {
    _id?: string
    id?: string
    name?: string
    email?: string
  } | string | null
  productId: {
    _id?: string
    id?: string
    name?: string
    price?: number
  } | string | null
  quantity: number
  totalPrice: number
  status: string
  createdAt?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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
    fetchOrders()
  }, [router])

  useEffect(() => {
    let filtered = orders

    if (debouncedSearch) {
      filtered = filtered.filter((order) => {
        const userName = typeof order.userId === 'object' ? order.userId.name || '' : ''
        const userEmail = typeof order.userId === 'object' ? order.userId.email || '' : ''
        const productName = typeof order.productId === 'object' ? order.productId.name || '' : ''
        const orderId = order.id || order._id || ''
        
        return (
          userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          userEmail.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          orderId.includes(debouncedSearch)
        )
      })
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [debouncedSearch, statusFilter, orders])

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched orders:", data.length, data)
        // Ensure each order has an id field
        const ordersWithId = data.map((order: any) => ({
          ...order,
          id: order.id || order._id,
        }))
        setOrders(ordersWithId)
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        console.error("Failed to fetch orders:", errorData)
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/accept`, {
        method: "PUT",
      })

      if (response.ok) {
        await fetchOrders()
        toast({
          variant: "success",
          title: "Success",
          description: "Order accepted successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to accept order",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept order",
      })
    }
  }

  const handleReject = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/reject`, {
        method: "PUT",
      })

      if (response.ok) {
        await fetchOrders()
        toast({
          variant: "default",
          title: "Order Rejected",
          description: "The order has been rejected successfully.",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to reject order",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject order",
      })
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchOrders()
        const statusMessage = newStatus === "served" ? "Order marked as served!" : newStatus === "completed" ? "Order completed successfully!" : "Order status updated!"
        toast({
          variant: "success",
          title: "Success",
          description: statusMessage,
        })
      } else {
        const data = await response.json()
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

  const calculateStats = (): OrderStats => {
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
      pendingOrders: orders.filter((order) => order.status === "pending").length,
      completedOrders: orders.filter((order) => order.status === "completed").length,
    }
  }

  const stats = calculateStats()

  if (!user || user.role !== "admin") return null

  const getOrderUserName = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId !== null) {
      return order.userId.name || 'Unknown'
    }
    if (typeof order.userId === 'string') {
      return order.userId // Sometimes userId is just a string name
    }
    return 'Unknown'
  }

  const getOrderUserEmail = (order: Order) => {
    if (typeof order.userId === 'object' && order.userId !== null) {
      return order.userId.email || ''
    }
    return ''
  }

  const getProductName = (order: Order) => {
    if (typeof order.productId === 'object' && order.productId !== null) {
      return order.productId.name || 'Unknown Product'
    }
    if (typeof order.productId === 'string') {
      return order.productId // Sometimes productId is just a string name
    }
    return 'Unknown Product'
  }

  const getProductPrice = (order: Order) => {
    if (typeof order.productId === 'object' && order.productId !== null) {
      return order.productId.price || 0
    }
    return 0
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
              <p className="text-muted-foreground">View and manage all customer orders</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Orders" value={stats.totalOrders.toString()} variant="info" />
              <StatCard title="Total Revenue" value={`৳${stats.totalRevenue.toLocaleString()}`} variant="success" />
              <StatCard title="Pending Orders" value={stats.pendingOrders.toString()} variant="warning" />
              <StatCard title="Completed Orders" value={stats.completedOrders.toString()} variant="default" />
            </div>

            {/* Search and Filter */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <SearchInput
                    placeholder="Search by customer name, email, product, or order ID..."
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    onClick={() => setStatusFilter("pending")}
                    size="sm"
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === "accepted" ? "default" : "outline"}
                    onClick={() => setStatusFilter("accepted")}
                    size="sm"
                  >
                    Accepted
                  </Button>
                  <Button
                    variant={statusFilter === "rejected" ? "default" : "outline"}
                    onClick={() => setStatusFilter("rejected")}
                    size="sm"
                  >
                    Rejected
                  </Button>
                  <Button
                    variant={statusFilter === "served" ? "default" : "outline"}
                    onClick={() => setStatusFilter("served")}
                    size="sm"
                  >
                    Served
                  </Button>
                  <Button
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    onClick={() => setStatusFilter("completed")}
                    size="sm"
                  >
                    Completed
                  </Button>
                </div>
              </div>
            </div>

            {/* Orders Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No orders found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id || order._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Order #{order.id || order._id}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Date not available"}
                          </p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Customer Info */}
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm font-medium text-foreground text-gray-900 dark:text-gray-100">{getOrderUserName(order)}</p>
                        <p className="text-sm text-muted-foreground">{getOrderUserEmail(order)}</p>
                      </div>

                      {/* Order Details */}
                      <div className="space-y-2 border-t pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Product:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{getProductName(order) || "Product Deleted"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quantity:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{order.quantity || 1}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unit Price:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {getProductPrice(order) > 0 ? `৳${getProductPrice(order)}` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t pt-2">
                          <span className="text-gray-900 dark:text-gray-100">Total:</span>
                          <span className="text-primary">৳{order.totalPrice || 0}</span>
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="flex gap-2 pt-2">
                        {order.status === "pending" && (
                          <>
                            <Button
                              onClick={() => handleAccept(order.id || order._id || "")}
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleReject(order.id || order._id || "")}
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <Button
                            onClick={() => handleStatusUpdate(order.id || order._id || "", "served")}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            Mark Served
                          </Button>
                        )}
                        {order.status === "served" && (
                          <Button
                            onClick={() => handleStatusUpdate(order.id || order._id || "", "completed")}
                            size="sm"
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary Footer */}
            {filteredOrders.length > 0 && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Orders Shown</p>
                      <p className="text-2xl font-bold">{filteredOrders.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue (Shown)</p>
                      <p className="text-2xl font-bold">
                        ৳{filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        ৳
                        {filteredOrders.length > 0
                          ? Math.round(
                              filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0) /
                                filteredOrders.length,
                            )
                          : 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">
                        {filteredOrders.reduce((sum, order) => sum + (order.quantity || 0), 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
