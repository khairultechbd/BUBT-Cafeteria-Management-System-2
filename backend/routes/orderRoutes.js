import express from "express"
import { protect, adminOnly } from "../middleware/authMiddleware.js"
import { getOrderModel, getProductModel, getNotificationModel, queryAllDatabases } from "../utils/modelFactory.js"
import { orderSchema, productSchema } from "../models/schemas.js"
import { getUserModel } from "../utils/modelFactory.js"
import { getDatabaseForOrder, getDatabaseForUser } from "../config/dbManager.js"

const router = express.Router()

// Helper to create notification
const createNotification = async (userId, type, title, message, orderId = null, dbKey = null) => {
  try {
    // Find user to get their dbKey
    if (!dbKey) {
      for (const key of ["db1", "db2", "db3"]) {
        const User = await getUserModel(key)
        const user = await User.findById(userId)
        if (user) {
          dbKey = key
          break
        }
      }
    }
    
    if (!dbKey) return
    
    const Notification = await getNotificationModel(dbKey)
    const notification = new Notification({
      userId,
      orderId,
      type,
      title,
      message,
      read: false,
    })
    await notification.save()
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

// Create order (User)
router.post("/", protect, async (req, res) => {
  try {
    const { productId, quantity, tableNumber, roomNumber } = req.body

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Product ID and quantity required" })
    }

    // Find product across all databases
    let product = null
    for (const dbKey of ["db1", "db2", "db3"]) {
      const Product = await getProductModel(dbKey)
      product = await Product.findById(productId)
      if (product) break
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (!product.available) {
      return res.status(400).json({ message: "Product is not available" })
    }

    const totalPrice = product.price * quantity

    // Determine database for order based on order time (fragmentation by time)
    const orderDate = new Date()
    let orderDbKey
    try {
      orderDbKey = getDatabaseForOrder(orderDate)
      if (!orderDbKey) {
        throw new Error(`Invalid order_time (${orderDate}) — cannot determine DB.`)
      }
    } catch (err) {
      console.error(`[OrderFragmentation] Error determining database for order:`, err.message)
      console.error(`[OrderFragmentation] Order date: ${orderDate}, User: ${req.user.email || req.user.id}`)
      return res.status(500).json({ message: "Order creation failed", error: err.message })
    }

    // Get user's database for notifications (still use user's DB for user notifications)
    const userDbKey = req.user.dbKey || getDatabaseForUser({ role: req.user.role, email: req.user.email }) || "db2"
    
    // Get order model for the correct database
    let Order
    try {
      Order = await getOrderModel(orderDbKey)
    } catch (err) {
      console.error(`[OrderFragmentation] Error connecting to database ${orderDbKey}:`, err.message)
      return res.status(500).json({ message: "Order creation failed", error: `Database connection error: ${err.message}` })
    }

    // Save full food snapshot
    const order = new Order({
      userId: req.user.id,
      productId,
      quantity,
      totalPrice,
      status: "pending",
      orderDate: orderDate,
      // Food snapshot
      foodId: product._id,
      foodName: product.name,
      foodPrice: product.price,
      foodImage: product.image || "/placeholder.svg",
      foodCategory: product.category || "Food",
      timeSlot: product.timeCategory || "day",
      tableNumber: tableNumber || null,
      roomNumber: roomNumber || null,
      orderTime: orderDate,
    })

    await order.save()
    
    // Log successful insertion with collection name
    const collectionName = orderDbKey === "db1" ? "Order_Frag1" : orderDbKey === "db2" ? "Order_Frag2" : "Order_Frag3"
    const localHour = orderDate.getHours()
    const localMinutes = orderDate.getMinutes()
    const localSeconds = orderDate.getSeconds()
    console.log(`[OrderFragmentation] ✅ Successfully inserted order ${order._id} into ${orderDbKey} → Collection: ${collectionName} (Local time: ${localHour.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}:${localSeconds.toString().padStart(2, '0')})`)

    // Populate product details
    await order.populate("productId")

    // Create notification for admin (stored in admin's db - db1)
    const adminDbKey = "db1"
    const AdminUser = await getUserModel(adminDbKey)
    const admins = await AdminUser.find({ role: "admin", status: "active" })

    for (const admin of admins) {
      await createNotification(
        admin._id,
        "order_placed",
        "New Order Received",
        `${req.user.name || "User"} placed an order for ${product.name} x${quantity}`,
        order._id,
        adminDbKey
      )
    }

    // Create notification for user
    await createNotification(
      req.user.id,
      "order_placed",
      "Order Placed",
      `Your order for ${product.name} x${quantity} has been placed and is pending approval.`,
      order._id,
      userDbKey
    )

    res.status(200).json({ 
      success: true,
      message: "Order placed successfully",
      order 
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user's orders
router.get("/my-orders", protect, async (req, res) => {
  try {
    const userDbKey = req.user.dbKey || "db2"
    const Order = await getOrderModel(userDbKey)
    const ProductDb1 = await getProductModel("db1")
    
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
    
    // Manually populate products from db1
    for (const order of orders) {
      if (order.productId) {
        try {
          // Extract productId - could be ObjectId, string, or populated object
          let productId = null
          if (order.productId._id) {
            productId = order.productId._id
          } else if (typeof order.productId === 'string') {
            productId = order.productId
          } else if (order.productId.toString) {
            productId = order.productId.toString()
          }
          
          if (productId) {
            const product = await ProductDb1.findById(productId)
            if (product) {
              order.productId = product.toObject()
            } else {
              order.productId = null
            }
          } else {
            order.productId = null
          }
        } catch (err) {
          order.productId = null
        }
      } else {
        order.productId = null
      }
    }
    
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all orders (Admin only) - query all databases
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    // Query orders WITHOUT populate (to avoid cross-database issues)
    const orders = await queryAllDatabases(
      "Order",
      async (Model) => Model.find(),
      orderSchema,
    )
    
    // Manually populate products from db1
    const ProductDb1 = await getProductModel("db1")
    
    // Manually populate users from all databases
    const UserDb1 = await getUserModel("db1")
    const UserDb2 = await getUserModel("db2")
    const UserDb3 = await getUserModel("db3")
    
    for (const order of orders) {
      // Populate product from db1
      let productId = null
      if (order.productId) {
        if (order.productId._id) {
          productId = order.productId._id
        } else if (typeof order.productId === 'string') {
          productId = order.productId
        } else if (order.productId.toString) {
          productId = order.productId.toString()
        }
      }
      
      if (productId) {
        try {
          const product = await ProductDb1.findById(productId)
          if (product) {
            order.productId = product.toObject()
          } else {
            order.productId = null
          }
        } catch (err) {
          order.productId = null
        }
      } else {
        order.productId = null
      }
      
      // Populate user from the correct database
      let userId = null
      if (order.userId) {
        if (order.userId._id) {
          userId = order.userId._id
        } else if (typeof order.userId === 'string') {
          userId = order.userId
        } else if (order.userId.toString) {
          userId = order.userId.toString()
        }
      }
      
      if (userId) {
        try {
          // Try each database to find the user
          let user = await UserDb1.findById(userId)
          if (!user) user = await UserDb2.findById(userId)
          if (!user) user = await UserDb3.findById(userId)
          
          if (user) {
            order.userId = user.toObject()
            delete order.userId.password // Remove password
          } else {
            order.userId = null
          }
        } catch (err) {
          order.userId = null
        }
      } else {
        order.userId = null
      }
    }
    
    // Sort by creation date
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ message: error.message })
  }
})

// Get pending orders (Admin only) - query all databases
router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    // Query pending orders WITHOUT populate (to avoid cross-database issues)
    const orders = await queryAllDatabases(
      "Order",
      async (Model) => Model.find({ status: "pending" }),
      orderSchema,
    )
    
    // Manually populate products from db1
    const ProductDb1 = await getProductModel("db1")
    
    // Manually populate users from all databases
    const UserDb1 = await getUserModel("db1")
    const UserDb2 = await getUserModel("db2")
    const UserDb3 = await getUserModel("db3")
    
    for (const order of orders) {
      // Populate product from db1
      let productId = null
      if (order.productId) {
        if (order.productId._id) {
          productId = order.productId._id
        } else if (typeof order.productId === 'string') {
          productId = order.productId
        } else if (order.productId.toString) {
          productId = order.productId.toString()
        }
      }
      
      if (productId) {
        try {
          const product = await ProductDb1.findById(productId)
          if (product) {
            order.productId = product.toObject()
          } else {
            order.productId = null
          }
        } catch (err) {
          order.productId = null
        }
      } else {
        order.productId = null
      }
      
      // Populate user from the correct database
      let userId = null
      if (order.userId) {
        if (order.userId._id) {
          userId = order.userId._id
        } else if (typeof order.userId === 'string') {
          userId = order.userId
        } else if (order.userId.toString) {
          userId = order.userId.toString()
        }
      }
      
      if (userId) {
        try {
          // Try each database to find the user
          let user = await UserDb1.findById(userId)
          if (!user) user = await UserDb2.findById(userId)
          if (!user) user = await UserDb3.findById(userId)
          
          if (user) {
            order.userId = user.toObject()
            delete order.userId.password // Remove password
          } else {
            order.userId = null
          }
        } catch (err) {
          order.userId = null
        }
      } else {
        order.userId = null
      }
    }
    
    // Sort by creation date
    orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    
    res.json(orders)
  } catch (error) {
    console.error("Error fetching pending orders:", error)
    res.status(500).json({ message: error.message })
  }
})

// Find order across databases
const findOrderById = async (orderId) => {
  for (const dbKey of ["db1", "db2", "db3"]) {
    try {
      const Order = await getOrderModel(dbKey)
      const order = await Order.findById(orderId)
      if (order) {
        // Convert to plain object to avoid Mongoose document issues
        return { order, dbKey }
      }
    } catch (error) {
      console.error(`Error finding order in ${dbKey}:`, error.message)
    }
  }
  return null
}

// Approve order (Admin only)
router.put("/:id/accept", protect, adminOnly, async (req, res) => {
  try {
    const record = await findOrderById(req.params.id)
    
    if (!record) {
      return res.status(404).json({ message: "Order not found" })
    }

    record.order.status = "accepted"
    await record.order.save()
    
    // Manually populate product from db1
    const ProductDb1 = await getProductModel("db1")
    let productName = "your order"
    try {
      // Extract productId - could be ObjectId, string, or populated object
      let productId = null
      if (record.order.productId) {
        if (record.order.productId._id) {
          productId = record.order.productId._id
        } else if (typeof record.order.productId === 'string') {
          productId = record.order.productId
        } else if (record.order.productId.toString) {
          productId = record.order.productId.toString()
        }
      }
      
      if (productId) {
        const product = await ProductDb1.findById(productId)
        if (product) {
          productName = product.name
        }
      }
    } catch (err) {
      console.error("Error fetching product for notification:", err)
    }

    // Create notification for user
    await createNotification(
      record.order.userId,
      "order_accepted",
      "Order Accepted",
      `Your order for ${productName} x${record.order.quantity} has been accepted!`,
      record.order._id,
      record.dbKey
    )

    res.json({ message: "Order accepted", order: record.order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Reject order (Admin only)
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const record = await findOrderById(req.params.id)
    
    if (!record) {
      return res.status(404).json({ message: "Order not found" })
    }

    record.order.status = "rejected"
    await record.order.save()
    
    // Manually populate product from db1
    const ProductDb1 = await getProductModel("db1")
    let productName = "your order"
    try {
      // Extract productId - could be ObjectId, string, or populated object
      let productId = null
      if (record.order.productId) {
        if (record.order.productId._id) {
          productId = record.order.productId._id
        } else if (typeof record.order.productId === 'string') {
          productId = record.order.productId
        } else if (record.order.productId.toString) {
          productId = record.order.productId.toString()
        }
      }
      
      if (productId) {
        const product = await ProductDb1.findById(productId)
        if (product) {
          productName = product.name
        }
      }
    } catch (err) {
      console.error("Error fetching product for notification:", err)
    }

    // Create notification for user
    await createNotification(
      record.order.userId,
      "order_rejected",
      "Order Rejected",
      `Your order for ${productName} x${record.order.quantity} has been rejected.`,
      record.order._id,
      record.dbKey
    )

    res.json({ message: "Order rejected", order: record.order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update order status (Admin only)
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body

    if (!["pending", "accepted", "rejected", "served", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const record = await findOrderById(req.params.id)
    
    if (!record) {
      return res.status(404).json({ message: "Order not found" })
    }

    record.order.status = status
    await record.order.save()
    
    // Manually populate product from db1 if we need to create notification
    if (status === "served") {
      const ProductDb1 = await getProductModel("db1")
      let productName = "your order"
      try {
        // Extract productId - could be ObjectId, string, or populated object
        let productId = null
        if (record.order.productId) {
          if (record.order.productId._id) {
            productId = record.order.productId._id
          } else if (typeof record.order.productId === 'string') {
            productId = record.order.productId
          } else if (record.order.productId.toString) {
            productId = record.order.productId.toString()
          }
        }
        
        if (productId) {
          const product = await ProductDb1.findById(productId)
          if (product) {
            productName = product.name
          }
        }
      } catch (err) {
        console.error("Error fetching product for notification:", err)
      }

      // Create notification if status is served
      await createNotification(
        record.order.userId,
        "order_served",
        "Order Ready",
        `Your order for ${productName} x${record.order.quantity} is ready for pickup!`,
        record.order._id,
        record.dbKey
      )
    }

    res.json({ message: "Order status updated", order: record.order })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete order (User can delete pending orders)
router.delete("/:id", protect, async (req, res) => {
  try {
    let order = null
    let dbKey = null
    
    // Find order across all databases
    for (const key of ["db1", "db2", "db3"]) {
      const Order = await getOrderModel(key)
      order = await Order.findById(req.params.id)
      if (order) {
        dbKey = key
        break
      }
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Only user who created order or admin can delete
    if (order.userId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    // Users can only delete pending orders
    if (req.user.role !== "admin" && order.status !== "pending") {
      return res.status(400).json({ message: "Only pending orders can be deleted" })
    }

    const Order = await getOrderModel(dbKey)
    await Order.findByIdAndDelete(req.params.id)
    
    res.json({ message: "Order deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
