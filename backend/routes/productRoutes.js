import express from "express"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { protect, adminOnly } from "../middleware/authMiddleware.js"
import { getProductModel, queryAllDatabases } from "../utils/modelFactory.js"
import { productSchema } from "../models/schemas.js"
import { getDatabaseForMenu } from "../config/dbManager.js"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../server/uploads")
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `food-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"), false)
    }
  },
})

// Get all products (Public) - query all databases
router.get("/", async (req, res) => {
  try {
    const { timeCategory } = req.query
    
    const products = await queryAllDatabases(
      "Product",
      async (Model) => {
        const query = timeCategory ? { timeCategory, available: true } : { available: true }
        return Model.find(query)
      },
      productSchema,
    )
    
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get products by time category
router.get("/time/:timeCategory", async (req, res) => {
  try {
    const { timeCategory } = req.params
    
    if (!["morning", "day", "evening"].includes(timeCategory)) {
      return res.status(400).json({ message: "Invalid time category" })
    }
    
    const products = await queryAllDatabases(
      "Product",
      async (Model) => Model.find({ timeCategory, available: true }),
      productSchema,
    )
    
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get single product
router.get("/:id", async (req, res) => {
  try {
    let product = null
    
    // Search across all databases
    for (const dbKey of ["db1", "db2", "db3"]) {
      const Product = await getProductModel(dbKey)
      product = await Product.findById(req.params.id)
      if (product) break
    }
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create product (Admin only) - fragmented by timeCategory
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description, price, category, timeCategory, image } = req.body

    // Validate required fields
    if (!name || !price || !timeCategory) {
      return res.status(400).json({ message: "Name, price, and timeCategory are required" })
    }

    if (!["morning", "day", "evening"].includes(timeCategory)) {
      return res.status(400).json({ message: "timeCategory must be: morning, day, or evening" })
    }

    // Determine target database based on timeCategory
    let dbKey
    try {
      dbKey = getDatabaseForMenu(timeCategory)
      if (!dbKey) {
        throw new Error(`No database found for timeCategory=${timeCategory}`)
      }
    } catch (err) {
      console.error(`[FoodFragmentation] Error determining database:`, err.message)
      return res.status(500).json({ message: "Add food failed", error: err.message })
    }

    // Get product model for the correct database
    let Product
    try {
      Product = await getProductModel(dbKey)
    } catch (err) {
      console.error(`[FoodFragmentation] Error connecting to database ${dbKey}:`, err.message)
      return res.status(500).json({ message: "Add food failed", error: `Database connection error: ${err.message}` })
    }
    
    const product = new Product({
      name,
      description,
      price,
      category: category || "Food",
      timeCategory,
      image: image || "/placeholder.svg",
      available: true,
    })

    await product.save()
    
    // Log successful insertion with collection name
    const collectionName = dbKey === "db1" ? "Menu_Frag1" : dbKey === "db2" ? "Menu_Frag2" : "Menu_Frag3"
    console.log(`[FoodFragmentation] ✅ Inserting ${name} (timeCategory: ${timeCategory}) into ${dbKey} → Collection: ${collectionName}`)
    
    res.status(201).json({ 
      message: "Food item created successfully!", 
      success: true,
      data: product 
    })
  } catch (error) {
    console.error(`[FoodFragmentation] Error creating product:`, error.message)
    res.status(500).json({ message: "Add food failed", error: error.message })
  }
})

// Update product (Admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    let product = null
    let dbKey = null
    
    // Find product across all databases
    for (const key of ["db1", "db2", "db3"]) {
      const Product = await getProductModel(key)
      product = await Product.findById(req.params.id)
      if (product) {
        dbKey = key
        break
      }
    }
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    
    // Update product
    Object.assign(product, req.body)
    await product.save()
    
    res.json({ message: "Product updated", product })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Image upload endpoint (Admin only)
router.post("/upload", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" })
    }

    // Return the local file path URL
    const imageUrl = `/uploads/${req.file.filename}`
    
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
    })
  } catch (error) {
    console.error("Image upload error:", error)
    res.status(500).json({ message: error.message || "Image upload failed" })
  }
})

// Delete product (Admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    let deleted = false
    
    // Try to delete from all databases
    for (const dbKey of ["db1", "db2", "db3"]) {
      const Product = await getProductModel(dbKey)
      const result = await Product.findByIdAndDelete(req.params.id)
      if (result) {
        deleted = true
        break
      }
    }
    
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" })
    }
    
    res.json({ message: "Product deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
