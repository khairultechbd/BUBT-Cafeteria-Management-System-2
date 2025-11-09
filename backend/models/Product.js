import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
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

export default mongoose.model("Product", productSchema)
