// app/models/GiftCard.js

import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    // ==========================================================
    // SHOP
    // ==========================================================

    shop: {
      type: String,
      required: true,
      index: true,
    },

    // ==========================================================
    // SHOPIFY GIFT CARD ID
    // ==========================================================

    shopifyId: {
      type: String,
      required: true,
    },

    // ==========================================================
    // GIFT CARD CODE
    // ==========================================================

    // Shopify only returns the complete code when creating
    // the gift card. For synced cards we mainly store the
    // last characters for security.
    code: {
      type: String,
      default: "",
    },

    lastCharacters: {
      type: String,
      default: "",
    },

    // ==========================================================
    // BALANCE
    // ==========================================================

    initialValue: {
      type: Number,
      default: 0,
    },

    currentBalance: {
      type: Number,
      default: 0,
    },

    currencyCode: {
      type: String,
      default: "",
    },

    // ==========================================================
    // STATUS
    // ==========================================================

    enabled: {
      type: Boolean,
      default: true,
    },

    // ==========================================================
    // CUSTOMER
    // ==========================================================

    customerId: {
      type: String,
      default: "",
    },

    customerName: {
      type: String,
      default: "",
    },

    customerEmail: {
      type: String,
      default: "",
    },

    // ==========================================================
    // GIFT CARD DETAILS
    // ==========================================================

    note: {
      type: String,
      default: "",
    },

    expiresOn: {
      type: Date,
      default: null,
    },

    // ==========================================================
    // TEMPLATE
    // ==========================================================

    templateSuffix: {
      type: String,
      default: "",
    },

    // ==========================================================
    // SHOPIFY DATES
    // ==========================================================

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


// ============================================================
// UNIQUE INDEX
// ============================================================

giftCardSchema.index(
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

const GiftCard =
  mongoose.models.GiftCard ||
  mongoose.model("GiftCard", giftCardSchema);

export default GiftCard;