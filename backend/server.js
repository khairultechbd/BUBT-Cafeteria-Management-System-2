import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { connectAllDatabases } from "./config/dbManager.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import path from "path"
import { fileURLToPath } from "url"
import uploadRoutes from "./routes/uploadRoutes.js"

dotenv.config()
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Connect to all databases (non-blocking)
// This runs in background and doesn't block server startup
connectAllDatabases().catch((err) => {
  console.error("Database connection error:", err)
  // Server will still start, connections will retry on use
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/upload", uploadRoutes)

// Static serving for uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "Server is running" })
})

const PORT = process.env.PORT || 5000

// Create server with error handling
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Handle port conflicts gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is already in use. The server may be restarting...`)
    // Don't crash - nodemon will retry after delay
  } else {
    console.error('❌ Server error:', err)
    process.exit(1)
  }
})

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} signal received: closing HTTP server...`)
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed')
      // Close all database connections
      try {
        const { closeAllConnections } = await import('./config/dbManager.js')
        await closeAllConnections()
      } catch (err) {
        console.error('Error closing DB connections:', err)
      }
      process.exit(0)
    })
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forcing shutdown...')
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
