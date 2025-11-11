import mongoose from "mongoose"
import { getConnection } from "../config/dbManager.js"

// Model cache per database
const modelCache = {}

// Helper function to get collection name based on model type and database
// Returns PDF fragmentation names exactly as specified
const getCollectionName = (modelName, dbKey, additionalData = {}) => {
  if (modelName === "User") {
    // PDF Fragmentation: User_Frag1 → DB1 → Students, User_Frag2 → DB2 → Teachers, User_Frag3 → DB3 → Admin + Staff
    if (dbKey === "db1") return "User_Frag1"
    if (dbKey === "db2") return "User_Frag2"
    if (dbKey === "db3") return "User_Frag3"
    return "users" // fallback
  } else if (modelName === "Product") {
    // PDF Fragmentation: Menu_Frag1 → DB1 → Morning, Menu_Frag2 → DB2 → Lunch, Menu_Frag3 → DB3 → Evening
    if (dbKey === "db1") return "Menu_Frag1"
    if (dbKey === "db2") return "Menu_Frag2"
    if (dbKey === "db3") return "Menu_Frag3"
    return "foods" // fallback
  } else if (modelName === "Order") {
    // PDF Fragmentation: Order_Frag1 → DB1 → < 11:00 AM, Order_Frag2 → DB2 → 11:00 AM - 3:00 PM, Order_Frag3 → DB3 → > 3:00 PM
    if (dbKey === "db1") return "Order_Frag1"
    if (dbKey === "db2") return "Order_Frag2"
    if (dbKey === "db3") return "Order_Frag3"
    return "orders" // fallback
  } else if (modelName === "Notification") {
    return "Notification_Frag1" // Default to Frag1, can be extended if needed
  }
  
  // Fallback to original model name if not mapped
  return modelName.toLowerCase() + "s"
}

// Create or get a model for a specific database connection
export const getModel = async (modelName, schema, dbKey) => {
  const collectionName = getCollectionName(modelName, dbKey)
  const cacheKey = `${dbKey}_${collectionName}`
  
  // Return cached model if exists and connection is active
  if (modelCache[cacheKey]) {
    const conn = getConnection(dbKey)
    if (conn?.readyState === 1) {
      return modelCache[cacheKey]
    }
    // Connection lost, clear cache
    delete modelCache[cacheKey]
  }
  
  // Get the connection for this database
  let conn = getConnection(dbKey)
  
  // If connection doesn't exist or is not ready, try to connect
  if (!conn || conn.readyState !== 1) {
    const { connectToDatabase } = await import("../config/dbManager.js")
    try {
      conn = await connectToDatabase(dbKey)
    } catch (error) {
      throw new Error(`Failed to connect to ${dbKey}: ${error.message}`)
    }
  }
  
  // Create model on this specific connection with collection name
  // Check if model already exists on this connection
  let model = conn.models[collectionName]
  if (!model) {
    // Delete mongoose.models before registering to prevent overwrite errors
    const globalModelKey = `${conn.name}_${collectionName}`
    if (mongoose.models && mongoose.models[globalModelKey]) {
      delete mongoose.models[globalModelKey]
    }
    // Also delete standard model names if they exist
    if (modelName === 'Product' && mongoose.models && mongoose.models['Product']) {
      delete mongoose.models['Product']
    }
    if (modelName === 'User' && mongoose.models && mongoose.models['User']) {
      delete mongoose.models['User']
    }
    if (modelName === 'Order' && mongoose.models && mongoose.models['Order']) {
      delete mongoose.models['Order']
    }
    
    // Register model with collection name
    if (modelName === 'Product' && !conn.models['Product']) {
      model = conn.model('Product', schema, collectionName)
    } else {
      model = conn.model(collectionName, schema)
    }
  }
  
  // Log collection usage
  console.log(`[CollectionNaming] Using collection ${collectionName} in ${dbKey} for model ${modelName}`)
  
  // Cache it
  modelCache[cacheKey] = model
  
  return model
}

// Import schemas (ES module)
import { userSchema, productSchema, orderSchema, notificationSchema } from "../models/schemas.js"

// Helper to get User model for a specific database
export const getUserModel = async (dbKey) => {
  return await getModel("User", userSchema, dbKey)
}

// Helper to get Product model for a specific database
export const getProductModel = async (dbKey) => {
  return await getModel("Product", productSchema, dbKey)
}

// Helper to get Order model for a specific database
export const getOrderModel = async (dbKey) => {
  return await getModel("Order", orderSchema, dbKey)
}

// Helper to get Notification model for a specific database
export const getNotificationModel = async (dbKey) => {
  return await getModel("Notification", notificationSchema, dbKey)
}

// Query across all databases (for admin operations)
export const queryAllDatabases = async (modelName, queryFn, schema) => {
  const results = []
  
  for (const dbKey of ["db1", "db2", "db3"]) {
    try {
      const model = await getModel(modelName, schema, dbKey)
      const result = await queryFn(model)
      if (Array.isArray(result)) {
        results.push(...result.map((item) => ({ ...item.toObject(), _sourceDb: dbKey })))
      } else if (result) {
        results.push({ ...result.toObject(), _sourceDb: dbKey })
      }
    } catch (error) {
      console.error(`Error querying ${dbKey}:`, error.message)
    }
  }
  
  return results
}

export default {
  getModel,
  getUserModel,
  getProductModel,
  getOrderModel,
  getNotificationModel,
  queryAllDatabases,
}

