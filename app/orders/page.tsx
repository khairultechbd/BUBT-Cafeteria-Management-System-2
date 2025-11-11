"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { apiFetch } from "@/lib/api"

interface Order {
  _id?: string
  id?: string
  productId: {
    _id?: string
    id?: string
    name?: string
    price?: number
    description?: string
  } | null
  totalPrice: number
  quantity: number
  status: string
  createdAt: string
  // Food snapshot fields
  foodId?: string
  foodName?: string
  foodPrice?: number
  foodImage?: string
  foodCategory?: string
  timeSlot?: string
  tableNumber?: string
  roomNumber?: string
  orderTime?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    fetchOrders()
  }, [router])

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/api/orders/my-orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err)
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
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Orders</h1>
              <p className="text-muted-foreground">Track your order history and status</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No orders yet</p>
                <p className="text-sm">Start by ordering some delicious food items!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <Card key={order._id || order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {order.foodName || (order.productId && typeof order.productId === 'object' && order.productId.name
                                ? order.productId.name
                                : "Product Deleted")}
                            </h3>
                            {order.foodCategory && (
                              <p className="text-sm text-muted-foreground">
                                Category: {order.foodCategory}
                              </p>
                            )}
                            {order.timeSlot && (
                              <p className="text-sm text-muted-foreground">
                                Time: {order.timeSlot}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Quantity: {order.quantity || 1}
                            </p>
                            {(order.tableNumber || order.roomNumber) && (
                              <p className="text-sm text-muted-foreground">
                                {order.tableNumber ? `Table: ${order.tableNumber}` : `Room: ${order.roomNumber}`}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {order.orderTime
                                ? new Date(order.orderTime).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : ""}
                            </p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-2xl font-bold text-primary">৳{order.totalPrice || 0}</div>
                        </div>
                      </div>
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
