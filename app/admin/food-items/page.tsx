"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Topbar from "@/components/topbar"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/search-input"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"
import { apiFetch, getApiBaseUrl } from "@/lib/api"

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

export default function AdminFoodItemsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<string>("all")
  const debouncedSearch = useDebounce(searchQuery, 300)

  const timeCategories = [
    { value: "all", label: "All", emoji: "🍽️" },
    { value: "morning", label: "Morning", emoji: "🌅" },
    { value: "day", label: "Lunch", emoji: "🍛" },
    { value: "evening", label: "Evening", emoji: "🌆" },
  ]
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    category: "Food",
    timeCategory: "morning" as "morning" | "day" | "evening",
    available: true,
    image: "/placeholder.svg",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

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

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id || item._id || null)
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description || "",
      category: item.category || "Food",
      timeCategory: item.timeCategory || "morning",
      available: item.available !== undefined ? item.available : true,
      image: item.image || "/placeholder.svg",
    })
    setImageFile(null)
    setImagePreview("")
  }

  const handleSave = async () => {
    if (!editingId || editingId === "new") return

    try {
      const response = await apiFetch(`/api/products/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditingId(null)
        await fetchFoodItems()
        toast({
          variant: "success",
          title: "Success",
          description: "Food item updated successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to update food item",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update food item",
      })
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this food item?")) return

    try {
      const response = await apiFetch(`/api/products/${itemId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchFoodItems()
        toast({
          variant: "success",
          title: "Success",
          description: "Food item deleted successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to delete food item",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete food item",
      })
    }
  }

  const handleAddNew = () => {
    setEditingId("new")
    setFormData({
      name: "",
      price: 0,
      description: "",
      category: "Food",
      timeCategory: "morning",
      available: true,
      image: "/placeholder.svg",
    })
    setImageFile(null)
    setImagePreview("")
  }

  const handleCreateNew = async () => {
    if (!formData.name || !formData.price || !formData.timeCategory) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Price, Time Category)",
      })
      return
    }

    try {
      const response = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditingId(null)
        await fetchFoodItems()
        toast({
          variant: "success",
          title: "Success",
          description: "Food item created successfully!",
        })
      } else {
        const data = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to create food item",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create food item",
      })
    }
  }

  const filteredItems = debouncedSearch
    ? foodItems.filter((item) =>
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : foodItems

  if (!user || user.role !== "admin") return null

  const getTimeCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      morning: "🌅 Morning",
      day: "🍛 Lunch",
      evening: "🌆 Evening",
    }
    return labels[category] || category
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Food Items Management</h1>
                <p className="text-muted-foreground">Manage Bengali food items for the cafeteria</p>
              </div>
              <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
                + Add New Food Item
              </Button>
            </div>

            {/* Search Bar */}
            <SearchInput
              placeholder="Search food items by name, description, or category..."
              value={searchQuery}
              onChange={setSearchQuery}
            />

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

            {/* Add/Edit Form */}
            {editingId && (
              <Card className="bg-muted border-2">
                <CardHeader>
                  <CardTitle>{editingId === "new" ? "Add New Food Item" : "Edit Food Item"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Paratha, Chicken Curry"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Breakfast, Lunch, Snacks"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Price (৳) *</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                        placeholder="Price in BDT"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Time Category *</label>
                      <select
                        value={formData.timeCategory}
                        onChange={(e) =>
                          setFormData({ ...formData, timeCategory: e.target.value as "morning" | "day" | "evening" })
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="morning">🌅 Morning</option>
                        <option value="day">🍛 Lunch (Day)</option>
                        <option value="evening">🌆 Evening</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Food item description (Bengali or English)"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Image</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={formData.image}
                            onChange={(e) => {
                              setFormData({ ...formData, image: e.target.value })
                              setImageFile(null)
                              setImagePreview("")
                            }}
                            placeholder="/placeholder.svg"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setImageFile(file)
                                  
                                  // Upload file to backend
                                  try {
                                    const formData = new FormData()
                                    formData.append("image", file)
                                    
                                    const token = localStorage.getItem("token")
                                    const backendUrl = getApiBaseUrl()
                                    
                                    const response = await fetch(`${backendUrl}/api/products/upload`, {
                                      method: "POST",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: formData,
                                    })
                                    
                                    if (response.ok) {
                                      const data = await response.json()
                                      // Auto-fill image URL with the returned path
                                      const imageUrl = data.imageUrl
                                      setFormData({ ...formData, image: imageUrl })
                                      
                                      // Set preview using the uploaded image URL
                                      const fullImageUrl = `${backendUrl}${imageUrl}`
                                      setImagePreview(fullImageUrl)
                                      
                                      toast({
                                        variant: "success",
                                        title: "Image uploaded",
                                        description: "Image uploaded successfully!",
                                      })
                                    } else {
                                      const errorData = await response.json().catch(() => ({}))
                                      toast({
                                        variant: "destructive",
                                        title: "Upload failed",
                                        description: errorData.message || "Failed to upload image",
                                      })
                                    }
                                  } catch (err: any) {
                                    console.error("Image upload error:", err)
                                    toast({
                                      variant: "destructive",
                                      title: "Upload failed",
                                      description: err.message || "Failed to upload image",
                                    })
                                  }
                                }
                              }}
                            />
                            <Button type="button" variant="outline" className="whitespace-nowrap">
                              Browse
                            </Button>
                          </label>
                        </div>
                        {imagePreview && (
                          <div className="mt-2">
                            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded border" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium">Available</label>
                      <input
                        type="checkbox"
                        checked={formData.available}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={editingId === "new" ? handleCreateNew : handleSave}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {editingId === "new" ? "Create" : "Save Changes"}
                    </Button>
                    <Button onClick={() => setEditingId(null)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Food Items List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">Loading food items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No food items found</p>
                <p className="text-sm">Try adjusting your search or add a new item</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id || item._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                            {item.category}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {getTimeCategoryLabel(item.timeCategory)}
                          </span>
                          {!item.available && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Unavailable</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <div>
                            <span className="text-xs text-muted-foreground">Price</span>
                            <p className="text-xl font-bold text-primary">৳{item.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleEdit(item)} variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button onClick={() => handleDelete(item.id || item._id || "")} variant="destructive" size="sm">
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Summary */}
            {!loading && foodItems.length > 0 && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-2xl font-bold">{foodItems.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Morning Items</p>
                      <p className="text-2xl font-bold">
                        {foodItems.filter((item) => item.timeCategory === "morning").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lunch Items</p>
                      <p className="text-2xl font-bold">{foodItems.filter((item) => item.timeCategory === "day").length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Evening Items</p>
                      <p className="text-2xl font-bold">
                        {foodItems.filter((item) => item.timeCategory === "evening").length}
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
