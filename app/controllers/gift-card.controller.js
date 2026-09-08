// app/controllers/gift-card.controller.js

import GiftCard from "../models/GiftCard";

import {
  getGiftCards,
  getGiftCardById as getGiftCardByIdFromShopify,
  createGiftCard as createGiftCardOnShopify,
  updateGiftCard as updateGiftCardOnShopify,
  deactivateGiftCard as deactivateGiftCardOnShopify,
} from "../services/gift-card.service";

import { connectDB } from "../db.server";

// ============================================================
// MAP SHOPIFY GIFT CARD → MONGODB
// ============================================================

function mapGiftCardToMongo(
  giftCard,
  shop,
  giftCardCode = "",
) {
  return {
    shop,

    shopifyId:
      giftCard.id,

    // IMPORTANT:
    // Preserve the code when available.
    code:
      giftCardCode ||
      giftCard.giftCardCode ||
      "",

    lastCharacters:
      giftCard.lastCharacters ||
      "",

    initialValue: Number(
      giftCard.initialValue?.amount || 0,
    ),

    currentBalance: Number(
      giftCard.balance?.amount || 0,
    ),

    currencyCode:
      giftCard.balance?.currencyCode ||
      giftCard.initialValue?.currencyCode ||
      "",

    enabled:
      Boolean(giftCard.enabled),

    customerId:
      giftCard.customer?.id ||
      "",

    customerName:
      giftCard.customer?.displayName ||
      "",

    customerEmail:
      giftCard.customer?.email ||
      "",

    note:
      giftCard.note ||
      "",

    expiresOn:
      giftCard.expiresOn
        ? new Date(giftCard.expiresOn)
        : null,

    shopifyCreatedAt:
      giftCard.createdAt
        ? new Date(giftCard.createdAt)
        : null,

    shopifyUpdatedAt:
      giftCard.updatedAt
        ? new Date(giftCard.updatedAt)
        : null,
  };
}

// ============================================================
// SYNC GIFT CARDS
// ============================================================

export async function syncGiftCards({
  admin,
  session,
}) {
  await connectDB();

  console.log(
    "========================================",
  );

  console.log(
    "SYNC GIFT CARDS STARTED",
  );

  console.log(
    "Shop:",
    session.shop,
  );

  console.log(
    "========================================",
  );

  const giftCards =
    await getGiftCards(admin);

  console.log(
    "Gift Cards received from Shopify:",
    giftCards.length,
  );

  const savedGiftCards = [];

  for (const giftCard of giftCards) {

    // --------------------------------------------------------
    // IMPORTANT:
    // Shopify normal GET does NOT return the full gift card code.
    //
    // Therefore, first get the existing Mongo document and
    // preserve the previously stored code.
    // --------------------------------------------------------

    const existingGiftCard =
      await GiftCard.findOne({
        shop: session.shop,
        shopifyId: giftCard.id,
      });

    const existingCode =
      existingGiftCard?.code || "";

    const mongoData =
      mapGiftCardToMongo(
        giftCard,
        session.shop,
        existingCode,
      );

    const savedGiftCard =
      await GiftCard.findOneAndUpdate(
        {
          shop: session.shop,
          shopifyId: giftCard.id,
        },

        mongoData,

        {
          upsert: true,
          returnDocument: "after",
        },
      );

    savedGiftCards.push(
      savedGiftCard,
    );
  }

  console.log(
    "Gift Cards saved to MongoDB:",
    savedGiftCards.length,
  );

  console.log(
    "========================================",
  );

  return Response.json({
    success: true,

    message:
      "Gift cards synced successfully",

    giftCards:
      savedGiftCards,
  });
}

// ============================================================
// GET GIFT CARD BY ID
// ============================================================

