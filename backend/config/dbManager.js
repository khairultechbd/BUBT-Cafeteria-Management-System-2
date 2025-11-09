import mongoose from "mongoose"

// Database connections cache
const connections = {}

// Fragmentation strategy based on USER ROLE
const getDatabaseKey = (userData) => {
  // PRIMARY STRATEGY: Fragment by user role
  const role = userData?.role?.toLowerCase()
  
  if (role === "admin") {
    return "db1" // All admins go to db1
  } else if (role === "user") {
    // Regular users: distribute across db2 and db3
    // Strategy: Use email hash to distribute users evenly
    if (userData?.email) {
      const hash = userData.email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      // Even distribution: db2 or db3
      return hash % 2 === 0 ? "db2" : "db3"
    }
    // Default users to db2
    return "db2"
  }
  
  // Fallback: If role not specified, distribute by email hash
  if (userData?.email) {
    const hash = userData.email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const dbNum = (hash % 3) + 1
    return `db${dbNum}`
  }
  
  // Default to db2 for new users
  return "db2"
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
    
    connections[dbKey] = conn
    
    // Log connection with database name
    const dbName = conn.name || uri.split('/').pop()?.split('?')[0] || dbKey
    console.log(`✅ Connected to ${dbKey}: ${dbName}`)
    
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
  getAllConnections,
  closeAllConnections,
}

