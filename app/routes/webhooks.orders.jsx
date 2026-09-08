import { authenticate } from "../shopify.server";

import {
  handleOrderCreateWebhook,
  handleOrderUpdatedWebhook,
  handleOrderCancelledWebhook,
} from "../controllers/order-webhook.controller";

/**
 * Shopify Order Webhook
 *
 * Handles:
 * ORDERS_CREATE
 * ORDERS_UPDATED
 * ORDERS_CANCELLED
 */
export async function action({ request }) {
  try {
    const {
      topic,
      shop,
      payload,
    } = await authenticate.webhook(request);

    console.log("========================================");
    console.log("SHOPIFY ORDER WEBHOOK RECEIVED");
    console.log("Topic:", topic);
    console.log("Shop:", shop);
    console.log("Order:", payload?.name);
    console.log("========================================");

    if (topic === "ORDERS_CREATE") {
      return handleOrderCreateWebhook({
        shop,
        payload,
      });
    }

    if (topic === "ORDERS_UPDATED") {
      return handleOrderUpdatedWebhook({
        shop,
        payload,
      });
    }

    if (topic === "ORDERS_CANCELLED") {
      return handleOrderCancelledWebhook({
        shop,
        payload,
      });
    }

    console.log("Unhandled webhook topic:", topic);

    return new Response("Unhandled webhook topic", {
      status: 404,
    });
  } catch (error) {
    console.error("Order webhook error:", error);

    return new Response(
      error?.message || "Order webhook processing failed",
      {
        status: 500,
      }
    );
  }
}