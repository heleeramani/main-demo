import Metafield from "../models/Metafield";

import {
  getMetafields,
  getMetafieldDefinitions,
  setMetafield,
  deleteMetafield,
} from "../services/metafield.service";

import { connectDB } from "../db.server";

// ============================================================
// MAP SHOPIFY METAFIELD → MONGODB
// ============================================================

function mapMetafieldToMongo(
  metafield,
  shop,
  ownerId,
  ownerType,
) {
  return {
    shop,

    shopifyId: metafield.id,

    ownerId,

    ownerType:
      metafield.ownerType ||
      ownerType ||
      "",

    namespace:
      metafield.namespace || "",

    key:
      metafield.key || "",

    value:
      metafield.value || "",

    type:
      metafield.type || "",

    jsonValue:
      metafield.jsonValue || "",

    definitionId:
      metafield.definition?.id || "",

    definitionName:
      metafield.definition?.name || "",

    createdAtShopify:
      metafield.createdAt
        ? new Date(metafield.createdAt)
        : null,

    updatedAtShopify:
      metafield.updatedAt
        ? new Date(metafield.updatedAt)
        : null,
  };
}

// ============================================================
// GET METAFIELDS
// ============================================================

export async function getMetafieldsController({
  admin,
  session,
  ownerId,
  ownerType = "PRODUCT",
}) {
  if (!ownerId) {
    return Response.json(
      {
        success: false,
        message: "Owner ID is required",
      },
      {
        status: 400,
      },
    );
  }

  await connectDB();

  const metafields =
    await getMetafields(
      admin,
      ownerId,
    );

  const savedMetafields = [];

  for (const metafield of metafields) {
    const mongoData =
      mapMetafieldToMongo(
        metafield,
        session.shop,
        ownerId,
        ownerType,
      );

    const saved =
      await Metafield.findOneAndUpdate(
        {
          shop: session.shop,
          ownerId,
          namespace:
            metafield.namespace,
          key: metafield.key,
        },
        mongoData,
        {
          upsert: true,
          returnDocument: "after",
        },
      );

    savedMetafields.push(saved);
  }

  return Response.json({
    success: true,
    message:
      "Metafields fetched successfully",
    metafields: savedMetafields,
  });
}

// ============================================================
// GET METAFIELD DEFINITIONS
// ============================================================

export async function getDefinitionsController({
  admin,
  ownerType = "PRODUCT",
}) {
  const definitions =
    await getMetafieldDefinitions(
      admin,
      ownerType,
    );

  return Response.json({
    success: true,
    message:
      "Metafield definitions fetched successfully",
    definitions,
  });
}

// ============================================================
// CREATE / UPDATE METAFIELD
// ============================================================

export async function setMetafieldController({
  admin,
  session,
  metafieldData,
}) {
  if (!metafieldData) {
    return Response.json(
      {
        success: false,
        message:
          "Metafield data is required",
      },
      {
        status: 400,
      },
    );
  }

  await connectDB();

  const {
    ownerId,
    ownerType = "PRODUCT",
    namespace,
    key,
    type,
    value,
  } = metafieldData;

  const savedMetafield =
    await setMetafield(
      admin,
      {
        ownerId,
        namespace,
        key,
        type,
        value,
      },
    );

  const mongoData =
    mapMetafieldToMongo(
      savedMetafield,
      session.shop,
      ownerId,
      ownerType,
    );

  const saved =
    await Metafield.findOneAndUpdate(
      {
        shop: session.shop,
        ownerId,
        namespace,
        key,
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
      "Metafield saved successfully",
    metafield: saved,
  });
}

// ============================================================
// DELETE METAFIELD
// ============================================================

export async function deleteMetafieldController({
  admin,
  session,
  ownerId,
  namespace,
  key,
}) {
  if (!ownerId) {
    return Response.json(
      {
        success: false,
        message:
          "Owner ID is required",
      },
      {
        status: 400,
      },
    );
  }

  if (!namespace) {
    return Response.json(
      {
        success: false,
        message:
          "Namespace is required",
      },
      {
        status: 400,
      },
    );
  }

  if (!key) {
    return Response.json(
      {
        success: false,
        message:
          "Key is required",
      },
      {
        status: 400,
      },
    );
  }

  await connectDB();

  const deleted =
    await deleteMetafield(
      admin,
      ownerId,
      namespace,
      key,
    );

  await Metafield.deleteOne({
    shop: session.shop,
    ownerId,
    namespace,
    key,
  });

  return Response.json({
    success: true,
    message:
      "Metafield deleted successfully",
    deleted,
  });
}