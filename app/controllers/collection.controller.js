// ============================================================
// COLLECTION CONTROLLER
// ============================================================
// This file connects:
// Route → Controller → Service → Shopify
//
// It also saves and syncs Shopify collection data with MongoDB.
// ============================================================

import { connectDB } from "../db.server";

import {
  getCollections,
  createCollection as createCollectionOnShopify,
  updateCollection as updateCollectionOnShopify,
  addProductsToCollection as addProductsOnShopify,
  removeProductsFromCollection as removeProductsOnShopify,
  deleteCollection as deleteCollectionOnShopify,
} from "../services/collection.service";

import Collection from "../models/Collection";

// ============================================================
// HELPER: Map Shopify Collection → MongoDB Collection Schema
// ============================================================

function mapCollectionData(collection, shop) {
  const isAutomated = Boolean(collection.ruleSet);

  return {
    shop,
    shopifyId: collection.id,
    title: collection.title || "",
    description: collection.description || "",
    descriptionHtml: collection.descriptionHtml || "",
    handle: collection.handle || "",
    collectionType: isAutomated ? "AUTOMATED" : "CUSTOM",
    productsCount: collection.productsCount?.count || 0,
    sortOrder: collection.sortOrder || "",
    image: {
      id: collection.image?.id || "",
      url: collection.image?.url || "",
      altText: collection.image?.altText || "",
    },
    seo: {
      title: collection.seo?.title || "",
      description: collection.seo?.description || "",
    },
    templateSuffix: collection.templateSuffix || "",
    products:
      collection.products?.nodes?.map((product) => ({
        shopifyId: product.id,
        title: product.title || "",
        handle: product.handle || "",
      })) || [],
    conditions:
      collection.ruleSet?.rules?.map((rule) => ({
        field: rule.column,
        relation: rule.relation,
        values: rule.condition ? [rule.condition] : [],
        matchType: collection.ruleSet?.appliedDisjunctively ? "ANY" : "ALL",
      })) || [],
    shopifyUpdatedAt: collection.updatedAt
      ? new Date(collection.updatedAt)
      : null,
  };
}

// ============================================================
// SYNC COLLECTIONS
// ============================================================
// Shopify → MongoDB
// ============================================================

export async function syncCollections({ admin, session }) {
  await connectDB();

  const collections = await getCollections(admin);
  const savedCollections = [];

  for (const collection of collections) {
    const collectionData = mapCollectionData(collection, session.shop);

    const savedCollection = await Collection.findOneAndUpdate(
      {
        shop: session.shop,
        shopifyId: collection.id,
      },
      collectionData,
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    savedCollections.push(savedCollection);
  }

  // Remove orphaned collections from MongoDB that were deleted on Shopify
  const currentCollectionIds = collections.map((col) => col.id);
  await Collection.deleteMany({
    shop: session.shop,
    shopifyId: { $nin: currentCollectionIds },
  });

  return Response.json({
    success: true,
    message: "Collections synced successfully",
    count: savedCollections.length,
    data: savedCollections,
  });
}

// ============================================================
// CREATE COLLECTION (CUSTOM OR AUTOMATED)
// ============================================================

export async function createCollection({ admin, session, collectionData }) {
  await connectDB();

  const collection = await createCollectionOnShopify(admin, collectionData);

  const mappedData = mapCollectionData(collection, session.shop);

  const savedCollection = await Collection.findOneAndUpdate(
    {
      shop: session.shop,
      shopifyId: collection.id,
    },
    mappedData,
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Collection created successfully",
    data: savedCollection,
  });
}

// ============================================================
// UPDATE COLLECTION
// ============================================================

export async function updateCollection({ admin, session, collectionData }) {
  await connectDB();

  const collection = await updateCollectionOnShopify(admin, collectionData);

  const mappedData = mapCollectionData(collection, session.shop);

  const savedCollection = await Collection.findOneAndUpdate(
    {
      shop: session.shop,
      shopifyId: collection.id,
    },
    mappedData,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Collection updated successfully",
    data: savedCollection,
  });
}

// ============================================================
// ADD PRODUCTS TO CUSTOM COLLECTION
// ============================================================

export async function addProductsToCollection({
  admin,
  session,
  collectionId,
  productIds,
}) {
  await connectDB();

  const result = await addProductsOnShopify(admin, collectionId, productIds);

  if (!result.collection) {
    throw new Error("Failed to add products to collection on Shopify");
  }

  const mappedData = mapCollectionData(result.collection, session.shop);

  const savedCollection = await Collection.findOneAndUpdate(
    {
      shop: session.shop,
      shopifyId: collectionId,
    },
    mappedData,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Products added to collection successfully",
    data: savedCollection,
  });
}

// ============================================================
// REMOVE PRODUCTS FROM CUSTOM COLLECTION
// ============================================================

export async function removeProductsFromCollection({
  admin,
  session,
  collectionId,
  productIds,
}) {
  await connectDB();

  const result = await removeProductsOnShopify(admin, collectionId, productIds);

  if (!result.collection) {
    throw new Error("Failed to remove products from collection on Shopify");
  }

  const mappedData = mapCollectionData(result.collection, session.shop);

  const savedCollection = await Collection.findOneAndUpdate(
    {
      shop: session.shop,
      shopifyId: collectionId,
    },
    mappedData,
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Products removed from collection successfully",
    data: savedCollection,
  });
}

// ============================================================
// DELETE COLLECTION
// ============================================================

export async function deleteCollection({ admin, session, collectionId }) {
  await connectDB();

  const result = await deleteCollectionOnShopify(admin, collectionId);

  if (!result.deletedCollectionId) {
    throw new Error("Collection was not deleted from Shopify");
  }

  await Collection.findOneAndDelete({
    shop: session.shop,
    shopifyId: result.deletedCollectionId,
  });

  return Response.json({
    success: true,
    message: "Collection deleted successfully",
    deletedCollectionId: result.deletedCollectionId,
  });
}