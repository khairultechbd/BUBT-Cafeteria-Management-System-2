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

// Use guard to prevent model overwrite, and bind to explicit collection name
const ProductModel =
	mongoose.models.Product || mongoose.model("Product", productSchema, "foods")

export default ProductModel
