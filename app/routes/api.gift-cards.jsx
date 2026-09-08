import { authenticate } from "../shopify.server";

import {
  syncGiftCards,
  getGiftCardById,
  createGiftCard,
  updateGiftCard,
  deactivateGiftCard,
} from "../controllers/gift-card.controller";


// ============================================================
// GET
// ============================================================
// GET /api/gift-cards
//       → Sync all Gift Cards from Shopify → MongoDB
//
// GET /api/gift-cards?giftCardId=gid://shopify/GiftCard/...
//       → Get single Gift Card from Shopify
// ============================================================

export async function loader({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const url = new URL(request.url);

    const giftCardId =
      url.searchParams.get("giftCardId");

    console.log("========================================");
    console.log("GIFT CARD API GET");
    console.log("Shop:", session.shop);
    console.log("Gift Card ID:", giftCardId);
    console.log("========================================");

    // --------------------------------------------------------
    // Get single Gift Card
    // --------------------------------------------------------

    if (giftCardId) {
      return getGiftCardById({
        admin,
        session,
        giftCardId,
      });
    }

    // --------------------------------------------------------
    // Sync all Gift Cards
    // --------------------------------------------------------

    return syncGiftCards({
      admin,
      session,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error(
      "Get gift cards error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to get gift cards",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// ACTION
// ============================================================
// POST → Create Gift Card
// PUT  → Update Gift Card
// DELETE → Deactivate Gift Card
// ============================================================

export async function action({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const body = await request.json();

    console.log("========================================");
    console.log("GIFT CARD API ACTION");
    console.log("Method:", request.method);
    console.log("Shop:", session.shop);
    console.log(
      "Body:",
      JSON.stringify(body, null, 2)
    );
    console.log("========================================");


    // ========================================================
    // CREATE
    // ========================================================

    if (
      request.method === "POST" &&
      body.action === "create"
    ) {
      return createGiftCard({
        admin,
        session,
        giftCardData: body.giftCard,
      });
    }


    // ========================================================
    // UPDATE
    // ========================================================

    if (request.method === "PUT") {
      return updateGiftCard({
        admin,
        session,
        giftCardData: body,
      });
    }


    // ========================================================
    // DEACTIVATE
    // ========================================================

    if (request.method === "DELETE") {
      return deactivateGiftCard({
        admin,
        session,
        giftCardId: body.giftCardId,
      });
    }


    // ========================================================
    // INVALID ACTION
    // ========================================================

    return Response.json(
      {
        success: false,
        message: "Invalid gift card action",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error(
      "Gift card action error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Gift card action failed",
      },
      {
        status: 500,
      }
    );
  }
}