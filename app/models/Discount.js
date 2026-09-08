import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
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

    code: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "",
    },

    startsAt: {
      type: Date,
      default: null,
    },

    endsAt: {
      type: Date,
      default: null,
    },

    usageLimit: {
      type: Number,
      default: null,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    discountType: {
      type: String,
      default: "",
    },

    percentage: {
      type: Number,
      default: null,
    },

    fixedAmount: {
      type: String,
      default: null,
    },

    minimumRequirement: {
      type: String,
      default: "",
    },

    customerSelection: {
      type: String,
      default: "",
    },

    appliesOncePerCustomer: {
      type: Boolean,
      default: false,
    },

    combinesWith: {
      orderDiscounts: {
        type: Boolean,
        default: false,
      },

      productDiscounts: {
        type: Boolean,
        default: false,
      },

      shippingDiscounts: {
        type: Boolean,
        default: false,
      },
    },

    shopifyCreatedAt: {
      type: Date,
      default: null,
    },

    shopifyUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One discount code must be unique per shop.
discountSchema.index(
  {
    shop: 1,
    shopifyId: 1,
  },
  {
    unique: true,
  }
);

const Discount =
  mongoose.models.Discount ||
  mongoose.model("Discount", discountSchema);

export default Discount;