import { randomUUID } from "node:crypto";

import { connectDB } from "../db.server";

import {
    getLocations,
    getVariantInventory,
    getInventory,
    adjustInventory,
    transferInventoryBetweenLocations,
} from "../services/inventory.service";

import Inventory from "../models/Inventory";

import InventoryTransfer from "../models/InventoryTransfer";


// ============================================================
// HELPER
// ============================================================

function getQuantity(
    quantities,
    name
) {
    const quantity =
        quantities?.find(
            (item) =>
                item.name === name
        );

    return (
        quantity?.quantity || 0
    );
}


// ============================================================
// SYNC INVENTORY
// ============================================================

export async function syncInventory({
    admin,
    session,
}) {
    await connectDB();

    const products =
        await getInventory(admin);

    const savedInventory = [];


    for (
        const product
        of products
    ) {

        for (
            const variant
            of product.variants.nodes
        ) {

            const inventoryItem =
                variant.inventoryItem;


            if (!inventoryItem) {
                continue;
            }


            for (
                const level
                of inventoryItem
                    .inventoryLevels.nodes
            ) {

                const quantities =
                    level.quantities ||
                    [];


                const inventoryData = {
                    shop:
                        session.shop,

                    inventoryItemId:
                        inventoryItem.id,

                    variantId:
                        variant.id,

                    productId:
                        product.id,

                    sku:
                        variant.sku || "",

                    locationId:
                        level.location.id,

                    locationName:
                        level.location.name ||
                        "",

                    inventoryLevelId:
                        level.id,

                    available:
                        getQuantity(
                            quantities,
                            "available"
                        ),

                    onHand:
                        getQuantity(
                            quantities,
                            "on_hand"
                        ),

                    incoming:
                        0,

                    committed:
                        0,

                    damaged:
                        0,

                    tracked:
                        inventoryItem.tracked,

                    shopifyUpdatedAt:
                        new Date(),
                };


                const saved =
                    await Inventory.findOneAndUpdate(
                        {
                            shop:
                                session.shop,

                            inventoryItemId:
                                inventoryItem.id,

                            locationId:
                                level.location.id,
                        },

                        inventoryData,

                        {
                            returnDocument:
                                "after",

                            upsert:
                                true,

                            runValidators:
                                true,
                        }
                    );


                savedInventory.push(
                    saved
                );
            }
        }
    }


    return Response.json({
        success: true,

        message:
            "Inventory synced successfully",

        count:
            savedInventory.length,

        data:
            savedInventory,
    });
}


// ============================================================
// GET LOCATIONS
// ============================================================

export async function getInventoryLocations({
    admin,
}) {
    const locations =
        await getLocations(admin);

    return Response.json({
        success: true,

        count:
            locations.length,

        data:
            locations,
    });
}


// ============================================================
// GET VARIANT INVENTORY
// ============================================================

export async function getVariantInventoryById({
    admin,
    session,
    variantId,
}) {
    await connectDB();


    if (!variantId) {
        throw new Error(
            "Variant ID is required"
        );
    }


    const variant =
        await getVariantInventory(
            admin,
            variantId
        );


    const inventoryItem =
        variant.inventoryItem;


    if (!inventoryItem) {
        return Response.json({
            success: true,

            variant: {
                id:
                    variant.id,

                title:
                    variant.title,

                sku:
                    variant.sku || "",

                product:
                    variant.product,
            },

            count: 0,

            data: [],
        });
    }


    const savedInventory = [];


    for (
        const level
        of inventoryItem
            .inventoryLevels.nodes
    ) {

        const quantities =
            level.quantities ||
            [];


        const inventoryData = {
            shop:
                session.shop,

            inventoryItemId:
                inventoryItem.id,

            variantId:
                variant.id,

            productId:
                variant.product?.id ||
                "",

            sku:
                variant.sku || "",

            locationId:
                level.location.id,

            locationName:
                level.location.name ||
                "",

            inventoryLevelId:
                level.id,

            available:
                getQuantity(
                    quantities,
                    "available"
                ),

            onHand:
                getQuantity(
                    quantities,
                    "on_hand"
                ),

            incoming:
                getQuantity(
                    quantities,
                    "incoming"
                ),

            committed:
                getQuantity(
                    quantities,
                    "committed"
                ),

            damaged:
                getQuantity(
                    quantities,
                    "damaged"
                ),

            tracked:
                inventoryItem.tracked,

            shopifyUpdatedAt:
                new Date(),
        };


        const saved =
            await Inventory.findOneAndUpdate(
                {
                    shop:
                        session.shop,

                    inventoryItemId:
                        inventoryItem.id,

                    locationId:
                        level.location.id,
                },

                inventoryData,

                {
                    returnDocument:
                        "after",

                    upsert:
                        true,

                    runValidators:
                        true,
                }
            );


        savedInventory.push(
            saved
        );
    }


    return Response.json({
        success: true,

        variant: {
            id:
                variant.id,

            title:
                variant.title,

            sku:
                variant.sku || "",

            product:
                variant.product,
        },

        count:
            savedInventory.length,

        data:
            savedInventory,
    });
}


