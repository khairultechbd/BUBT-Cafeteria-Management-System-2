import mongoose from "mongoose"
import { getConnection } from "../config/dbManager.js"

// Model cache per database
const modelCache = {}

// Helper function to get collection name based on model type and database
// Returns meaningful collection names based on fragmentation strategy
const getCollectionName = (modelName, dbKey, additionalData = {}) => {
  if (modelName === "User") {
    // Users are fragmented by role: student→db1, teacher→db2, admin/staff→db3
    if (dbKey === "db1") return "user_student"
    if (dbKey === "db2") return "user_teacher"
    if (dbKey === "db3") return "user_staff"
    return "users" // fallback
  } else if (modelName === "Product") {
    // Products are fragmented by timeCategory: morning→db1, day→db2, evening→db3
    if (dbKey === "db1") return "food_morning"
    if (dbKey === "db2") return "food_lunch"
    if (dbKey === "db3") return "food_evening"
    return "foods" // fallback
  } else if (modelName === "Order") {
    // Orders are fragmented by time: morning→db1, lunch→db2, evening→db3
    // For today's orders vs history, we can use the same collections
    // or differentiate based on date if needed
    if (dbKey === "db1") return "orders_today" // morning orders
    if (dbKey === "db2") return "orders_today" // lunch orders
    if (dbKey === "db3") return "orders_today" // evening orders
    return "orders" // fallback
  } else if (modelName === "Notification") {
    return "notifications"
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
    // Check mongoose.models to prevent "Schema hasn't been registered" errors
    const globalModelKey = `${conn.name}_${collectionName}`
    if (mongoose.models && mongoose.models[globalModelKey]) {
      model = mongoose.models[globalModelKey]
    } else {
      // Also check standard model name (e.g., 'Product')
      if (modelName === 'Product' && !conn.models['Product']) {
        model = conn.model('Product', schema)
      } else {
        model = conn.model(collectionName, schema)
      }
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

