import { connectDB } from "../db.server";

import Metaobject from "../models/Metaobject";


// ============================================================
// MAP SHOPIFY WEBHOOK METAOBJECT
// ============================================================

function mapWebhookMetaobject(
  shop,
  payload,
  existing = {},
) {
  const values =
    payload?.fields &&
    typeof payload.fields === "object" &&
    !Array.isArray(payload.fields)
      ? payload.fields
      : {};

  const fields = Object.entries(
    values,
  ).map(([key, value]) => ({
    key,

    value:
      typeof value === "string"
        ? value
        : JSON.stringify(value),

    jsonValue:
      typeof value === "string"
        ? value
        : JSON.stringify(value),

    type: "",
  }));

  return {
    shop,

    shopifyId:
      payload.id,

    definitionId:
      payload.definition_id ||
      existing.definitionId ||
      "",

    type:
      payload.type ||
      existing.type ||
      "",

    handle:
      payload.handle ||
      existing.handle ||
      "",

    displayName:
      payload.display_name ||
      existing.displayName ||
      "",

    // --------------------------------------------------------
    // Keep product relationship if it already exists
    // --------------------------------------------------------

    productId:
      existing.productId ||
      "",

    productTitle:
      existing.productTitle ||
      "",

    referenceNamespace:
      existing.referenceNamespace ||
      "",

    referenceKey:
      existing.referenceKey ||
      "",

    fields,

    capabilities: {
      publishable: {
        status:
          payload.capabilities
            ?.publishable
            ?.status ||
          existing.capabilities
            ?.publishable
            ?.status ||
          "",
      },
    },

    createdAtShopify:
      payload.created_at ||
      existing.createdAtShopify ||
      null,

    updatedAtShopify:
      payload.updated_at ||
      existing.updatedAtShopify ||
      null,
  };
}


// ============================================================
// CREATE METAOBJECT WEBHOOK
// ============================================================

export async function handleMetaobjectCreate(
  shop,
  payload,
) {
  if (!payload?.id) {
    throw new Error(
      "Metaobject ID is missing",
    );
  }

  await connectDB();

  const existing =
    await Metaobject.findOne({
      shop,
      shopifyId:
        payload.id,
    });

  const data =
    mapWebhookMetaobject(
      shop,
      payload,
      existing || {},
    );

  const metaobject =
    await Metaobject.findOneAndUpdate(
      {
        shop,
        shopifyId:
          payload.id,
      },

      data,

      {
        upsert: true,
        returnDocument: "after",
      },
    );

  console.log(
    "Metaobject created/synced:",
    metaobject.shopifyId,
  );

  return metaobject;
}


// ============================================================
// UPDATE METAOBJECT WEBHOOK
// ============================================================

export async function handleMetaobjectUpdate(
  shop,
  payload,
) {
  if (!payload?.id) {
    throw new Error(
      "Metaobject ID is missing",
    );
  }

  await connectDB();

  const existing =
    await Metaobject.findOne({
      shop,
      shopifyId:
        payload.id,
    });

  const data =
    mapWebhookMetaobject(
      shop,
      payload,
      existing || {},
    );

  const metaobject =
    await Metaobject.findOneAndUpdate(
      {
        shop,
        shopifyId:
          payload.id,
      },

      data,

      {
        upsert: true,
        returnDocument: "after",
      },
    );

  console.log(
    "Metaobject updated/synced:",
    metaobject.shopifyId,
  );

  return metaobject;
}


// ============================================================
// DELETE METAOBJECT WEBHOOK
// ============================================================

export async function handleMetaobjectDelete(
  shop,
  payload,
) {
  if (!payload?.id) {
    throw new Error(
      "Metaobject ID is missing",
    );
  }

  await connectDB();

  const deleted =
    await Metaobject.findOneAndDelete({
      shop,
      shopifyId:
        payload.id,
    });

  console.log(
    "Metaobject deleted:",
    payload.id,
  );

  return deleted;
}