import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // Shopify store domain
    shop: {
      type: String,
      required: true,
      index: true,
    },

    // Shopify Customer GraphQL ID
    shopifyId: {
      type: String,
      required: true,
    },

    // Customer basic information
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

    // Customer state
    state: {
      type: String,
      default: "",
    },

    // Customer tags
    tags: [
      {
        type: String,
      },
    ],

    // Customer note
    note: {
      type: String,
      default: "",
    },

    // Default address
    defaultAddress: {
      id: {
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

      company: {
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

    // Email marketing status
    emailMarketingConsent: {
      state: {
        type: String,
        default: "",
      },

      marketingOptInLevel: {
        type: String,
        default: "",
      },

      consentUpdatedAt: {
        type: Date,
        default: null,
      },
    },

    // SMS marketing status
    smsMarketingConsent: {
      marketingState: {
        type: String,
        default: "",
      },

      consentUpdatedAt: {
        type: Date,
        default: null,
      },
    },

    // Shopify timestamps
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

// One customer can exist only once per Shopify store.
customerSchema.index(
  {
    shop: 1,
    shopifyId: 1,
  },
  {
    unique: true,
  }
);

const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);

export default Customer;