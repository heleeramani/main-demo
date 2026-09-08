import { authenticate } from "../shopify.server";

import {
  handleCustomerCreateWebhook,
  handleCustomerUpdateWebhook,
  handleCustomerDeleteWebhook,
} from "../controllers/customer-webhook.controller";


// ============================================================
// SHOPIFY CUSTOMER WEBHOOK
// ============================================================

export async function action({ request }) {
  try {
    // Shopify automatically verifies the webhook
    const {
      topic,
      shop,
      payload,
    } = await authenticate.webhook(
      request
    );

    console.log(
      "========================================"
    );

    console.log(
      "SHOPIFY CUSTOMER WEBHOOK RECEIVED"
    );

    console.log(
      "Topic:",
      topic
    );

    console.log(
      "Shop:",
      shop
    );

    console.log(
      "Customer:",
      payload?.id
    );

    console.log(
      "Customer Email:",
      payload?.email
    );

    console.log(
      "========================================"
    );


    // ========================================================
    // CUSTOMER CREATED
    // ========================================================

    if (topic === "CUSTOMERS_CREATE") {
      return handleCustomerCreateWebhook({
        shop,
        payload,
      });
    }


    // ========================================================
    // CUSTOMER UPDATED
    // ========================================================

    if (topic === "CUSTOMERS_UPDATE") {
      return handleCustomerUpdateWebhook({
        shop,
        payload,
      });
    }


    // ========================================================
    // CUSTOMER DELETED
    // ========================================================

    if (topic === "CUSTOMERS_DELETE") {
      return handleCustomerDeleteWebhook({
        shop,
        payload,
      });
    }


    // ========================================================
    // UNKNOWN TOPIC
    // ========================================================

    return new Response(
      "Unhandled customer webhook topic",
      {
        status: 404,
      }
    );
  } catch (error) {
    console.error(
      "Customer webhook error:",
      error
    );

    return new Response(
      error?.message ||
        "Customer webhook processing failed",
      {
        status: 500,
      }
    );
  }
}