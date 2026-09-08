import mongoose from "mongoose";


// ============================================================
// ORDER SCHEMA
// ============================================================

const orderSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------------
    // SHOP
    // ----------------------------------------------------------

    shop: {
      type: String,
      required: true,
      index: true,
    },


    // ----------------------------------------------------------
    // SHOPIFY ORDER ID
    // ----------------------------------------------------------

    shopifyId: {
      type: String,
      required: true,
    },


    // ----------------------------------------------------------
    // ORDER NAME
    // Example: #1001
    // ----------------------------------------------------------

    name: {
      type: String,
      default: "",
    },


    // ----------------------------------------------------------
    // ORDER NUMBER
    // Example: 1001
    // ----------------------------------------------------------

    orderNumber: {
      type: String,
      default: "",
    },


    // ----------------------------------------------------------
    // ORDER NOTE
    // ----------------------------------------------------------

    note: {
      type: String,
      default: "",
    },


    // ----------------------------------------------------------
    // ORDER TAGS
    // ----------------------------------------------------------

    tags: [
      {
        type: String,
      },
    ],


    // ----------------------------------------------------------
    // CUSTOMER
    // ----------------------------------------------------------

    customer: {
      shopifyId: {
        type: String,
        default: "",
      },

      firstName: {
        type: String,
        default: "",
      },

      lastName: {
        type: String,
        default: "",
      },

      displayName: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },
    },


    // ----------------------------------------------------------
    // FINANCIAL STATUS
    // ----------------------------------------------------------

    financialStatus: {
      type: String,
      default: "",
    },


    // ----------------------------------------------------------
    // FULFILLMENT STATUS
    // ----------------------------------------------------------

    fulfillmentStatus: {
      type: String,
      default: "",
    },


    // ----------------------------------------------------------
    // CURRENCY
    // ----------------------------------------------------------

    currencyCode: {
      type: String,
      default: "",
    },


    // ----------------------------------------------------------
    // PRICES
    // ----------------------------------------------------------

    subtotalPrice: {
      type: String,
      default: "0.00",
    },

    totalShipping: {
      type: String,
      default: "0.00",
    },

    totalTax: {
      type: String,
      default: "0.00",
    },

    totalPrice: {
      type: String,
      default: "0.00",
    },


    // ----------------------------------------------------------
    // LINE ITEMS
    // ----------------------------------------------------------

    lineItems: [
      {
        shopifyId: {
          type: String,
          default: "",
        },

        title: {
          type: String,
          default: "",
        },

        quantity: {
          type: Number,
          default: 0,
        },

        sku: {
          type: String,
          default: "",
        },

        variantId: {
          type: String,
          default: "",
        },

        variantTitle: {
          type: String,
          default: "",
        },

        productId: {
          type: String,
          default: "",
        },

        vendor: {
          type: String,
          default: "",
        },

        unitPrice: {
          type: String,
          default: "0.00",
        },

        originalTotal: {
          type: String,
          default: "0.00",
        },
      },
    ],


    // ----------------------------------------------------------
    // SHIPPING ADDRESS
    // ----------------------------------------------------------

    shippingAddress: {
      firstName: {
        type: String,
        default: "",
      },

      lastName: {
        type: String,
        default: "",
      },

      address1: {
        type: String,
        default: "",
      },

      address2: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      province: {
        type: String,
        default: "",
      },

      country: {
        type: String,
        default: "",
      },

      zip: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },
    },


    // ----------------------------------------------------------
    // SHOPIFY DATES
    // ----------------------------------------------------------

    shopifyCreatedAt: {
      type: Date,
      default: null,
    },

    shopifyUpdatedAt: {
      type: Date,
      default: null,
    },


    // ----------------------------------------------------------
    // CANCELLATION
    // ----------------------------------------------------------

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },
  },

  {
    timestamps: true,
  }
);


// ============================================================
// UNIQUE ORDER PER SHOP
// ============================================================

orderSchema.index(
  {
    shop: 1,
    shopifyId: 1,
  },
  {
    unique: true,
  }
);


// ============================================================
// MODEL
// ============================================================

const Order =
  mongoose.models.Order ||
  mongoose.model(
    "Order",
    orderSchema
  );

export default Order;