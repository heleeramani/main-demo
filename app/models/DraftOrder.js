import mongoose from "mongoose";

const draftOrderSchema = new mongoose.Schema(
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

        status: {
            type: String,
            default: "OPEN",
        },

        email: {
            type: String,
            default: "",
        },

        customer: {
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

            displayName: {
                type: String,
                default: "",
            },

            email: {
                type: String,
                default: "",
            },
        },

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

                originalUnitPrice: {
                    type: String,
                    default: "0.00",
                },

                sku: {
                    type: String,
                    default: "",
                },

                variantId: {
                    type: String,
                    default: "",
                },

                productId: {
                    type: String,
                    default: "",
                },
            },
        ],

        subtotalPrice: {
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

        currencyCode: {
            type: String,
            default: "",
        },

        shippingAddress: {
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

            countryCode: {
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

        billingAddress: {
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

            countryCode: {
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

        note: {
            type: String,
            default: "",
        },

        tags: [
            {
                type: String,
            },
        ],

        invoiceUrl: {
            type: String,
            default: "",
        },

        completedAt: {
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

draftOrderSchema.index(
    {
        shop: 1,
        shopifyId: 1,
    },
    {
        unique: true,
    }
);

const DraftOrder =
    mongoose.models.DraftOrder ||
    mongoose.model("DraftOrder", draftOrderSchema);

export default DraftOrder;