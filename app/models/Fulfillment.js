import mongoose from "mongoose";

const fulfillmentSchema = new mongoose.Schema(
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

        displayStatus: {
            type: String,
            default: "",
        },

        totalQuantity: {
            type: Number,
            default: 0,
        },

        locationId: {
            type: String,
            default: "",
        },

        locationName: {
            type: String,
            default: "",
        },

        trackingInfo: [
            {
                company: {
                    type: String,
                    default: "",
                },

                number: {
                    type: String,
                    default: "",
                },

                url: {
                    type: String,
                    default: "",
                },
            },
        ],

        lineItems: [
            {
                id: {
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

                fulfillmentOrderId: {
                    type: String,
                    default: "",
                },

                fulfillmentOrderLineItemId: {
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

        deliveredAt: {
            type: Date,
            default: null,
        },

        estimatedDeliveryAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

fulfillmentSchema.index(
    {
        shop: 1,
        shopifyId: 1,
    },
    {
        unique: true,
    },
);

const Fulfillment =
    mongoose.models.Fulfillment ||
    mongoose.model(
        "Fulfillment",
        fulfillmentSchema,
    );

export default Fulfillment;