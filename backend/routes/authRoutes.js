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
    const { name, email, password, department, role, studentId } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Validate role if provided
    const validRoles = ["student", "teacher", "admin", "staff", "user"]
    const userRole = role || "user"
    if (role && !validRoles.includes(userRole.toLowerCase())) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(", ")}` })
    }

    // If role is student, require studentId
    if (userRole.toLowerCase() === "student") {
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required for students" })
      }

      // Check if studentId already exists across all databases
      for (const dbKey of ["db1", "db2", "db3"]) {
        try {
          const User = await getUserModel(dbKey)
          const existingStudent = await User.findOne({ studentId })
          if (existingStudent) {
            return res.status(400).json({ message: "Student ID already exists. Cannot create multiple accounts with the same ID." })
          }
        } catch (error) {
          console.error(`Error checking studentId in ${dbKey}:`, error.message)
        }
      }
    }

    // Check if user exists across all databases
    const existing = await findUserAcrossDatabases(email)
    if (existing) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Determine which database to use based on user data
    const userData = { email, department, role: userRole.toLowerCase() }
    const dbKey = getDatabaseForUser(userData)
    
    // Get the User model for the selected database
    const User = await getUserModel(dbKey)

    // Auto-approve students, keep others pending
    const initialStatus = userRole.toLowerCase() === "student" ? "active" : "pending"

    // Create new user
    const userDataToSave = {
      name,
      email,
      password,
      role: userRole.toLowerCase(),
      status: initialStatus,
      department: department || "General",
    }

    // Add studentId only if role is student
    if (userRole.toLowerCase() === "student" && studentId) {
      userDataToSave.studentId = studentId
    }

    const user = new User(userDataToSave)

    await user.save()

    // Log with collection name
    const collectionName = dbKey === "db1" ? "User_Frag1" : dbKey === "db2" ? "User_Frag2" : "User_Frag3"
    console.log(`[UserCreation] ✅ Created user ${email} with role ${userRole} in ${dbKey} → Collection: ${collectionName} (Status: ${initialStatus})`)

    // Generate token for students (auto-login)
    let token = null
    if (initialStatus === "active") {
      token = generateToken(user._id, user.role, dbKey)
    }

    res.status(201).json({
      message: initialStatus === "active" 
        ? "Signup successful! You can login now" 
        : "Signup successful! Pending admin approval",
      success: true,
      autoLogin: initialStatus === "active",
      token, // Include token for students
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        dbKey, // Include which database was used
      },
    })
  } catch (error) {
    console.error(`[UserCreation] Error creating user:`, error.message)
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
