import mongoose from "mongoose";

const returnLineItemSchema = new mongoose.Schema(
    {
        shopifyId: {
            type: String,
            required: true,
        },

        fulfillmentLineItemId: {
            type: String,
            default: "",
        },

        lineItemId: {
            type: String,
            default: "",
        },

        title: {
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

        sku: {
            type: String,
            default: "",
        },

        quantity: {
            type: Number,
            default: 0,
        },

        processableQuantity: {
            type: Number,
            default: 0,
        },

        processedQuantity: {
            type: Number,
            default: 0,
        },

        refundableQuantity: {
            type: Number,
            default: 0,
        },

        refundedQuantity: {
            type: Number,
            default: 0,
        },

        returnReason: {
            type: String,
            default: "",
        },

        returnReasonNote: {
            type: String,
            default: "",
        },

        customerNote: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

const reverseFulfillmentOrderSchema = new mongoose.Schema(
    {
        shopifyId: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            default: "",
        },

        locationId: {
            type: String,
            default: "",
        },

        locationName: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

const returnSchema = new mongoose.Schema(
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
            default: "",
        },

        orderId: {
            type: String,
            required: true,
            index: true,
        },

        orderName: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            default: "",
        },

        totalQuantity: {
            type: Number,
            default: 0,
        },

        returnLineItems: {
            type: [returnLineItemSchema],
            default: [],
        },

        reverseFulfillmentOrders: {
            type: [reverseFulfillmentOrderSchema],
            default: [],
        },

        requestedAt: {
            type: Date,
            default: null,
        },

        closedAt: {
            type: Date,
            default: null,
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
    }
);

returnSchema.index(
    { shop: 1, shopifyId: 1 },
    { unique: true }
);

const Return =
    mongoose.models.Return ||
    mongoose.model("Return", returnSchema);

export default Return;