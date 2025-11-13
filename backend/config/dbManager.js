import mongoose from "mongoose"
import { userSchema, productSchema, orderSchema } from "../models/schemas.js"

// Database connections cache
const connections = {}

// Fragmentation strategy based on USER ROLE
const getDatabaseKey = (userData) => {
  const role = userData?.role?.toLowerCase()
  const department = userData?.department?.toLowerCase() || ""
  const email = userData?.email || ""
  
  // Student → db1
  // Check if role is "student" or department contains "student"
  if (role === "student" || department.includes("student")) {
    const dbKey = "db1"
    console.log(`[UserFragmentation] User ${email} (role: ${role}, department: ${department}) → ${dbKey} [Student]`)
    return dbKey
  }
  
  // Teacher → db2
  // Check if role is "teacher" or department contains "teacher"
  if (role === "teacher" || department.includes("teacher")) {
    const dbKey = "db2"
    console.log(`[UserFragmentation] User ${email} (role: ${role}, department: ${department}) → ${dbKey} [Teacher]`)
    return dbKey
  }
  
  // Admin & Staff → db3
  // Check if role is "admin" or "staff"
  if (role === "admin" || role === "staff") {
    const dbKey = "db3"
    console.log(`[UserFragmentation] User ${email} (role: ${role}, department: ${department}) → ${dbKey} [Admin/Staff]`)
    return dbKey
  }
  
  // Regular users (role="user") → distribute evenly between db2 and db3 using email hash
  if (role === "user") {
    if (email) {
      const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const dbKey = hash % 2 === 0 ? "db2" : "db3"
      console.log(`[UserFragmentation] User ${email} (role: ${role}) → ${dbKey} [Regular User - Email Hash]`)
      return dbKey
    }
    // Default regular users to db2
    const dbKey = "db2"
    console.log(`[UserFragmentation] User ${email} (role: ${role}) → ${dbKey} [Regular User - Default]`)
    return dbKey
  }
  
  // Fallback: If role not specified, distribute by email hash
  if (email) {
    const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const dbNum = (hash % 3) + 1
    const dbKey = `db${dbNum}`
    console.log(`[UserFragmentation] User ${email} (role: ${role || "unknown"}) → ${dbKey} [Fallback - Email Hash]`)
    return dbKey
  }
  
  // Default to db2 for new users
  const dbKey = "db2"
  console.log(`[UserFragmentation] User ${email || "unknown"} (role: ${role || "unknown"}) → ${dbKey} [Default]`)
  return dbKey
}

// Get database URI for a specific database key
const getDatabaseURI = (dbKey) => {
  const baseURI = process.env.MONGODB_URI || "mongodb://localhost:27017/cafeteria"
  
  // If specific database URIs are set, use them
  if (process.env.MONGODB_URI_DB1 || process.env.MONGODB_URI_DB2 || process.env.MONGODB_URI_DB3) {
    const uris = {
      db1: process.env.MONGODB_URI_DB1 || baseURI.replace(/\/[^/]*$/, "/cafeteria-db1"),
      db2: process.env.MONGODB_URI_DB2 || baseURI.replace(/\/[^/]*$/, "/cafeteria-db2"),
      db3: process.env.MONGODB_URI_DB3 || baseURI.replace(/\/[^/]*$/, "/cafeteria-db3"),
    }
    return uris[dbKey] || uris.db1
  }
  
  // Otherwise, use same base URI but different database names
  // Extract database name from URI and replace with db-specific name
  if (baseURI.includes("@") && baseURI.includes(".mongodb.net/")) {
    // MongoDB Atlas format: ...mongodb.net/database-name
    const dbName = dbKey === "db1" ? "cafeteria-db1" : dbKey === "db2" ? "cafeteria-db2" : "cafeteria-db3"
    return baseURI.replace(/\/([^/?]+)(\?|$)/, `/${dbName}$2`)
  } else {
    // Local MongoDB format
    const dbName = dbKey === "db1" ? "cafeteria-db1" : dbKey === "db2" ? "cafeteria-db2" : "cafeteria-db3"
    return baseURI.replace(/\/[^/]*$/, `/${dbName}`)
  }
}

