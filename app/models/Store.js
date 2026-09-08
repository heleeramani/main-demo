import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    shopifyId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    currencyCode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Store =
  mongoose.models.Store ||
  mongoose.model("Store", storeSchema);

export default Store;