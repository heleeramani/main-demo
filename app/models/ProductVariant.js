import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },

    shopifyId: {
      type: String,
      required: true,
    },

    productShopifyId: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
    },

    price: {
      type: String,
      default: "0.00",
    },

    compareAtPrice: {
      type: String,
      default: null,
    },

    sku: {
      type: String,
      default: "",
    },

    barcode: {
      type: String,
      default: "",
    },

    inventoryQuantity: {
      type: Number,
      default: 0,
    },

    availableForSale: {
      type: Boolean,
      default: false,
    },

    selectedOptions: [
      {
        name: String,
        value: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

productVariantSchema.index(
  { shop: 1, shopifyId: 1 },
  { unique: true }
);

const ProductVariant =
  mongoose.models.ProductVariant ||
  mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;