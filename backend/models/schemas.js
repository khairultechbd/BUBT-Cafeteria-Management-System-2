import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// User Schema (shared across all databases)
export const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "staff", "user"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },
    department: {
      type: String,
      default: "General",
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Product Schema
export const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "Food",
    },
    timeCategory: {
      type: String,
      enum: ["morning", "day", "evening"],
      required: true,
    },
    image: {
      type: String,
      default: "/placeholder.svg",
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

// Order Schema
export const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "served", "completed"],
      default: "pending",
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    // Food snapshot fields - using required field names (price, image, category)
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    foodName: {
      type: String,
    },
    price: {
      type: Number,
    },
    image: {
      type: String,
    },
    category: {
      type: String,
    },
    timeSlot: {
      type: String,
      enum: ["morning", "day", "evening"],
    },
    tableNumber: {
      type: String,
    },
    roomNumber: {
      type: String,
    },
    orderTime: {
      type: Date,
      default: Date.now,
    },
    // Keep old field names for backward compatibility
    foodPrice: {
      type: Number,
    },
    foodImage: {
      type: String,
    },
    foodCategory: {
      type: String,
    },
  },
  { timestamps: true },
)

// Notification Schema
export const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    type: {
      type: String,
      enum: ["order_placed", "order_accepted", "order_rejected", "order_served"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

