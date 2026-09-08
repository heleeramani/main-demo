import { authenticate } from "../shopify.server";

import {
  createMetaobjectWebhookController,
  updateMetaobjectWebhookController,
  deleteMetaobjectWebhookController,
} from "../controllers/metaobject-webhook.controller";

export async function action({ request }) {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log("========================================");
    console.log("SHOPIFY METAOBJECT WEBHOOK RECEIVED");
    console.log("Topic:", topic);
    console.log("Shop:", shop);
    console.log("Metaobject ID:", payload?.id);
    console.log("Metaobject Type:", payload?.type);
    console.log("Metaobject Handle:", payload?.handle);
    console.log("========================================");

    // ========================================================
    // CREATE
    // ========================================================

    if (topic === "METAOBJECTS_CREATE") {
      await createMetaobjectWebhookController({
        shop,
        payload,
      });

      return new Response("Metaobject created successfully", {
        status: 200,
      });
    }

    // ========================================================
    // UPDATE
    // ========================================================

    if (topic === "METAOBJECTS_UPDATE") {
      await updateMetaobjectWebhookController({
        shop,
        payload,
      });

      return new Response("Metaobject updated successfully", {
        status: 200,
      });
    }

    // ========================================================
    // DELETE
    // ========================================================

    if (topic === "METAOBJECTS_DELETE") {
      await deleteMetaobjectWebhookController({
        shop,
        payload,
      });

      return new Response("Metaobject deleted successfully", {
        status: 200,
      });
    }

    // ========================================================
    // UNKNOWN TOPIC
    // ========================================================

    return new Response("Unhandled metaobject webhook topic", {
      status: 404,
    });
  } catch (error) {
    console.error("Metaobject webhook error:", error);

    return new Response(
      error?.message || "Metaobject webhook processing failed",
      {
        status: 500,
      },
    );
  }
}   