export async function getGiftCardById({
  admin,
  session,
  giftCardId,
}) {
  if (!giftCardId) {
    return Response.json(
      {
        success: false,
        message:
          "Gift Card ID is required",
      },
      {
        status: 400,
      },
    );
  }

  const giftCard =
    await getGiftCardByIdFromShopify(
      admin,
      giftCardId,
    );

  return Response.json({
    success: true,

    giftCard,
  });
}

// ============================================================
// CREATE GIFT CARD
// ============================================================

export async function createGiftCard({
  admin,
  session,
  giftCardData,
}) {
  if (!giftCardData) {
    return Response.json(
      {
        success: false,
        message:
          "Gift Card data is required",
      },
      {
        status: 400,
      },
    );
  }

  await connectDB();

  const createdGiftCard =
    await createGiftCardOnShopify(
      admin,
      giftCardData,
    );

  const giftCardCode =
    createdGiftCard.giftCardCode ||
    "";

  console.log(
    "========================================",
  );

  console.log(
    "GIFT CARD CREATED:",
    createdGiftCard.id,
  );

  console.log(
    "GIFT CARD CODE:",
    giftCardCode,
  );

  console.log(
    "========================================",
  );

  const mongoData =
    mapGiftCardToMongo(
      createdGiftCard,
      session.shop,
      giftCardCode,
    );

  const savedGiftCard =
    await GiftCard.findOneAndUpdate(
      {
        shop: session.shop,
        shopifyId:
          createdGiftCard.id,
      },

      mongoData,

      {
        upsert: true,
        returnDocument: "after",
      },
    );

  return Response.json({
    success: true,

    message:
      "Gift card created successfully",

    giftCard:
      savedGiftCard,

    // IMPORTANT:
    // Full code returned only at creation.
    giftCardCode,
  });
}

// ============================================================
// UPDATE GIFT CARD
// ============================================================

export async function updateGiftCard({
  admin,
  session,
  giftCardData,
}) {
  if (!giftCardData?.giftCardId) {
    return Response.json(
      {
        success: false,
        message:
          "Gift Card ID is required",
      },
      {
        status: 400,
      },
    );
  }

  await connectDB();

  const updatedGiftCard =
    await updateGiftCardOnShopify(
      admin,
      giftCardData,
    );

  // ----------------------------------------------------------
  // IMPORTANT:
  // Preserve the existing full gift card code.
  // Shopify does not return the full code on update.
  // ----------------------------------------------------------

  const existingGiftCard =
    await GiftCard.findOne({
      shop: session.shop,
      shopifyId:
        updatedGiftCard.id,
    });

  const existingCode =
    existingGiftCard?.code || "";

  const mongoData =
    mapGiftCardToMongo(
      updatedGiftCard,
      session.shop,
      existingCode,
    );

  const savedGiftCard =
    await GiftCard.findOneAndUpdate(
      {
        shop: session.shop,
        shopifyId:
          updatedGiftCard.id,
      },

      {
        $set: mongoData,
      },

      {
        upsert: true,
        returnDocument: "after",
      },
    );

  return Response.json({
    success: true,

    message:
      "Gift card updated successfully",

    giftCard:
      savedGiftCard,
  });
}

// ============================================================
// DEACTIVATE GIFT CARD
// ============================================================

export async function deactivateGiftCard({
  admin,
  session,
  giftCardId,
}) {
  if (!giftCardId) {
    return Response.json(
      {
        success: false,
        message:
          "Gift Card ID is required",
      },
      {
        status: 400,
      },
    );
  }

  await connectDB();

  const giftCard =
    await deactivateGiftCardOnShopify(
      admin,
      giftCardId,
    );

  const savedGiftCard =
    await GiftCard.findOneAndUpdate(
      {
        shop: session.shop,
        shopifyId:
          giftCard.id,
      },

      {
        $set: {
          enabled: false,

          shopifyUpdatedAt:
            new Date(),
        },
      },

      {
        returnDocument: "after",
      },
    );

  return Response.json({
    success: true,

    message:
      "Gift card deactivated successfully",

    giftCard:
      savedGiftCard,
  });
}