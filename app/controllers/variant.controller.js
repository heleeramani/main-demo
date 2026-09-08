import { connectDB } from "../db.server";

import {
  getProductVariants,
  createProductVariants as createVariantsOnShopify,
  updateProductVariants as updateVariantsOnShopify,
  deleteProductVariants as deleteVariantsOnShopify,
} from "../services/variant.service";

import ProductVariant from "../models/ProductVariant";


// ============================================================
// SYNC PRODUCT VARIANTS
// ============================================================
// Shopify → MongoDB
//
// Fetch all variants of a product from Shopify
// and save them into MongoDB.
// ============================================================

export async function syncProductVariants({
  admin,
  session,
  productId,
}) {
  // Connect to MongoDB
  await connectDB();

  // Get product + variants from Shopify
  const product = await getProductVariants(
    admin,
    productId
  );

  // Get the actual variant array
  const variants = product.variants.nodes;

  // This array will contain MongoDB saved variants
  const savedVariants = [];

  // Loop through every Shopify variant
  for (const variant of variants) {

    // Find existing variant using shop + Shopify ID
    // If found → update it
    // If not found → create it
    const savedVariant =
      await ProductVariant.findOneAndUpdate(
        {
          shop: session.shop,
          shopifyId: variant.id,
        },

        {
          shop: session.shop,

          shopifyId: variant.id,

          productShopifyId: product.id,

          title: variant.title,

          price: variant.price,

          compareAtPrice:
            variant.compareAtPrice || null,

          sku: variant.sku || "",

          barcode: variant.barcode || "",

          inventoryQuantity:
            variant.inventoryQuantity || 0,

          availableForSale:
            variant.availableForSale || false,

          selectedOptions:
            variant.selectedOptions || [],
        },

        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
        }
      );

    // Add saved variant to array
    savedVariants.push(savedVariant);
  }

  // Remove orphaned variants from MongoDB that were deleted or replaced in Shopify
  const currentVariantIds = variants.map((variant) => variant.id);
  await ProductVariant.deleteMany({
    shop: session.shop,
    productShopifyId: product.id,
    shopifyId: { $nin: currentVariantIds },
  });

  // Return response to frontend
  return Response.json({
    success: true,

    message:
      "Product variants synced successfully",

    product: {
      id: product.id,
      title: product.title,
      options: product.options || [],
    },

    count: savedVariants.length,

    data: savedVariants,
  });
}


// ============================================================
// CREATE PRODUCT VARIANTS
// ============================================================
// Shopify → Create variants
// MongoDB → Save created variants
// ============================================================

export async function createProductVariants({
  admin,
  session,
  productId,
  variants,
}) {
  // Connect to MongoDB
  await connectDB();

  // Create variants on Shopify using service
  const result = await createVariantsOnShopify(
    admin,
    productId,
    variants
  );

  const createdVariants = result.productVariants || [];
  const savedVariants = [];

  // Save each created variant to MongoDB
  for (const variant of createdVariants) {
    const savedVariant = await ProductVariant.findOneAndUpdate(
      {
        shop: session.shop,
        shopifyId: variant.id,
      },
      {
        shop: session.shop,
        shopifyId: variant.id,
        productShopifyId: result.product?.id || productId,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice || null,
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        inventoryQuantity: variant.inventoryQuantity || 0,
        availableForSale: variant.availableForSale || false,
        selectedOptions: variant.selectedOptions || [],
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    savedVariants.push(savedVariant);
  }

  return Response.json({
    success: true,
    message: "Product variants created successfully",
    product: result.product,
    data: savedVariants,
  });
}


// ============================================================
// UPDATE PRODUCT VARIANTS
// ============================================================
// Shopify → Update variants
// MongoDB → Update saved variants
// ============================================================

export async function updateProductVariants({
  admin,
  session,
  productId,
  variants,
}) {
  // Connect to MongoDB
  await connectDB();

  // Update variants on Shopify using service
  const result = await updateVariantsOnShopify(
    admin,
    productId,
    variants
  );

  const updatedVariants = result.productVariants || [];
  const savedVariants = [];

  // Update each variant in MongoDB
  for (const variant of updatedVariants) {
    const savedVariant = await ProductVariant.findOneAndUpdate(
      {
        shop: session.shop,
        shopifyId: variant.id,
      },
      {
        shop: session.shop,
        shopifyId: variant.id,
        productShopifyId: result.product?.id || productId,
        title: variant.title,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice || null,
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        inventoryQuantity: variant.inventoryQuantity || 0,
        availableForSale: variant.availableForSale || false,
        selectedOptions: variant.selectedOptions || [],
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    savedVariants.push(savedVariant);
  }

  return Response.json({
    success: true,
    message: "Product variants updated successfully",
    product: result.product,
    data: savedVariants,
  });
}


// ============================================================
// DELETE PRODUCT VARIANTS
// ============================================================
// Shopify → Delete variants
// MongoDB → Delete same variants
// ============================================================

export async function deleteProductVariants({
  admin,
  session,
  productId,
  variantsIds,
}) {
  // Connect MongoDB
  await connectDB();

  // Delete variants from Shopify
  const result =
    await deleteVariantsOnShopify(
      admin,
      productId,
      variantsIds
    );

  // Make sure Shopify returned product
  if (!result.product) {
    throw new Error(
      "Product variants were not deleted from Shopify"
    );
  }

  // Delete same variants from MongoDB
  await ProductVariant.deleteMany({
    shop: session.shop,

    shopifyId: {
      $in: variantsIds,
    },
  });

  // Return successful response
  return Response.json({
    success: true,

    message:
      "Product variants deleted successfully",

    deletedVariantIds: variantsIds,
  });
}