import mongoose from "mongoose";

const metafieldSchema = new mongoose.Schema(
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

    ownerId: {
      type: String,
      required: true,
      index: true,
    },

    ownerType: {
      type: String,
      required: true,
      index: true,
    },

    namespace: {
      type: String,
      required: true,
    },

    key: {
      type: String,
      required: true,
    },

    value: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      default: "",
    },

    jsonValue: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    definitionId: {
      type: String,
      default: "",
    },

    definitionName: {
      type: String,
      default: "",
    },

    createdAtShopify: {
      type: Date,
      default: null,
    },

    updatedAtShopify: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// One metafield is unique per:
// shop + owner + namespace + key
metafieldSchema.index(
  {
    shop: 1,
    ownerId: 1,
    namespace: 1,
    key: 1,
  },
  {
    unique: true,
  },
);

const Metafield =
  mongoose.models.Metafield ||
  mongoose.model(
    "Metafield",
    metafieldSchema,
  );

export default Metafield;