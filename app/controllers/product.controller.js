import { connectDB } from "../db.server";

import {
  getProducts,
  createProduct as createProductOnShopify,
  updateProduct as updateProductOnShopify,
  deleteProduct as deleteProductOnShopify,
  startBulkProductQuery,
  getCurrentBulkOperation,
  downloadBulkProductResults,
} from "../services/product.service";

import Product from "../models/Product";

/**
 * Shared Shopify product -> Mongo document mapping, used by both
 * the regular sync and the bulk operation sync so upsert shape
 * stays in one place.
 */
function buildProductMongoData(product, shop) {
  return {
    shop,
    shopifyId: product.id,
    title: product.title,
    description: product.description,
    vendor: product.vendor,
    productType: product.productType,
    handle: product.handle,
    status: product.status,

    images: (product.media?.nodes || []).map((media) => ({
      id: media.id,
      url: media.image?.url || "",
      altText: media.image?.altText || "",
    })),

    variants: (product.variants?.nodes || []).map((variant) => ({
      shopifyId: variant.id,
      title: variant.title,
      price: variant.price,
      sku: variant.sku || "",
    })),
  };
}

/**
 * Read every synced product straight from MongoDB, with no live
 * Shopify call. Used by the UI to page through the full catalog —
 * the regular sync (and the underlying Shopify `products(first: 50)`
 * query) only ever fetches the first 50 products, so it can't show
 * everything a bulk sync has already stored.
 */
export async function listProducts({ session }) {
  await connectDB();

  const products = await Product.find({
    shop: session.shop,
  }).sort({
    createdAt: -1,
  });

  return Response.json({
    success: true,
    count: products.length,
    data: products,
  });
}

export async function syncProducts({ admin, session }) {
  await connectDB();

  const products = await getProducts(admin);

  const savedProducts = [];

  for (const product of products) {
    const savedProduct = await Product.findOneAndUpdate(
      {
        shopifyId: product.id,
        shop: session.shop,
      },
      buildProductMongoData(product, session.shop),
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    savedProducts.push(savedProduct);
  }

  return Response.json({
    success: true,
    message: "Products synced successfully",
    count: savedProducts.length,
    data: savedProducts,
  });
}

/* =========================================================
   BULK PRODUCT QUERY
========================================================= */

/**
 * 1. Start a bulk product query.
 */
export async function startBulkProductSync({ admin }) {
  const bulkOperation = await startBulkProductQuery(admin);

  return Response.json({
    success: true,
    message: "Bulk product query started",
    data: bulkOperation,
  });
}

/**
 * 2. Check the current bulk operation's status.
 */
export async function checkBulkProductStatus({ admin }) {
  const bulkOperation = await getCurrentBulkOperation(admin);

  if (!bulkOperation) {
    return Response.json(
      {
        success: false,
        message: "No bulk product query has been started",
      },
      {
        status: 404,
      }
    );
  }

  return Response.json({
    success: true,
    data: bulkOperation,
  });
}

/**
 * 3-5. Handle COMPLETED / FAILED / CANCELED, get the result URL,
 * download + parse the JSONL, and sync products into MongoDB.
 */
export async function syncBulkProductResults({ admin, session }) {
  const bulkOperation = await getCurrentBulkOperation(admin);

  if (!bulkOperation) {
    return Response.json(
      {
        success: false,
        message: "No bulk product query has been started",
      },
      {
        status: 404,
      }
    );
  }

  if (bulkOperation.status === "FAILED") {
    return Response.json(
      {
        success: false,
        message: `Bulk product query failed${bulkOperation.errorCode ? ` (${bulkOperation.errorCode})` : ""
          }`,
        data: bulkOperation,
      },
      {
        status: 502,
      }
    );
  }

  if (bulkOperation.status === "CANCELED") {
    return Response.json(
      {
        success: false,
        message: "Bulk product query was canceled",
        data: bulkOperation,
      },
      {
        status: 409,
      }
    );
  }

  if (bulkOperation.status !== "COMPLETED") {
    return Response.json(
      {
        success: false,
        message: `Bulk product query is still ${bulkOperation.status}`,
        data: bulkOperation,
      },
      {
        status: 202,
      }
    );
  }

  if (!bulkOperation.url) {
    return Response.json({
      success: true,
      message: "Bulk product query completed with no results",
      count: 0,
      data: [],
    });
  }

  const products = await downloadBulkProductResults(
    bulkOperation.url
  );

  await connectDB();

  const savedProducts = [];

  for (const product of products) {
    const savedProduct = await Product.findOneAndUpdate(
      {
        shopifyId: product.id,
        shop: session.shop,
      },
      buildProductMongoData(product, session.shop),
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    savedProducts.push(savedProduct);
  }

  return Response.json({
    success: true,
    message: "Bulk product sync completed",
    count: savedProducts.length,
    data: savedProducts,
  });
}

export async function createProduct({ admin, session, productData }) {
  await connectDB();

  const product = await createProductOnShopify(admin, {
  title: productData.title,
  descriptionHtml: productData.description || "",
  vendor: productData.vendor || "",
  productType: productData.productType || "",
});

  const savedProduct = await Product.findOneAndUpdate(
    {
      shopifyId: product.id,
      shop: session.shop,
    },
    {
      shop: session.shop,
      shopifyId: product.id,
      title: product.title,
      description: product.description || "",
      vendor: product.vendor || "",
      productType: product.productType || "",
      handle: product.handle || "",
      status: product.status || "",
      images: [],
      variants: [],
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Product created successfully",
    data: savedProduct,
  });
}

export async function updateProduct({
  admin,
  session,
  productData,
}) {
  await connectDB();

  const product = await updateProductOnShopify(
    admin,
    productData
  );

  const savedProduct = await Product.findOneAndUpdate(
    {
      shopifyId: product.id,
      shop: session.shop,
    },
    {
      title: product.title,
      description: product.description || "",
      vendor: product.vendor || "",
      productType: product.productType || "",
      handle: product.handle || "",
      status: product.status || "",
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Product updated successfully",
    data: savedProduct,
  });
}

export async function deleteProduct({
  admin,
  session,
  productId,
}) {
  await connectDB();

  const result = await deleteProductOnShopify(
    admin,
    productId
  );

  if (!result.deletedProductId) {
    throw new Error(
      "Product was not deleted from Shopify"
    );
  }

  await Product.findOneAndDelete({
    shopifyId: result.deletedProductId,
    shop: session.shop,
  });

  return Response.json({
    success: true,
    message: "Product deleted successfully",
    deletedProductId: result.deletedProductId,
  });
}

