import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
    {
        // Shopify store
        shop: {
            type: String,
            required: true,
            index: true,
        },

        // Shopify Inventory Item ID
        inventoryItemId: {
            type: String,
            required: true,
        },

        // Shopify Product Variant ID
        variantId: {
            type: String,
            required: true,
            index: true,
        },

        // Product ID
        productId: {
            type: String,
            default: "",
            index: true,
        },

        // Variant SKU
        sku: {
            type: String,
            default: "",
        },

        // Shopify Location ID
        locationId: {
            type: String,
            required: true,
            index: true,
        },

        // Location name
        locationName: {
            type: String,
            default: "",
        },

        // Inventory Level ID
        inventoryLevelId: {
            type: String,
            default: "",
        },

        // Available inventory
        available: {
            type: Number,
            default: 0,
        },

        // On-hand inventory
        onHand: {
            type: Number,
            default: 0,
        },

        // Incoming inventory
        incoming: {
            type: Number,
            default: 0,
        },

        // Committed inventory
        committed: {
            type: Number,
            default: 0,
        },

        // Damaged inventory
        damaged: {
            type: Number,
            default: 0,
        },

        // Inventory tracking enabled
        tracked: {
            type: Boolean,
            default: true,
        },

        // Shopify updated timestamp
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
// UNIQUE INVENTORY LEVEL
// ============================================================
// One inventory item can have one inventory level
// per location.
//
// Example:
//
// Inventory Item A + Location A
// Inventory Item A + Location B
// ============================================================

inventorySchema.index(
    {
        shop: 1,
        inventoryItemId: 1,
        locationId: 1,
    },
    {
        unique: true,
    }
);


const Inventory =
    mongoose.models.Inventory ||
    mongoose.model(
        "Inventory",
        inventorySchema
    );

export default Inventory;