import {
    getReturnableFulfillments,
    getOrderReturns,
    getReturnById,
    createReturn,
    processReturn,
} from "../services/return.service";

import { connectDB } from "../db.server";
import Return from "../models/Return";

/**
 * Convert Shopify Return into MongoDB document.
 */
function mapReturnToMongo(returnData, shop) {
    if (!returnData) {
        return null;
    }

    const returnLineItems =
        returnData.returnLineItems?.nodes ||
        returnData.returnLineItems ||
        [];

    const reverseFulfillmentOrders =
        returnData.reverseFulfillmentOrders?.nodes ||
        returnData.reverseFulfillmentOrders ||
        [];

    return {
        shop,

        shopifyId:
            returnData.id,

        name:
            returnData.name || "",

        orderId:
            returnData.order?.id ||
            returnData.orderId ||
            "",

        orderName:
            returnData.order?.name ||
            returnData.orderName ||
            "",

        status:
            returnData.status || "",

        totalQuantity:
            returnData.totalQuantity || 0,

        returnLineItems:
            returnLineItems.map((item) => {
                const lineItem =
                    item.fulfillmentLineItem?.lineItem;

                return {
                    shopifyId:
                        item.id || "",

                    fulfillmentLineItemId:
                        item.fulfillmentLineItem?.id || "",

                    lineItemId:
                        lineItem?.id || "",

                    title:
                        lineItem?.title || "",

                    variantId:
                        lineItem?.variant?.id || "",

                    variantTitle:
                        lineItem?.variant?.title || "",

                    sku:
                        lineItem?.sku ||
                        lineItem?.variant?.sku ||
                        "",

                    quantity:
                        item.quantity || 0,

                    processableQuantity:
                        item.processableQuantity || 0,

                    processedQuantity:
                        item.processedQuantity || 0,

                    refundableQuantity:
                        item.refundableQuantity || 0,

                    refundedQuantity:
                        item.refundedQuantity || 0,

                    returnReason:
                        item.returnReason || "",

                    returnReasonNote:
                        item.returnReasonNote || "",

                    customerNote:
                        item.customerNote || "",
                };
            }),

        reverseFulfillmentOrders:
            reverseFulfillmentOrders.map((item) => ({
                shopifyId:
                    item.id || "",

                status:
                    item.status || "",

                locationId:
                    item.location?.id || "",

                locationName:
                    item.location?.name || "",
            })),

        requestedAt:
            returnData.requestedAt
                ? new Date(returnData.requestedAt)
                : null,

        closedAt:
            returnData.closedAt
                ? new Date(returnData.closedAt)
                : null,

        createdAtShopify:
            returnData.createdAt
                ? new Date(returnData.createdAt)
                : null,

        updatedAtShopify:
            returnData.updatedAt
                ? new Date(returnData.updatedAt)
                : null,
    };
}

/**
 * Get returnable fulfillment items.
 */
export async function getReturnableFulfillmentsController({
    admin,
    orderId,
}) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    return getReturnableFulfillments(
        admin,
        orderId
    );
}

/**
 * Get all returns for an order.
 */
export async function getOrderReturnsController({
    admin,
    session,
    orderId,
}) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    const result = await getOrderReturns(
        admin,
        orderId
    );

    await connectDB();

    const shop = session.shop;

    const returns = result.returns || [];

    /**
     * Sync Shopify returns into MongoDB.
     */
    for (const returnData of returns) {
        const mongoData = mapReturnToMongo(
            {
                ...returnData,
                order: {
                    id: result.orderId,
                    name: result.orderName,
                },
            },
            shop
        );

        if (!mongoData?.shopifyId) {
            continue;
        }

        await Return.findOneAndUpdate(
            {
                shop,
                shopifyId: mongoData.shopifyId,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );
    }

    const savedReturns = await Return.find({
        shop,
        orderId,
    }).sort({
        createdAt: -1,
    });

    return {
        orderId: result.orderId,
        orderName: result.orderName,
        returns: savedReturns,
    };
}

/**
 * Get a single return.
 */
export async function getReturnByIdController({
    admin,
    session,
    returnId,
}) {
    if (!returnId) {
        throw new Error("Return ID is required");
    }

    const returnData = await getReturnById(
        admin,
        returnId
    );

    if (!returnData) {
        throw new Error("Return not found");
    }

    await connectDB();

    const mongoData = mapReturnToMongo(
        returnData,
        session.shop
    );

    const savedReturn =
        await Return.findOneAndUpdate(
            {
                shop: session.shop,
                shopifyId: returnData.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedReturn;
}

/**
 * Create a Return.
 */
export async function createReturnController({
    admin,
    session,
    returnData,
}) {
    const returnDataFromShopify =
        await createReturn(
            admin,
            returnData
        );

    if (!returnDataFromShopify) {
        throw new Error(
            "Shopify did not return the created return"
        );
    }

    await connectDB();

    const mongoData = mapReturnToMongo(
        returnDataFromShopify,
        session.shop
    );

    const savedReturn =
        await Return.findOneAndUpdate(
            {
                shop: session.shop,
                shopifyId:
                    returnDataFromShopify.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedReturn;
}

/**
 * Process a Return.
 */
export async function processReturnController({
    admin,
    session,
    processInput,
}) {
    const processedReturn =
        await processReturn(
            admin,
            processInput
        );

    if (!processedReturn) {
        throw new Error(
            "Shopify did not return the processed return"
        );
    }

    await connectDB();

    const mongoData = mapReturnToMongo(
        processedReturn,
        session.shop
    );

    const savedReturn =
        await Return.findOneAndUpdate(
            {
                shop: session.shop,
                shopifyId:
                    processedReturn.id,
            },
            {
                $set: mongoData,
            },
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedReturn;
}