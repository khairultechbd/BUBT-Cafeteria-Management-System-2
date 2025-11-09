import express from "express"
import { protect, adminOnly } from "../middleware/authMiddleware.js"
import { getNotificationModel } from "../utils/modelFactory.js"
import { notificationSchema } from "../models/schemas.js"
import { getDatabaseForUser } from "../config/dbManager.js"

const router = express.Router()

// Get user's notifications
router.get("/", protect, async (req, res) => {
  try {
    const dbKey = req.user.dbKey || "db1"
    const Notification = await getNotificationModel(dbKey)
    
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
    
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get unread notifications count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const dbKey = req.user.dbKey || "db1"
    const Notification = await getNotificationModel(dbKey)
    
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    })
    
    res.json({ count })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Mark notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    // For admin, try all databases. For regular users, use their dbKey
    let notification = null
    let foundDbKey = null
    
    if (req.user.role === "admin") {
      // Admin can mark any notification as read - search all databases
      for (const dbKey of ["db1", "db2", "db3"]) {
        try {
          const Notification = await getNotificationModel(dbKey)
          const notif = await Notification.findById(req.params.id)
          if (notif) {
            notification = notif
            foundDbKey = dbKey
            break
          }
        } catch (err) {
          // Continue searching
        }
      }
      
      if (notification) {
        notification.read = true
        await notification.save()
      }
    } else {
      // Regular user - use their dbKey and verify ownership
      const dbKey = req.user.dbKey || "db1"
      const Notification = await getNotificationModel(dbKey)
      
      notification = await Notification.findById(req.params.id)
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" })
      }
      
      // Verify ownership
      if (notification.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" })
      }
      
      notification.read = true
      await notification.save()
    }
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }
    
    res.json({ message: "Notification marked as read", notification: notification.toObject() })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Mark all notifications as read
router.put("/read-all", protect, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      // Admin can mark all notifications as read across all databases
      let totalMarked = 0
      for (const dbKey of ["db1", "db2", "db3"]) {
        try {
          const Notification = await getNotificationModel(dbKey)
          const result = await Notification.updateMany(
            { read: false },
            { read: true }
          )
          totalMarked += result.modifiedCount
        } catch (err) {
          console.error(`Error marking notifications as read in ${dbKey}:`, err)
        }
      }
      res.json({ message: `All notifications marked as read (${totalMarked} notifications)`, count: totalMarked })
    } else {
      // Regular user - only mark their own notifications
      const dbKey = req.user.dbKey || "db1"
      const Notification = await getNotificationModel(dbKey)
      
      const result = await Notification.updateMany(
        { userId: req.user.id, read: false },
        { read: true }
      )
      
      res.json({ message: `All notifications marked as read (${result.modifiedCount} notifications)`, count: result.modifiedCount })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all notifications for admin (across all databases)
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const { queryAllDatabases } = await import("../utils/modelFactory.js")
    const { getProductModel, getUserModel } = await import("../utils/modelFactory.js")
    
    // Get all notifications from all databases
    const allNotifications = []
    
    for (const dbKey of ["db1", "db2", "db3"]) {
      try {
        const Notification = await getNotificationModel(dbKey)
        const notifications = await Notification.find({})
          .sort({ createdAt: -1 })
          .limit(100)
        
        // Add dbKey to each notification for reference
        const notificationsWithDb = notifications.map(n => ({
          ...n.toObject(),
          dbKey,
          id: n._id.toString(),
        }))
        
        allNotifications.push(...notificationsWithDb)
      } catch (err) {
        console.error(`Error querying ${dbKey}:`, err.message)
      }
    }
    
    // Sort all by date
    allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    // Populate order and user details
    const ProductDb1 = await getProductModel("db1")
    const UserDb1 = await getUserModel("db1")
    const UserDb2 = await getUserModel("db2")
    const UserDb3 = await getUserModel("db3")
    
    const enrichedNotifications = await Promise.all(
      allNotifications.map(async (notif) => {
        // Get order details if orderId exists
        let orderDetails = null
        if (notif.orderId) {
          try {
            const { getOrderModel } = await import("../utils/modelFactory.js")
            const Order = await getOrderModel(notif.dbKey)
            const order = await Order.findById(notif.orderId)
            if (order) {
              orderDetails = order.toObject()
              
              // Populate product
              if (order.productId) {
                try {
                  const productId = order.productId._id || order.productId.toString()
                  const product = await ProductDb1.findById(productId)
                  if (product) {
                    orderDetails.productId = product.toObject()
                  }
                } catch (err) {
                  // Product not found
                }
              }
              
              // Populate user
              if (order.userId) {
                try {
                  const userId = order.userId._id || order.userId.toString()
                  let user = await UserDb1.findById(userId)
                  if (!user) user = await UserDb2.findById(userId)
                  if (!user) user = await UserDb3.findById(userId)
                  if (user) {
                    const userObj = user.toObject()
                    delete userObj.password
                    orderDetails.userId = userObj
                  }
                } catch (err) {
                  // User not found
                }
              }
            }
          } catch (err) {
            console.error("Error fetching order:", err)
          }
        }
        
        return {
          ...notif,
          order: orderDetails,
        }
      })
    )
    
    res.json(enrichedNotifications)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router

