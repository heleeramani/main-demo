import { connectDB } from "../db.server";
import DraftOrder from "../models/DraftOrder";

import {
    getDraftOrders,
    getDraftOrderById,
    createDraftOrder,
    updateDraftOrder,
    completeDraftOrder,
    deleteDraftOrder,
} from "../services/draftOrder.service";


// Map Shopify Draft Order → MongoDB
function mapDraftOrderToMongo(shop, draftOrder) {
    const customer = draftOrder.customer || {};

    const lineItems =
        draftOrder.lineItems?.nodes || [];

    return {
        shop,

        shopifyId:
            draftOrder.id,

        name:
            draftOrder.name || "",

        status:
            draftOrder.status || "",

        email:
            draftOrder.email || "",

        customer: {
            id:
                customer.id || "",

            firstName:
                customer.firstName || "",

            lastName:
                customer.lastName || "",

            displayName:
                customer.displayName || "",

            email:
                customer.email || "",
        },

        lineItems: lineItems.map((item) => ({
            shopifyId:
                item.id || "",

            title:
                item.title ||
                item.name ||
                "",

            quantity:
                Number(item.quantity || 0),

            originalUnitPrice:
                item.originalUnitPrice || "0.00",

            sku:
                item.sku ||
                item.variant?.sku ||
                "",

            variantId:
                item.variant?.id || "",

            productId:
                item.variant?.product?.id || "",
        })),

        subtotalPrice:
            draftOrder.subtotalPrice || "0.00",

        totalTax:
            draftOrder.totalTax || "0.00",

        totalPrice:
            draftOrder.totalPrice || "0.00",

        currencyCode:
            draftOrder.currencyCode || "",

        shippingAddress:
            draftOrder.shippingAddress || {},

        billingAddress:
            draftOrder.billingAddress || {},

        note:
            draftOrder.note || "",

        tags:
            draftOrder.tags || [],

        invoiceUrl:
            draftOrder.invoiceUrl || "",

        completedAt:
            draftOrder.completedAt || null,

        createdAtShopify:
            draftOrder.createdAt || null,

        updatedAtShopify:
            draftOrder.updatedAt || null,
    };
}


// Sync one Draft Order to MongoDB
async function syncDraftOrderToMongo(
    shop,
    draftOrder
) {
    await connectDB();

    const mongoData =
        mapDraftOrderToMongo(
            shop,
            draftOrder
        );

    const savedDraftOrder =
        await DraftOrder.findOneAndUpdate(
            {
                shop,
                shopifyId: draftOrder.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedDraftOrder;
}


// Get Draft Orders
export async function getDraftOrdersController(
    admin,
    shop
) {
    const draftOrders =
        await getDraftOrders(admin);

    await connectDB();

    const savedDraftOrders = [];

    for (const draftOrder of draftOrders) {
        const saved =
            await syncDraftOrderToMongo(
                shop,
                draftOrder
            );

        savedDraftOrders.push(saved);
    }

    return savedDraftOrders;
}


// Get single Draft Order
export async function getDraftOrderByIdController(
    admin,
    shop,
    draftOrderId
) {
    const draftOrder =
        await getDraftOrderById(
            admin,
            draftOrderId
        );

    const savedDraftOrder =
        await syncDraftOrderToMongo(
            shop,
            draftOrder
        );

    return savedDraftOrder;
}


// Create Draft Order
export async function createDraftOrderController(
    admin,
    shop,
    draftOrderData
) {
    const draftOrder =
        await createDraftOrder(
            admin,
            draftOrderData
        );

    const savedDraftOrder =
        await syncDraftOrderToMongo(
            shop,
            draftOrder
        );

    return savedDraftOrder;
}


// Update Draft Order
export async function updateDraftOrderController(
    admin,
    shop,
    draftOrderId,
    draftOrderData
) {
    const draftOrder =
        await updateDraftOrder(
            admin,
            draftOrderId,
            draftOrderData
        );

    const savedDraftOrder =
        await syncDraftOrderToMongo(
            shop,
            draftOrder
        );

    return savedDraftOrder;
}


// Complete Draft Order
export async function completeDraftOrderController(
    admin,
    shop,
    draftOrderId
) {
    const draftOrder =
        await completeDraftOrder(
            admin,
            draftOrderId
        );

    const savedDraftOrder =
        await syncDraftOrderToMongo(
            shop,
            draftOrder
        );

    return savedDraftOrder;
}


// Delete Draft Order
export async function deleteDraftOrderController(
    admin,
    shop,
    draftOrderId
) {
    const result =
        await deleteDraftOrder(
            admin,
            draftOrderId
        );

    await connectDB();

    await DraftOrder.findOneAndDelete({
        shop,
        shopifyId: draftOrderId,
    });

    return result;
}