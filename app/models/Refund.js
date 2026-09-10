import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
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

        note: {
            type: String,
            default: "",
        },

        totalRefunded: {
            type: String,
            default: "0.00",
        },

        currencyCode: {
            type: String,
            default: "",
        },

        refundLineItems: [
            {
                id: {
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

                quantity: {
                    type: Number,
                    default: 0,
                },

                restockType: {
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

                subtotal: {
                    type: String,
                    default: "0.00",
                },

                totalTax: {
                    type: String,
                    default: "0.00",
                },
            },
        ],

        transactions: [
            {
                id: {
                    type: String,
                    default: "",
                },

                kind: {
                    type: String,
                    default: "",
                },

                status: {
                    type: String,
                    default: "",
                },

                gateway: {
                    type: String,
                    default: "",
                },

                amount: {
                    type: String,
                    default: "0.00",
                },

                currencyCode: {
                    type: String,
                    default: "",
                },

                processedAt: {
                    type: Date,
                    default: null,
                },
            },
        ],

        shippingRefund: {
            amount: {
                type: String,
                default: "0.00",
            },

            currencyCode: {
                type: String,
                default: "",
            },
        },

        duties: [
            {
                id: {
                    type: String,
                    default: "",
                },

                amount: {
                    type: String,
                    default: "0.00",
                },

                currencyCode: {
                    type: String,
                    default: "",
                },
            },
        ],

        notifyCustomer: {
            type: Boolean,
            default: false,
        },

        processedAt: {
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

refundSchema.index(
    {
        shop: 1,
        shopifyId: 1,
    },
    {
        unique: true,
    }
);

const Refund =
    mongoose.models.Refund ||
    mongoose.model("Refund", refundSchema);

export default Refund;