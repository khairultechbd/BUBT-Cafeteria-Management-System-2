import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads")
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer storage configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, uploadsDir)
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname)
		const base = path.basename(file.originalname, ext).replace(/\s+/g, "_")
		const timestamp = Date.now()
		cb(null, `${base}_${timestamp}${ext}`)
	},
})

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (req, file, cb) => {
		// Basic image filter
		if (!file.mimetype.startsWith("image/")) {
			return cb(new Error("Only image uploads are allowed"))
		}
		cb(null, true)
	},
})

// POST /api/upload/image
router.post("/image", protect, upload.single("image"), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" })
		}
		// Return public URL served by server.js static middleware
		const urlPath = `/uploads/${req.file.filename}`
		return res.status(200).json({ success: true, url: urlPath, filename: req.file.filename })
	} catch (error) {
		return res.status(500).json({ message: error.message })
	}
})

export default router


