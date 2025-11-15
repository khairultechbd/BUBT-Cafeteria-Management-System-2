import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { connectToDatabase, closeAllConnections } from "../config/dbManager.js"
import { getUserModel } from "../utils/modelFactory.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const [,, nameArg, emailArg, passwordArg] = process.argv

const name = nameArg || "Admin User"
const email = emailArg || "admin@gmail.com"
const password = passwordArg || "admin@gmail.com"

if (!email || !password) {
  console.error("Usage: node scripts/createAdmin.js [name] <email> <password>")
  process.exit(1)
}

async function createAdmin() {
  try {
    // Ensure connection to admin database (db3)
    await connectToDatabase("db3")
    const User = await getUserModel("db3")

    const existing = await User.findOne({ email })
    if (existing) {
      console.log(`Admin with email ${email} already exists. Updating to active admin.`)
      existing.name = name
      existing.role = "admin"
      existing.status = "active"
      if (passwordArg) {
        existing.password = password
      }
      await existing.save()
      console.log("✅ Admin updated successfully.")
    } else {
      const admin = new User({
        name,
        email,
        password,
        role: "admin",
        status: "active",
        department: "Administration",
      })
      await admin.save()
      console.log("✅ Admin created successfully.")
    }

    console.log("\nCredentials:")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  } catch (error) {
    console.error("❌ Failed to create admin:", error)
    process.exitCode = 1
  } finally {
    await closeAllConnections()
  }
}

createAdmin()
