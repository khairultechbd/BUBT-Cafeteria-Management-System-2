import mongoose from "mongoose"

const orderSchema = new mongoose.Schema(
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
      enum: ["pending", "accepted", "served", "completed"],
      default: "pending",
    },
    totalPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
)

export default mongoose.model("Order", orderSchema)
