import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
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

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    descriptionHtml: {
      type: String,
      default: "",
    },

    handle: {
      type: String,
      default: "",
    },

    // CUSTOM or AUTOMATED
    collectionType: {
      type: String,
      enum: ["CUSTOM", "AUTOMATED"],
      default: "CUSTOM",
    },

    productsCount: {
      type: Number,
      default: 0,
    },

    sortOrder: {
      type: String,
      default: "",
    },

    image: {
      id: {
        type: String,
        default: "",
      },

      url: {
        type: String,
        default: "",
      },

      altText: {
        type: String,
        default: "",
      },
    },

    seo: {
      title: {
        type: String,
        default: "",
      },

      description: {
        type: String,
        default: "",
      },
    },

    templateSuffix: {
      type: String,
      default: "",
    },

    // Products manually selected
    products: [
      {
        shopifyId: {
          type: String,
        },

        title: {
          type: String,
        },

        handle: {
          type: String,
        },
      },
    ],

    // Automated collection conditions
    conditions: [
      {
        field: {
          type: String,
        },

        relation: {
          type: String,
        },

        values: [
          {
            type: String,
          },
        ],

        matchType: {
          type: String,
        },
      },
    ],

    shopifyUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.index(
  {
    shop: 1,
    shopifyId: 1,
  },
  {
    unique: true,
  }
);

const Collection =
  mongoose.models.Collection ||
  mongoose.model(
    "Collection",
    collectionSchema
  );

export default Collection;