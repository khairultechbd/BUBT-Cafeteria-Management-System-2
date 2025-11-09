import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { connectToDatabase, closeAllConnections } from "../config/dbManager.js"
import { getProductModel } from "../utils/modelFactory.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const bengaliFoods = [
  // Morning Foods (সকালের খাবার)
  {
    name: "Paratha",
    description: "তেলে ভাজা ময়দার রুটি, আলু ভর্তা সহ",
    price: 20,
    category: "Breakfast",
    timeCategory: "morning",
    available: true,
  },
  {
    name: "Roti",
    description: "সাদা আটা রুটি, ডাল ও আলু ভর্তা সহ",
    price: 15,
    category: "Breakfast",
    timeCategory: "morning",
    available: true,
  },
  {
    name: "Khichuri",
    description: "ডাল-ভাতের খিচুড়ি, আলু ভর্তা ও ডিম ভাজা সহ",
    price: 60,
    category: "Breakfast",
    timeCategory: "morning",
    available: true,
  },
  {
    name: "Alu Bhaat",
    description: "আলু ভাত, ডাল ও ডিম ভাজা সহ",
    price: 45,
    category: "Breakfast",
    timeCategory: "morning",
    available: true,
  },
  {
    name: "Dal with Roti",
    description: "মসুর ডাল, আলু ভর্তা ও ২টি রুটি",
    price: 30,
    category: "Breakfast",
    timeCategory: "morning",
    available: true,
  },
  {
    name: "Alu Bhaji",
    description: "আলু ভাজি, রুটি ও ডাল সহ",
    price: 35,
    category: "Breakfast",
    timeCategory: "morning",
    available: true,
  },

  // Day/Lunch Foods (দুপুরের খাবার)
  {
    name: "Rice with Dal",
    description: "ভাত, ডাল, আলু ভর্তা ও ডিম ভাজি",
    price: 50,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Fish Curry Meal",
    description: "ভাত, মাছের ঝোল, ডাল ও শাক ভাজি",
    price: 120,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Chicken Curry Meal",
    description: "ভাত, মুরগির ঝোল, ডাল ও সবজি ভাজি",
    price: 150,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Egg Curry Meal",
    description: "ভাত, ডিমের ঝোল, ডাল ও আলু ভর্তা",
    price: 70,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Mixed Vegetable Curry",
    description: "ভাত, মিশ্র সবজির ঝোল, ডাল ও আলু ভর্তা",
    price: 65,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Alu Bhorta with Rice",
    description: "ভাত, আলু ভর্তা, ডাল ও ডিম ভাজি",
    price: 55,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Begun Bhaja with Rice",
    description: "ভাত, বেগুন ভাজা, ডাল ও শাক ভাজি",
    price: 60,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Chicken Biryani",
    description: "মুরগি বিরিয়ানি, সালাদ ও রায়তা",
    price: 180,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },
  {
    name: "Beef Curry Meal",
    description: "ভাত, গরুর মাংসের ঝোল, ডাল ও সবজি",
    price: 200,
    category: "Lunch",
    timeCategory: "day",
    available: true,
  },

  // Evening Foods (সন্ধ্যার খাবার)
  {
    name: "Samosa",
    description: "২টি সমুচা, চাটনি সহ",
    price: 25,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Singara",
    description: "৩টি সিঙ্গাড়া, চাটনি সহ",
    price: 30,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Jhalmuri",
    description: "ঝালমুড়ি, চানাচুর ও সবজি সহ",
    price: 35,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Fuchka",
    description: "৫টি ফুচকা, তেঁতুলের পানি ও ডাল",
    price: 40,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Chotpoti",
    description: "চটপটি, ডিম ও সবজি সহ",
    price: 45,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Tea with Biscuit",
    description: "চা ও ৪টি বিস্কুট",
    price: 20,
    category: "Beverages",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Pitha",
    description: "পিঠা (বিভিন্ন ধরন), সিরা সহ",
    price: 30,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
  {
    name: "Pakora",
    description: "পাকোড়া (বেগুন/পেঁয়াজ), চাটনি সহ",
    price: 35,
    category: "Snacks",
    timeCategory: "evening",
    available: true,
  },
]

async function seedFoods() {
  try {
    console.log("🌱 Seeding Bengali foods...")

    // Connect to db1 (where products are stored)
    await connectToDatabase("db1")
    const Product = await getProductModel("db1")

    // Clear existing products (optional - comment out if you want to keep existing)
    // await Product.deleteMany({})

    let created = 0
    let skipped = 0

    for (const food of bengaliFoods) {
      const existing = await Product.findOne({ name: food.name, timeCategory: food.timeCategory })
      
      if (existing) {
        console.log(`⏭️  Skipped: ${food.name} (${food.timeCategory}) - already exists`)
        skipped++
      } else {
        const product = new Product(food)
        await product.save()
        console.log(`✅ Created: ${food.name} (${food.timeCategory}) - ${food.price}৳`)
        created++
      }
    }

    console.log("\n📊 Summary:")
    console.log(`✅ Created: ${created}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📦 Total: ${bengaliFoods.length}`)
    console.log("\n🎉 Seeding completed!")
  } catch (error) {
    console.error("❌ Error seeding foods:", error)
    process.exit(1)
  } finally {
    await closeAllConnections()
  }
}

seedFoods()

