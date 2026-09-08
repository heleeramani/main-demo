import mongoose from "mongoose";

const metaobjectSchema = new mongoose.Schema(
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

    definitionId: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      required: true,
      index: true,
    },

    handle: {
      type: String,
      default: "",
    },

    displayName: {
      type: String,
      default: "",
    },

    productId: {
      type: String,
      default: "",
      index: true,
    },

    productTitle: {
      type: String,
      default: "",
    },

    referenceNamespace: {
      type: String,
      default: "",
    },

    referenceKey: {
      type: String,
      default: "",
    },

    fields: [
      {
        key: {
          type: String,
          required: true,
        },

        value: {
          type: String,
          default: "",
        },

        jsonValue: {
          type: String,
          default: "",
        },

        type: {
          type: String,
          default: "",
        },
      },
    ],

    capabilities: {
      publishable: {
        status: {
          type: String,
          default: "",
        },
      },
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

metaobjectSchema.index(
  {
    shop: 1,
    shopifyId: 1,
  },
  {
    unique: true,
  },
);

const Metaobject =
  mongoose.models.Metaobject || mongoose.model("Metaobject", metaobjectSchema);

export default Metaobject;