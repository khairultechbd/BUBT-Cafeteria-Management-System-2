import express from "express"
import jwt from "jsonwebtoken"
import { getDatabaseForUser, getConnection } from "../config/dbManager.js"
import { getUserModel, queryAllDatabases } from "../utils/modelFactory.js"
import { userSchema } from "../models/schemas.js"

const router = express.Router()

// Generate JWT token (include dbKey for future reference)
const generateToken = (id, role, dbKey = "db1") => {
  return jwt.sign({ id, role, dbKey }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  })
}

// Search user across all databases
const findUserAcrossDatabases = async (email) => {
  for (const dbKey of ["db1", "db2", "db3"]) {
    try {
      const User = await getUserModel(dbKey)
      const user = await User.findOne({ email })
      if (user) {
        return { user, dbKey }
      }
    } catch (error) {
      console.error(`Error searching in ${dbKey}:`, error.message)
    }
  }
  return null
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, department, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if user exists across all databases
    const existing = await findUserAcrossDatabases(email)
    if (existing) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Determine which database to use based on user data
    // Use role from request or default to "user"
    const userRole = role || "user"
    const userData = { email, department, role: userRole }
    const dbKey = getDatabaseForUser(userData)
    
    // Get the User model for the selected database
    const User = await getUserModel(dbKey)

    // Create new user (status = pending by default)
    // Note: Regular signups always create "user" role, admins must be created manually or approved
    const user = new User({
      name,
      email,
      password,
      role: userRole === "admin" ? "admin" : "user", // Allow admin role if provided
      status: "pending",
      department: department || "General",
    })

    await user.save()

    res.status(201).json({
      message: "User registered successfully. Awaiting admin approval.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        department: user.department,
        dbKey, // Include which database was used
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" })
    }

    // Find user across all databases
    const result = await findUserAcrossDatabases(email)
    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const { user, dbKey } = result

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Check if user is approved
    if (user.status !== "active") {
      return res.status(403).json({
        message: `Your account is ${user.status}. Please wait for admin approval.`,
      })
    }

    // Generate token with dbKey
    const token = generateToken(user._id, user.role, dbKey)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dbKey,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
