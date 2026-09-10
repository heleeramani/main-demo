import { connectDB } from "../db.server";

import Fulfillment from "../models/Fulfillment";

import {
    getOrderFulfillmentOrders,
    getFulfillmentOrderById,
    getFulfillmentById,
    createFulfillment,
    updateFulfillmentTracking,
    cancelFulfillment,
} from "../services/fulfillment.service";


function mapFulfillmentToMongo(
    shop,
    fulfillment
) {
    const lineItems =
        fulfillment.fulfillmentLineItems?.nodes || [];

    const trackingInfo =
        fulfillment.trackingInfo || [];

    return {
        shop,

        shopifyId: fulfillment.id,

        orderId:
            fulfillment.order?.id || "",

        orderName:
            fulfillment.order?.name || "",

        status:
            fulfillment.status || "",

        displayStatus:
            fulfillment.displayStatus || "",

        totalQuantity:
            fulfillment.totalQuantity || 0,

        locationId:
            fulfillment.location?.id || "",

        locationName:
            fulfillment.location?.name || "",

        trackingInfo: trackingInfo.map(
            (tracking) => ({
                company:
                    tracking.company || "",

                number:
                    tracking.number || "",

                url:
                    tracking.url || "",
            })
        ),

        lineItems: lineItems.map(
            (item) => ({
                id:
                    item.id || "",

                title:
                    item.lineItem?.title || "",

                quantity:
                    item.quantity || 0,

                sku:
                    item.lineItem?.variant?.sku || "",

                variantId:
                    item.lineItem?.variant?.id || "",
            })
        ),

        createdAtShopify:
            fulfillment.createdAt || null,

        updatedAtShopify:
            fulfillment.updatedAt || null,

        deliveredAt:
            fulfillment.deliveredAt || null,

        estimatedDeliveryAt:
            fulfillment.estimatedDeliveryAt || null,
    };
}


export async function listFulfillmentsController({
    shop,
}) {
    await connectDB();

    const fulfillments =
        await Fulfillment.find({
            shop,
        }).sort({
            createdAt: -1,
        });

    return fulfillments;
}


export async function getOrderFulfillmentOrdersController({
    admin,
    orderId,
}) {
    const result =
        await getOrderFulfillmentOrders(
            admin,
            orderId
        );

    return result;
}


export async function getFulfillmentOrderController({
    admin,
    fulfillmentOrderId,
}) {
    const fulfillmentOrder =
        await getFulfillmentOrderById(
            admin,
            fulfillmentOrderId
        );

    return fulfillmentOrder;
}


export async function getFulfillmentController({
    admin,
    shop,
    fulfillmentId,
}) {
    const fulfillment =
        await getFulfillmentById(
            admin,
            fulfillmentId
        );

    await connectDB();

    const mongoData =
        mapFulfillmentToMongo(
            shop,
            fulfillment
        );

    const savedFulfillment =
        await Fulfillment.findOneAndUpdate(
            {
                shop,
                shopifyId: fulfillment.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedFulfillment;
}


export async function createFulfillmentController({
    admin,
    shop,
    fulfillmentData,
}) {
    const fulfillment =
        await createFulfillment(
            admin,
            fulfillmentData
        );

    await connectDB();

    const mongoData =
        mapFulfillmentToMongo(
            shop,
            fulfillment
        );

    const savedFulfillment =
        await Fulfillment.findOneAndUpdate(
            {
                shop,
                shopifyId: fulfillment.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedFulfillment;
}


export async function updateFulfillmentTrackingController({
    admin,
    shop,
    fulfillmentId,
    trackingData,
}) {
    const fulfillment =
        await updateFulfillmentTracking(
            admin,
            fulfillmentId,
            trackingData
        );

    await connectDB();

    const mongoData =
        mapFulfillmentToMongo(
            shop,
            fulfillment
        );

    const savedFulfillment =
        await Fulfillment.findOneAndUpdate(
            {
                shop,
                shopifyId: fulfillment.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedFulfillment;
}


export async function cancelFulfillmentController({
    admin,
    shop,
    fulfillmentId,
}) {
    const fulfillment =
        await cancelFulfillment(
            admin,
            fulfillmentId
        );

    await connectDB();

    const mongoData =
        mapFulfillmentToMongo(
            shop,
            fulfillment
        );

    const savedFulfillment =
        await Fulfillment.findOneAndUpdate(
            {
                shop,
                shopifyId: fulfillment.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedFulfillment;
}