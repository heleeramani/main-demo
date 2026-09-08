import { authenticate } from "../shopify.server";

import {
  handleProductCreateWebhook,
  handleProductUpdateWebhook,
  handleProductDeleteWebhook,
} from "../controllers/webhook.controller";

/**
 * Shopify Product Webhook
 *
 * Handles:
 * PRODUCTS_CREATE
 * PRODUCTS_UPDATE
 * PRODUCTS_DELETE
 */
export async function action({ request }) {
  try {
    /**
     * authenticate.webhook()
     * verifies the Shopify webhook request
     * and gives us:
     *
     * topic  → webhook topic
     * shop   → Shopify shop domain
     * payload → webhook data
     */
    const {
      topic,
      shop,
      payload,
    } = await authenticate.webhook(request);

    console.log("========================================");
    console.log("SHOPIFY PRODUCT WEBHOOK RECEIVED");
    console.log("Topic:", topic);
    console.log("Shop:", shop);
    console.log("========================================");

    /**
     * Product Created
     */
    if (topic === "PRODUCTS_CREATE") {
      return handleProductCreateWebhook({
        shop,
        payload,
      });
    }

    /**
     * Product Updated
     */
    if (topic === "PRODUCTS_UPDATE") {
      return handleProductUpdateWebhook({
        shop,
        payload,
      });
    }

    /**
     * Product Deleted
     */
    if (topic === "PRODUCTS_DELETE") {
      return handleProductDeleteWebhook({
        shop,
        payload,
      });
    }

    /**
     * Unknown webhook topic
     */
    console.log("Unhandled webhook topic:", topic);

    return new Response(
      "Unhandled webhook topic",
      {
        status: 404,
      }
    );
  } catch (error) {
    console.error(
      "Product webhook error:",
      error
    );

    /**
     * 500 tells Shopify that webhook processing failed.
     */
    return new Response(
      error?.message ||
        "Webhook processing failed",
      {
        status: 500,
      }
    );
  }
}