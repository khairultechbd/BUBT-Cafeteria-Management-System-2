import { type NextRequest, NextResponse } from "next/server"

// Mock database (same as in route.ts)
const foodItems = [
  {
    id: "1",
    name: "Chicken Biryani",
    price: 150,
    description: "Delicious chicken biryani with basmati rice",
    category: "Main Course",
    inventory: 25,
  },
  {
    id: "2",
    name: "Egg Fried Rice",
    price: 120,
    description: "Egg fried rice with vegetables",
    category: "Main Course",
    inventory: 30,
  },
  {
    id: "3",
    name: "Chow Mein",
    price: 100,
    description: "Chow mein noodles with vegetables",
    category: "Main Course",
    inventory: 20,
  },
  {
    id: "4",
    name: "Chicken Burger",
    price: 80,
    description: "Chicken burger with fries",
    category: "Snacks",
    inventory: 35,
  },
  {
    id: "5",
    name: "Cheese Pizza",
    price: 200,
    description: "Delicious cheese pizza",
    category: "Main Course",
    inventory: 15,
  },
  {
    id: "6",
    name: "Samosa",
    price: 30,
    description: "Crispy samosa (3 pieces)",
    category: "Snacks",
    inventory: 50,
  },
  {
    id: "7",
    name: "Iced Tea",
    price: 40,
    description: "Refreshing iced tea",
    category: "Beverages",
    inventory: 40,
  },
  {
    id: "8",
    name: "Mango Lassi",
    price: 50,
    description: "Traditional mango lassi",
    category: "Beverages",
    inventory: 25,
  },
]

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()

    const itemIndex = foodItems.findIndex((item) => item.id === id)
    if (itemIndex === -1) {
      return NextResponse.json({ message: "Food item not found" }, { status: 404 })
    }

    foodItems[itemIndex] = { ...foodItems[itemIndex], ...body }
    return NextResponse.json(foodItems[itemIndex])
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const itemIndex = foodItems.findIndex((item) => item.id === id)
    if (itemIndex === -1) {
      return NextResponse.json({ message: "Food item not found" }, { status: 404 })
    }

    foodItems.splice(itemIndex, 1)
    return NextResponse.json({ message: "Food item deleted successfully" })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
