import mongoose from "mongoose";


// ============================================================
// INVENTORY TRANSFER SCHEMA
// ============================================================

const inventoryTransferSchema =
    new mongoose.Schema(
        {
            // --------------------------------------------------------
            // Shopify shop domain
            // --------------------------------------------------------

            shop: {
                type: String,
                required: true,
                index: true,
            },


            // --------------------------------------------------------
            // Shopify Inventory Transfer ID
            // --------------------------------------------------------

            shopifyId: {
                type: String,
                required: true,
            },


            // --------------------------------------------------------
            // Transfer status
            //
            // Transfers move stock immediately (source and
            // destination are adjusted atomically), so this is
            // always "COMPLETED" once saved.
            // --------------------------------------------------------

            status: {
                type: String,
                default: "COMPLETED",
            },


            // --------------------------------------------------------
            // Origin location
            // --------------------------------------------------------

            originLocationId: {
                type: String,
                required: true,
            },

            originLocationName: {
                type: String,
                default: "",
            },


            // --------------------------------------------------------
            // Destination location
            // --------------------------------------------------------

            destinationLocationId: {
                type: String,
                required: true,
            },

            destinationLocationName: {
                type: String,
                default: "",
            },


            // --------------------------------------------------------
            // Transfer line items
            // --------------------------------------------------------

            lineItems: [
                {
                    inventoryItemId: {
                        type: String,
                        required: true,
                    },

                    quantity: {
                        type: Number,
                        required: true,
                    },
                },
            ],


            // --------------------------------------------------------
            // Transfer note
            // --------------------------------------------------------

            note: {
                type: String,
                default: "",
            },


            // --------------------------------------------------------
            // Shopify reference name
            // --------------------------------------------------------

            referenceName: {
                type: String,
                default: "",
            },


            // --------------------------------------------------------
            // Shopify creation date
            // --------------------------------------------------------

            shopifyCreatedAt: {
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

inventoryTransferSchema.index(
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

const InventoryTransfer =
    mongoose.models.InventoryTransfer ||
    mongoose.model(
        "InventoryTransfer",
        inventoryTransferSchema
    );

export default InventoryTransfer;