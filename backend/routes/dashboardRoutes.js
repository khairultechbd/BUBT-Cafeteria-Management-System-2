import express from "express"
import { protect } from "../middleware/authMiddleware.js"
import { getUserModel, getOrderModel, getProductModel, queryAllDatabases } from "../utils/modelFactory.js"
import { userSchema, orderSchema, productSchema } from "../models/schemas.js"

const router = express.Router()

// Get dashboard stats
router.get("/stats", protect, async (req, res) => {
  try {
    // Get user from their database (dbKey from JWT token)
    const userDbKey = req.user.dbKey || "db1"
    const User = await getUserModel(userDbKey)
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get user's orders from their database
    const Order = await getOrderModel(userDbKey)
    const userOrders = await Order.find({ userId: req.user.id })
    const totalOrders = userOrders.length
    const pendingOrders = userOrders.filter((o) => o.status === "pending").length
    const completedOrders = userOrders.filter((o) => o.status === "completed").length

    let stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      users: 0,
      totalProducts: 0,
    }

    // If admin, get additional stats across all databases
    if (user.role === "admin") {
      // Count users across all databases
      const allUsers = await queryAllDatabases(
        "User",
        async (Model) => Model.find({ status: "active" }),
        userSchema,
      )
      stats.users = allUsers.length

      // Count products across all databases (products are in db1, but query all to be safe)
      const allProducts = await queryAllDatabases(
        "Product",
        async (Model) => Model.find({ available: true }),
        productSchema,
      )
      stats.totalProducts = allProducts.length

      // For admin, also get total orders across all databases
      const allOrders = await queryAllDatabases(
        "Order",
        async (Model) => Model.find(),
        orderSchema,
      )
      stats.totalOrders = allOrders.length
      stats.pendingOrders = allOrders.filter((o) => o.status === "pending").length
      stats.completedOrders = allOrders.filter((o) => o.status === "completed").length
    }

    res.json(stats)
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({ message: error.message })
  }
})

export default router
