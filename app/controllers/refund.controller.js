import { connectDB } from "../db.server";
import Refund from "../models/Refund";

import {
    getOrderRefunds,
    getRefundById,
    createRefund,
} from "../services/refund.service";

// Map Shopify Refund → MongoDB
function mapRefundToMongo(shop, refund) {
    const refundLineItems =
        refund.refundLineItems?.nodes || [];

    const transactions =
        refund.transactions?.nodes || [];

    const duties =
        refund.duties || [];

    const totalRefunded =
        refund.totalRefundedSet?.shopMoney;

    const shippingRefund = {
        amount: "0.00",
        currencyCode:
            totalRefunded?.currencyCode || "",
    };

    return {
        shop,

        shopifyId:
            refund.id,

        orderId:
            refund.order?.id || "",

        orderName:
            refund.order?.name || "",

        note:
            refund.note || "",

        totalRefunded:
            totalRefunded?.amount || "0.00",

        currencyCode:
            totalRefunded?.currencyCode || "",

        refundLineItems:
            refundLineItems.map(
                (item) => {
                    const subtotal =
                        item.subtotalSet?.shopMoney;

                    const totalTax =
                        item.totalTaxSet?.shopMoney;

                    return {
                        id:
                            item.id || "",

                        lineItemId:
                            item.lineItem?.id || "",

                        title:
                            item.lineItem?.title || "",

                        quantity:
                            Number(item.quantity || 0),

                        restockType:
                            item.restockType || "",

                        locationId:
                            item.location?.id || "",

                        locationName:
                            item.location?.name || "",

                        subtotal:
                            subtotal?.amount || "0.00",

                        totalTax:
                            totalTax?.amount || "0.00",
                    };
                }
            ),

        transactions:
            transactions.map(
                (transaction) => {
                    const amount =
                        transaction.amountSet
                            ?.shopMoney;

                    return {
                        id:
                            transaction.id || "",

                        kind:
                            transaction.kind || "",

                        status:
                            transaction.status || "",

                        gateway:
                            transaction.gateway || "",

                        amount:
                            amount?.amount || "0.00",

                        currencyCode:
                            amount?.currencyCode || "",

                        processedAt:
                            transaction.processedAt ||
                            null,
                    };
                }
            ),

        shippingRefund,

        duties:
            duties.map(
                (duty) => {
                    const amount =
                        duty.amountSet
                            ?.shopMoney;

                    return {
                        id:
                            duty.id || "",

                        amount:
                            amount?.amount || "0.00",

                        currencyCode:
                            amount?.currencyCode || "",
                    };
                }
            ),

        processedAt:
            refund.processedAt || null,

        createdAtShopify:
            refund.createdAt || null,

        updatedAtShopify:
            refund.updatedAt || null,
    };
}


// Save Refund to MongoDB
async function syncRefundToMongo(
    shop,
    refund
) {
    await connectDB();

    const mongoData =
        mapRefundToMongo(
            shop,
            refund
        );

    const savedRefund =
        await Refund.findOneAndUpdate(
            {
                shop,
                shopifyId: refund.id,
            },
            mongoData,
            {
                upsert: true,
                returnDocument: "after",
            }
        );

    return savedRefund;
}


// Get Order Refunds
export async function getOrderRefundsController(
    admin,
    shop,
    orderId
) {
    const result =
        await getOrderRefunds(
            admin,
            orderId
        );

    const refunds =
        result.refunds || [];

    const savedRefunds = [];

    for (const refund of refunds) {
        const savedRefund =
            await syncRefundToMongo(
                shop,
                refund
            );

        savedRefunds.push(
            savedRefund
        );
    }

    return {
        orderId:
            result.orderId,

        orderName:
            result.orderName,

        refunds:
            savedRefunds,
    };
}


// Get Single Refund
export async function getRefundByIdController(
    admin,
    shop,
    refundId
) {
    const refund =
        await getRefundById(
            admin,
            refundId
        );

    const savedRefund =
        await syncRefundToMongo(
            shop,
            refund
        );

    return savedRefund;
}


// Create Refund
export async function createRefundController(
    admin,
    shop,
    refundData
) {
    const refund =
        await createRefund(
            admin,
            refundData
        );

    const savedRefund =
        await syncRefundToMongo(
            shop,
            refund
        );

    return savedRefund;
}