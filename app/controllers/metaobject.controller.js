import { connectDB } from "../db.server";

import {
  getMetaobjectDefinitions,
  createMetaobjectDefinition,
  createMetaobject,
  updateMetaobject,
  deleteMetaobject,
  linkMetaobjectToProduct,
  getProductMetaobjectReferences,
  unlinkMetaobjectFromProduct,
} from "../services/metaobject.service";

import MetaobjectDefinition from "../models/MetaobjectDefinition";
import Metaobject from "../models/Metaobject";

// ============================================================
// MAP DEFINITION
// ============================================================

function mapDefinitionToMongo(shop, definition) {
  return {
    shop,

    shopifyId: definition.id,

    name: definition.name,

    type: definition.type,

    description: definition.description || "",

    fieldDefinitions:
      definition.fieldDefinitions?.map((field) => ({
        key: field.key,
        name: field.name || "",
        type: field.type?.name || "",
      })) || [],

    createdAtShopify: definition.createdAt || null,

    updatedAtShopify: definition.updatedAt || null,
  };
}

// ============================================================
// MAP METAOBJECT TO MONGO
// ============================================================

function mapMetaobjectToMongo(shop, metaobject, extraData = {}) {
  const values =
    metaobject?.values &&
    typeof metaobject.values === "object" &&
    !Array.isArray(metaobject.values)
      ? metaobject.values
      : {};

  const fields = Object.entries(values).map(([key, value]) => ({
    key,

    value: typeof value === "string" ? value : JSON.stringify(value),

    jsonValue: typeof value === "string" ? value : JSON.stringify(value),

    type: "",
  }));

  return {
    shop,

    shopifyId: metaobject.id,

    definitionId: extraData.definitionId || metaobject.definition?.id || "",

    type: metaobject.type || "",

    handle: metaobject.handle || "",

    displayName: metaobject.displayName || "",

    productId: extraData.productId || "",

    productTitle: extraData.productTitle || "",

    referenceNamespace: extraData.referenceNamespace || "",

    referenceKey: extraData.referenceKey || "",

    fields,

    capabilities: {
      publishable: {
        status: metaobject.capabilities?.publishable?.status || "",
      },
    },

    createdAtShopify: metaobject.createdAt || null,

    updatedAtShopify: metaobject.updatedAt || null,
  };
}

// ============================================================
// GET DEFINITIONS
// ============================================================

export async function getMetaobjectDefinitionsController({ admin, shop }) {
  const definitions = await getMetaobjectDefinitions(admin);

  await connectDB();

  for (const definition of definitions) {
    await MetaobjectDefinition.findOneAndUpdate(
      {
        shop,
        shopifyId: definition.id,
      },

      mapDefinitionToMongo(shop, definition),

      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  return definitions;
}

// ============================================================
// CREATE DEFINITION
// ============================================================

export async function createMetaobjectDefinitionController({
  admin,
  shop,
  definitionData,
}) {
  const definition = await createMetaobjectDefinition(admin, definitionData);

  await connectDB();

  const mongoDefinition = await MetaobjectDefinition.findOneAndUpdate(
    {
      shop,
      shopifyId: definition.id,
    },

    mapDefinitionToMongo(shop, definition),

    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return mongoDefinition;
}

// ============================================================
// GET PRODUCT METAOBJECTS
// ============================================================

export async function getProductMetaobjectsController({
  admin,
  shop,
  productId,
}) {
  const result = await getProductMetaobjectReferences(admin, productId);

  await connectDB();

  const metaobjectMetafields = result.metafields.filter(
    (metafield) =>
      metafield.type === "metaobject_reference" &&
      metafield.reference?.__typename === "Metaobject",
  );

  const metaobjects = metaobjectMetafields.map((metafield) => ({
    ...metafield.reference,

    productId: result.productId,

    productTitle: result.productTitle,

    referenceNamespace: metafield.namespace,

    referenceKey: metafield.key,
  }));

  for (const metaobject of metaobjects) {
    await Metaobject.findOneAndUpdate(
      {
        shop,
        shopifyId: metaobject.id,
      },

      mapMetaobjectToMongo(shop, metaobject, {
        productId: result.productId,

        productTitle: result.productTitle,

        referenceNamespace: metaobject.referenceNamespace,

        referenceKey: metaobject.referenceKey,
      }),

      {
        upsert: true,
        returnDocument: "after",
      },
    );
  }

  return metaobjects;
}

// ============================================================
// CREATE PRODUCT METAOBJECT
// ============================================================

export async function createProductMetaobjectController({
  admin,
  shop,
  productId,
  productTitle,
  definitionId,
  metaobjectData,
}) {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!definitionId) {
    throw new Error("Metaobject definition ID is required");
  }

  await connectDB();

  const definition = await MetaobjectDefinition.findOne({
    shop,
    shopifyId: definitionId,
  });

  if (!definition) {
    throw new Error("Metaobject definition not found");
  }

  const metaobject = await createMetaobject(admin, {
    type: definition.type,

    values: metaobjectData?.values || {},
  });

  const linkedMetaobject = await linkMetaobjectToProduct(
    admin,

    productId,

    metaobject,

    {
      id: definition.shopifyId,

      name: definition.name,

      type: definition.type,
    },
  );

  const mongoMetaobject = await Metaobject.findOneAndUpdate(
    {
      shop,
      shopifyId: metaobject.id,
    },

    mapMetaobjectToMongo(shop, linkedMetaobject, {
      definitionId: definition.shopifyId,

      productId,

      productTitle,

      referenceNamespace: linkedMetaobject.referenceNamespace,

      referenceKey: linkedMetaobject.referenceKey,
    }),

    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return mongoMetaobject;
}

// ============================================================
// UPDATE PRODUCT METAOBJECT
// ============================================================

export async function updateProductMetaobjectController({
  admin,
  shop,
  productId,
  metaobjectId,
  metaobjectData,
}) {
  if (!metaobjectId) {
    throw new Error("Metaobject ID is required");
  }

  await connectDB();

  const existing = await Metaobject.findOne({
    shop,
    shopifyId: metaobjectId,
  });

  const metaobject = await updateMetaobject(admin, metaobjectId, {
    values: metaobjectData?.values || {},
  });

  const mongoMetaobject = await Metaobject.findOneAndUpdate(
    {
      shop,
      shopifyId: metaobjectId,
    },

    mapMetaobjectToMongo(shop, metaobject, {
      productId: existing?.productId || productId || "",

      productTitle: existing?.productTitle || "",

      definitionId: existing?.definitionId || "",

      referenceNamespace: existing?.referenceNamespace || "",

      referenceKey: existing?.referenceKey || "",
    }),

    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return mongoMetaobject;
}

// ============================================================
// DELETE PRODUCT METAOBJECT
// ============================================================

export async function deleteProductMetaobjectController({
  admin,
  shop,
  productId,
  metaobjectId,
  namespace,
  key,
}) {
  if (productId && namespace && key) {
    await unlinkMetaobjectFromProduct(admin, productId, namespace, key);
  }

  const result = await deleteMetaobject(admin, metaobjectId);

  await connectDB();

  await Metaobject.findOneAndDelete({
    shop,
    shopifyId: metaobjectId,
  });

  return result;
}