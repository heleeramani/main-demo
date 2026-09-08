import Product from "../models/Product";

/**
 * Convert Shopify product webhook payload
 * into our MongoDB Product structure.
 */
function mapProductWebhookToMongo(product, shop) {
  return {
    shop,

    shopifyId:
      product.admin_graphql_api_id ||
      String(product.id || ""),

    title: product.title || "",

    description: product.body_html || "",

    vendor: product.vendor || "",

    productType: product.product_type || "",

    handle: product.handle || "",

    status: product.status || "",

    // Store product images
    images: Array.isArray(product.images)
      ? product.images.map((image) => ({
          id:
            image.admin_graphql_api_id ||
            String(image.id || ""),

          url: image.src || "",

          altText: image.alt || "",
        }))
      : [],

    // Store product variants
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant) => ({
          shopifyId:
            variant.admin_graphql_api_id ||
            String(variant.id || ""),

          title: variant.title || "",

          price: variant.price || "0.00",

          sku: variant.sku || "",

          inventoryQuantity:
            Number(variant.inventory_quantity) || 0,
        }))
      : [],
  };
}

/**
 * Create or update product in MongoDB.
 *
 * Used for:
 * PRODUCTS_CREATE
 * PRODUCTS_UPDATE
 */
export async function saveProductWebhook({
  shop,
  payload,
}) {
  const productData = mapProductWebhookToMongo(
    payload,
    shop
  );

  console.log("========================================");
  console.log("PRODUCT WEBHOOK → MONGODB");
  console.log("Shop:", shop);
  console.log("Product:", productData.title);
  console.log("Shopify ID:", productData.shopifyId);
  console.log("========================================");

  const product = await Product.findOneAndUpdate(
    {
      shop,
      shopifyId: productData.shopifyId,
    },
    {
      $set: productData,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  console.log(
    "Product saved successfully:",
    product?.title
  );

  return product;
}

/**
 * Delete product from MongoDB.
 *
 * Used for:
 * PRODUCTS_DELETE
 */
export async function deleteProductWebhook({
  shop,
  payload,
}) {
  const shopifyId =
    payload.admin_graphql_api_id ||
    String(payload.id || "");

  console.log("========================================");
  console.log("PRODUCT DELETE WEBHOOK");
  console.log("Shop:", shop);
  console.log("Shopify ID:", shopifyId);
  console.log("========================================");

  const deletedProduct =
    await Product.findOneAndDelete({
      shop,
      shopifyId,
    });

  if (deletedProduct) {
    console.log(
      "Product deleted from MongoDB:",
      deletedProduct.title
    );
  } else {
    console.log(
      "Product was not found in MongoDB:",
      shopifyId
    );
  }

  return deletedProduct;
}