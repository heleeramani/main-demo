import mongoose from "mongoose";

const metaobjectDefinitionSchema = new mongoose.Schema(
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

    name: { 
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    fieldDefinitions: [
      {
        key: {
          type: String,
          required: true,
        },

        name: {
          type: String,
          default: "",
        },

        type: {
          type: String,
          default: "",
        },
      },
    ],

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

metaobjectDefinitionSchema.index(
  {
    shop: 1,
    shopifyId: 1,
  },
  {
    unique: true,
  },
);

const MetaobjectDefinition =
  mongoose.models.MetaobjectDefinition ||
  mongoose.model(
    "MetaobjectDefinition",
    metaobjectDefinitionSchema,
  );

export default MetaobjectDefinition;