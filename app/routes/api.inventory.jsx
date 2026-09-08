import { authenticate } from "../shopify.server";

import {
    syncInventory,
    getInventoryLocations,
    getVariantInventoryById,
    increaseInventory,
    decreaseInventory,
    transferInventory,
} from "../controllers/inventory.controller";


// ============================================================
// GET /api/inventory
// ============================================================
//
// GET /api/inventory
//     → Sync inventory
//
// GET /api/inventory?type=locations
//     → Get locations
//
// GET /api/inventory?variantId=...
//     → Get variant inventory
//
// ============================================================

export async function loader({
    request,
}) {
    try {

        const {
            admin,
            session,
        } =
            await authenticate.admin(
                request
            );


        const url =
            new URL(
                request.url
            );


        const type =
            url.searchParams.get(
                "type"
            );


        const variantId =
            url.searchParams.get(
                "variantId"
            );


        // ========================================================
        // LOCATIONS
        // ========================================================

        if (
            type === "locations"
        ) {
            return getInventoryLocations({
                admin,
            });
        }


        // ========================================================
        // VARIANT INVENTORY
        // ========================================================

        if (variantId) {
            return getVariantInventoryById({
                admin,
                session,
                variantId,
            });
        }


        // ========================================================
        // SYNC INVENTORY
        // ========================================================

        return syncInventory({
            admin,
            session,
        });

    } catch (error) {

        console.error(
            "Inventory GET error:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message,
            },
            {
                status: 500,
            }
        );
    }
}


// ============================================================
// POST /api/inventory
// ============================================================
//
// action:
//
// increase
// decrease
// transfer
//
// ============================================================

export async function action({
    request,
}) {
    try {

        const {
            admin,
            session,
        } =
            await authenticate.admin(
                request
            );


        const data =
            await request.json();


        const actionType =
            data.action;


        // ========================================================
        // INCREASE
        // ========================================================

        if (
            actionType === "increase"
        ) {

            if (
                !data.inventoryItemId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Inventory Item ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !data.locationId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Location ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !Number.isInteger(
                    data.quantity
                ) ||
                data.quantity <= 0
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Quantity must be a positive integer",
                    },
                    {
                        status: 400,
                    }
                );
            }


            return increaseInventory({
                admin,

                session,

                inventoryItemId:
                    data.inventoryItemId,

                locationId:
                    data.locationId,

                quantity:
                    data.quantity,
            });
        }


        // ========================================================
        // DECREASE
        // ========================================================

        if (
            actionType === "decrease"
        ) {

            if (
                !data.inventoryItemId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Inventory Item ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !data.locationId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Location ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !Number.isInteger(
                    data.quantity
                ) ||
                data.quantity <= 0
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Quantity must be a positive integer",
                    },
                    {
                        status: 400,
                    }
                );
            }


            return decreaseInventory({
                admin,

                session,

                inventoryItemId:
                    data.inventoryItemId,

                locationId:
                    data.locationId,

                quantity:
                    data.quantity,
            });
        }


        // ========================================================
        // TRANSFER
        // ========================================================

        if (
            actionType === "transfer"
        ) {

            if (
                !data.originLocationId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Origin location is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !data.destinationLocationId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Destination location is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                data.originLocationId ===
                data.destinationLocationId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Origin and destination locations must be different",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !data.inventoryItemId
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Inventory Item ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }


            if (
                !Number.isInteger(
                    data.quantity
                ) ||
                data.quantity <= 0
            ) {
                return Response.json(
                    {
                        success: false,

                        message:
                            "Quantity must be a positive integer",
                    },
                    {
                        status: 400,
                    }
                );
            }


            return transferInventory({
                admin,

                session,

                originLocationId:
                    data.originLocationId,

                destinationLocationId:
                    data.destinationLocationId,

                inventoryItemId:
                    data.inventoryItemId,

                quantity:
                    data.quantity,

                note:
                    data.note || "",

                referenceName:
                    data.referenceName || "",
            });
        }


        // ========================================================
        // INVALID ACTION
        // ========================================================

        return Response.json(
            {
                success: false,

                message:
                    "Invalid inventory action",
            },
            {
                status: 400,
            }
        );

    } catch (error) {

        console.error(
            "Inventory API error:",
            error
        );


        return Response.json(
            {
                success: false,

                message:
                    error.message,
            },
            {
                status: 500,
            }
        );
    }
}