// ============================================================
// INCREASE INVENTORY
// ============================================================

export async function increaseInventory({
    admin,
    session,
    inventoryItemId,
    locationId,
    quantity,
}) {
    await connectDB();


    if (!inventoryItemId) {
        throw new Error(
            "Inventory Item ID is required"
        );
    }


    if (!locationId) {
        throw new Error(
            "Location ID is required"
        );
    }


    if (
        !Number.isInteger(
            quantity
        ) ||
        quantity <= 0
    ) {
        throw new Error(
            "Quantity must be a positive integer"
        );
    }


    const result =
        await adjustInventory(
            admin,

            inventoryItemId,

            locationId,

            quantity,

            "received"
        );


    return Response.json({
        success: true,

        message:
            `Inventory increased by ${quantity}`,

        data:
            result,
    });
}


// ============================================================
// DECREASE INVENTORY
// ============================================================

export async function decreaseInventory({
    admin,
    session,
    inventoryItemId,
    locationId,
    quantity,
}) {
    await connectDB();


    if (!inventoryItemId) {
        throw new Error(
            "Inventory Item ID is required"
        );
    }


    if (!locationId) {
        throw new Error(
            "Location ID is required"
        );
    }


    if (
        !Number.isInteger(
            quantity
        ) ||
        quantity <= 0
    ) {
        throw new Error(
            "Quantity must be a positive integer"
        );
    }


    const result =
        await adjustInventory(
            admin,

            inventoryItemId,

            locationId,

            -quantity,

            "correction"
        );


    return Response.json({
        success: true,

        message:
            `Inventory decreased by ${quantity}`,

        data:
            result,
    });
}


// ============================================================
// TRANSFER INVENTORY
// ============================================================

export async function transferInventory({
    admin,
    session,

    originLocationId,

    destinationLocationId,

    inventoryItemId,

    quantity,

    note,

    referenceName,
}) {
    await connectDB();


    // ----------------------------------------------------------
    // Validate origin
    // ----------------------------------------------------------

    if (!originLocationId) {
        throw new Error(
            "Origin location is required"
        );
    }


    // ----------------------------------------------------------
    // Validate destination
    // ----------------------------------------------------------

    if (!destinationLocationId) {
        throw new Error(
            "Destination location is required"
        );
    }


    // ----------------------------------------------------------
    // Locations must differ
    // ----------------------------------------------------------

    if (
        originLocationId ===
        destinationLocationId
    ) {
        throw new Error(
            "Origin and destination locations must be different"
        );
    }


    // ----------------------------------------------------------
    // Validate inventory item
    // ----------------------------------------------------------

    if (!inventoryItemId) {
        throw new Error(
            "Inventory Item ID is required"
        );
    }


    // ----------------------------------------------------------
    // Validate quantity
    // ----------------------------------------------------------

    if (
        !Number.isInteger(
            quantity
        ) ||
        quantity <= 0
    ) {
        throw new Error(
            "Quantity must be a positive integer"
        );
    }


    // ----------------------------------------------------------
    // Move the inventory in Shopify right now
    // (decrements origin, increments destination atomically)
    // ----------------------------------------------------------

    const adjustmentGroup =
        await transferInventoryBetweenLocations(
            admin,
            {
                originLocationId,

                destinationLocationId,

                inventoryItemId,

                quantity,
            }
        );

    const changes =
        adjustmentGroup?.changes || [];

    const originChange =
        changes.find(
            (change) =>
                change.location?.id ===
                originLocationId
        );

    const destinationChange =
        changes.find(
            (change) =>
                change.location?.id ===
                destinationLocationId
        );


    // ----------------------------------------------------------
    // Log the transfer in MongoDB
    // ----------------------------------------------------------
    //
    // This is a completed, immediate stock move, not a
    // Shopify Inventory Transfer resource, so we generate
    // our own log identifier.
    // ----------------------------------------------------------

    const savedTransfer =
        await InventoryTransfer.create({
            shop:
                session.shop,

            shopifyId:
                `local-transfer-${randomUUID()}`,

            status:
                "COMPLETED",

            originLocationId,

            originLocationName:
                originChange?.location
                    ?.name || "",

            destinationLocationId,

            destinationLocationName:
                destinationChange?.location
                    ?.name || "",

            lineItems: [
                {
                    inventoryItemId,

                    quantity,
                },
            ],

            note:
                note || "",

            referenceName:
                referenceName || "",

            shopifyCreatedAt:
                adjustmentGroup?.createdAt
                    ? new Date(
                        adjustmentGroup.createdAt
                    )
                    : new Date(),
        });


    // ----------------------------------------------------------
    // Return response
    // ----------------------------------------------------------

    return Response.json({
        success: true,

        message:
            `${quantity} unit(s) transferred successfully`,

        data:
            savedTransfer,
    });
}