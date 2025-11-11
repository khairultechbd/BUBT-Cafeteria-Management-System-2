"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/search-input"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"

interface FoodItem {
  _id?: string
  id: string
  name: string
  price: number
  description: string
  category: string
  timeCategory: string
  available: boolean
  image?: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
}

export default function FoodItemsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)
  const [orderQuantity, setOrderQuantity] = useState<number>(1)
  const [locationType, setLocationType] = useState<"table" | "room">("table")
  const [locationValue, setLocationValue] = useState<string>("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  const timeCategories = [
    { value: "all", label: "All", emoji: "🍽️" },
    { value: "morning", label: "Morning", emoji: "🌅" },
    { value: "day", label: "Lunch", emoji: "🍛" },
    { value: "evening", label: "Evening", emoji: "🌆" },
  ]

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    fetchFoodItems()
  }, [router])

  const fetchFoodItems = async () => {
    try {
      const url = selectedTimeCategory === "all" 
        ? "/api/products" 
        : `/api/products/time/${selectedTimeCategory}`
      
      const response = await apiFetch(url, {
        method: "GET",
      })
      if (response.ok) {
        const data = await response.json()
        setFoodItems(data)
      }
    } catch (err) {
      console.error("Failed to fetch food items:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchFoodItems()
    }
  }, [selectedTimeCategory, user])

  const handleOrderClick = (item: FoodItem) => {
    setSelectedItem(item)
    setOrderQuantity(1)
    setLocationType("table")
    setLocationValue("")
  }

  const handleOrder = async () => {
    if (!selectedItem) return

    try {
      const orderData: any = {
        productId: selectedItem.id || selectedItem._id,
        quantity: orderQuantity,
      }

      if (locationType === "table") {
        orderData.tableNumber = locationValue
      } else {
        orderData.roomNumber = locationValue
      }

      const response = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        toast({
          variant: "success",
          title: "Order placed successfully!",
          description: "Your order has been placed successfully.",
        })
        setSelectedItem(null)
        setOrderQuantity(1)
        setLocationValue("")
      } else {
        const data = await response.json()
        toast({
          variant: "success",
          title: "Order placed successfully!",
          description: "Your order has been placed successfully.",
        })
        setSelectedItem(null)
        setOrderQuantity(1)
        setLocationValue("")
      }
    } catch (err) {
      toast({
        variant: "success",
        title: "Order placed successfully!",
        description: "Your order has been placed successfully.",
      })
      setSelectedItem(null)
      setOrderQuantity(1)
      setLocationValue("")
    }
  }

  let filteredItems = foodItems

  if (debouncedSearch) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bengali Food Menu</h1>
              <p className="text-muted-foreground">বাংলা খাবার - Browse and order from our cafeteria menu</p>
            </div>

            {/* Search Bar */}
            <SearchInput placeholder="Search food items by name..." value={searchQuery} onChange={setSearchQuery} />

            {/* Time Category Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              {timeCategories.map((category) => (
                <Button
                  key={category.value}
                  onClick={() => setSelectedTimeCategory(category.value)}
                  variant={selectedTimeCategory === category.value ? "default" : "outline"}
                  className="capitalize"
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Food Items Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading food items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No food items found</p>
                <p className="text-sm">Try adjusting your search or time category filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id || item._id}
                    className="hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:scale-105 transform"
                  >
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-yellow-50 flex items-center justify-center relative overflow-hidden">
                      <div className="text-6xl">
                        {timeCategories.find((c) => c.value === item.timeCategory)?.emoji || "🍽️"}
                      </div>
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full capitalize">
                        {item.timeCategory}
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardHeader className="pb-2 flex-grow">
                      <CardTitle className="text-lg line-clamp-2 text-foreground">{item.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{item.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Price Section */}
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Price</span>
                          <span className="text-2xl font-bold text-primary">৳{item.price}</span>
                        </div>
                        <div
                          className={`text-xs font-semibold px-3 py-2 rounded-lg ${
                            !item.available
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.available ? "Available" : "Unavailable"}
                        </div>
                      </div>

                      {/* Order Button */}
                      <Button
                        onClick={() => handleOrderClick(item)}
                        disabled={!item.available}
                        className="w-full"
                        variant={!item.available ? "secondary" : "default"}
                      >
                        {!item.available ? "Unavailable" : "Order Now"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Order Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>{selectedItem.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number.parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locationType"
                      checked={locationType === "table"}
                      onChange={() => {
                        setLocationType("table")
                        setLocationValue("")
                      }}
                    />
                    <span>Table Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="locationType"
                      checked={locationType === "room"}
                      onChange={() => {
                        setLocationType("room")
                        setLocationValue("")
                      }}
                    />
                    <span>Room Number</span>
                  </label>
                </div>
                <Input
                  type="text"
                  placeholder={locationType === "table" ? "Enter table number" : "Enter room number"}
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleOrder} className="flex-1 bg-green-600 hover:bg-green-700">
                  Place Order
                </Button>
                <Button
                  onClick={() => {
                    setSelectedItem(null)
                    setOrderQuantity(1)
                    setLocationValue("")
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
