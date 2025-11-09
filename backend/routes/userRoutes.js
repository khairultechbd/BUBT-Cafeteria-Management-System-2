import express from "express"
import { protect, adminOnly } from "../middleware/authMiddleware.js"
import { getUserModel, queryAllDatabases } from "../utils/modelFactory.js"
import { userSchema } from "../models/schemas.js"

const router = express.Router()

const DB_KEYS = ["db1", "db2", "db3"]

const serializeUser = (user, dbKey) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  department: user.department,
  dbKey: dbKey || user._sourceDb,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const findUserById = async (id) => {
  for (const dbKey of DB_KEYS) {
    try {
      const User = await getUserModel(dbKey)
      const user = await User.findById(id)
      if (user) {
        return { user, dbKey }
      }
    } catch (error) {
      console.error(`Error finding user in ${dbKey}:`, error.message)
    }
  }
  return null
}

// Get all users (Admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await queryAllDatabases(
      "User",
      async (Model) => Model.find().select("-password"),
      userSchema,
    )
    res.json(users.map((user) => serializeUser(user, user._sourceDb)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get pending users (Admin only)
router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const users = await queryAllDatabases(
      "User",
      async (Model) => Model.find({ status: "pending" }).select("-password"),
      userSchema,
    )
    res.json(users.map((user) => serializeUser(user, user._sourceDb)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user profile (Current user)
router.get("/profile", protect, async (req, res) => {
  try {
    let dbKey = req.user.dbKey || "db1"
    let User = await getUserModel(dbKey)
    let user = await User.findById(req.user.id).select("-password")

    if (!user) {
      const record = await findUserById(req.user.id)
      if (!record) {
        return res.status(404).json({ message: "User not found" })
      }
      user = record.user
      dbKey = record.dbKey
    }

    res.json(serializeUser(user, dbKey))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user profile (Current user)
router.put("/profile", protect, async (req, res) => {
  try {
    const dbKey = req.user.dbKey || "db1"
    const User = await getUserModel(dbKey)
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const { name, email, password } = req.body

    if (name) user.name = name
    if (email) user.email = email
    if (password) user.password = password

    await user.save()

    res.json({
      message: "Profile updated successfully",
      user: serializeUser(user, dbKey),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Approve user (Admin only)
router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const record = await findUserById(req.params.id)
    if (!record) {
      return res.status(404).json({ message: "User not found" })
    }

    record.user.status = "active"
    await record.user.save()

    res.json({ message: "User approved", user: serializeUser(record.user, record.dbKey) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Reject user (Admin only)
router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const record = await findUserById(req.params.id)
    if (!record) {
      return res.status(404).json({ message: "User not found" })
    }

    record.user.status = "rejected"
    await record.user.save()

    res.json({ message: "User rejected", user: serializeUser(record.user, record.dbKey) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
