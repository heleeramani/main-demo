import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },

    shopifyId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    vendor: {
      type: String,
      default: "",
    },

    productType: {
      type: String,
      default: "",
    },

    handle: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "",
    },

    images: [
      {
        id: String,
        url: String,
        altText: String,
      },
    ],

    // variants: [
    //   {
    //     shopifyId: String,
    //     title: String,
    //     price: String,
    //     sku: String,
    //     inventoryQuantity: Number,
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;