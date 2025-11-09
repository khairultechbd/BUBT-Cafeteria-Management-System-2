import mongoose from "mongoose"
import { getConnection } from "../config/dbManager.js"

// Model cache per database
const modelCache = {}

// Create or get a model for a specific database connection
export const getModel = async (modelName, schema, dbKey) => {
  const cacheKey = `${dbKey}_${modelName}`
  
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
  
  // Create model on this specific connection
  // Check if model already exists on this connection
  const model = conn.models[modelName] || conn.model(modelName, schema)
  
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