// Connect to a specific database
export const connectToDatabase = async (dbKey) => {
  // Return existing connection if available and ready
  if (connections[dbKey]?.readyState === 1) {
    return connections[dbKey]
  }
  
  // If connection exists but is not ready, close it first
  if (connections[dbKey]) {
    try {
      await connections[dbKey].close()
    } catch (err) {
      // Ignore close errors
    }
    delete connections[dbKey]
  }
  
  try {
    const uri = getDatabaseURI(dbKey)
    const conn = await mongoose.createConnection(uri).asPromise()
    
    // Register all models on this connection with collection names
    // This ensures models are available when querying across databases
    // Collection names match what modelFactory expects
    const fragNum = dbKey === "db1" ? "1" : dbKey === "db2" ? "2" : "3"
    const userCollectionName = `User_Frag${fragNum}`
    const productCollectionName = `Menu_Frag${fragNum}`
    const orderCollectionName = `Order_Frag${fragNum}`
    
    if (!conn.models[userCollectionName]) {
      conn.model(userCollectionName, userSchema)
    }
    if (!conn.models[productCollectionName]) {
      conn.model(productCollectionName, productSchema)
    }
    if (!conn.models[orderCollectionName]) {
      conn.model(orderCollectionName, orderSchema)
    }
    
    // Also register with standard names for direct access
    if (!conn.models.User) {
      conn.model("User", userSchema)
    }
    if (!conn.models.Product) {
      conn.model("Product", productSchema)
    }
    if (!conn.models.Order) {
      conn.model("Order", orderSchema)
    }
    
    connections[dbKey] = conn
    
    // Log connection with database name
    const dbName = conn.name || uri.split('/').pop()?.split('?')[0] || dbKey
    console.log(`✅ Connected to ${dbKey}: ${dbName} (Models registered: User, Product, Order)`)
    
    return conn
  } catch (error) {
    console.error(`❌ Error connecting to ${dbKey}:`, error.message)
    throw error
  }
}

// Connect to all databases on startup
export const connectAllDatabases = async () => {
  try {
    console.log("🔌 Connecting to all databases...")
    
    const results = await Promise.allSettled([
      connectToDatabase("db1"),
      connectToDatabase("db2"),
      connectToDatabase("db3"),
    ])
    
    const successful = results.filter(r => r.status === "fulfilled").length
    const failed = results.filter(r => r.status === "rejected").length
    
    if (successful > 0) {
      console.log(`✅ ${successful} database(s) connected successfully!`)
      if (failed > 0) {
        console.warn(`⚠️  ${failed} database(s) failed to connect (will retry on use)`)
      }
    } else {
      console.error("❌ No databases could be connected!")
    }
  } catch (error) {
    console.error("❌ Error connecting to databases:", error.message)
    // Don't exit - allow partial connection
  }
}

// Get connection for a specific database key
export const getConnection = (dbKey) => {
  return connections[dbKey]
}

// Get database key based on user data
export const getDatabaseForUser = (userData) => {
  return getDatabaseKey(userData)
}

// Get database key for food menu based on time category
export const getDatabaseForMenu = (timeCategory) => {
  if (!timeCategory) {
    throw new Error("Missing timeCategory - cannot determine database for menu")
  }
  
  const category = timeCategory.toLowerCase()
  
  // Map time categories to databases
  if (category === "morning") {
    return "db1"
  } else if (category === "day") {
    return "db2" // Lunch items go to db2
  } else if (category === "evening") {
    return "db3"
  }
  
  throw new Error(`Invalid timeCategory: ${timeCategory}. Must be: morning, day, or evening`)
}

// Get database key for order based on order time
export const getDatabaseForOrder = (orderDate) => {
  if (!orderDate) {
    throw new Error("Missing orderDate - cannot determine database for order")
  }
  
  // Handle both Date objects and date strings
  const date = orderDate instanceof Date ? orderDate : new Date(orderDate)
  
  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid orderDate: ${orderDate} - cannot parse date`)
  }
  
  // Use local PC time (not Bangladesh time)
  // Get local hour directly from the date object
  const hour = date.getHours()
  const minutes = date.getMinutes()
  
  // Format local time for logging
  const localTimeString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} (Local Time)`
  
  // Fragment by time of day (Local PC time):
  // Morning: < 11:00 AM → db1
  // Lunch: 11:00 AM - 3:00 PM (11-15) → db2
  // Evening: > 3:00 PM (15) → db3
  let dbKey
  if (hour < 11) {
    dbKey = "db1" // Morning orders
  } else if (hour >= 11 && hour <= 15) {
    dbKey = "db2" // Lunch orders
  } else {
    dbKey = "db3" // Evening orders
  }
  
  console.log(`[OrderFragmentation] Order at ${localTimeString} (hour: ${hour}) → ${dbKey}`)
  return dbKey
}

// Get all database connections
export const getAllConnections = () => {
  return connections
}

// Close all connections
export const closeAllConnections = async () => {
  await Promise.all(
    Object.values(connections).map((conn) => {
      if (conn?.readyState === 1) {
        return conn.close()
      }
    })
  )
  console.log("✅ All database connections closed")
}

export default {
  connectToDatabase,
  connectAllDatabases,
  getConnection,
  getDatabaseForUser,
  getDatabaseForMenu,
  getDatabaseForOrder,
  getAllConnections,
  closeAllConnections,
}

