// ============================================================
// PRODUCT VARIANT SERVICE
// ============================================================
// This file contains all Shopify GraphQL operations
// related to Product Variants.
// ============================================================


// ============================================================
// GET PRODUCT VARIANTS
// ============================================================

export async function getProductVariants(
  admin,
  productId
) {
  const response = await admin.graphql(
    `
      query GetProductVariants($productId: ID!) {
        product(id: $productId) {
          id
          title

          options {
            id
            name
            position
            values
          }

          variants(first: 100) {
            nodes {
              id
              title
              price
              compareAtPrice
              sku
              barcode
              availableForSale
              inventoryQuantity

              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        productId,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  if (!result.data?.product) {
    throw new Error(
      "Product not found in Shopify"
    );
  }

  return result.data.product;
}


// ============================================================
// CREATE PRODUCT VARIANTS
// ============================================================

export async function createProductVariants(
  admin,
  productId,
  variants
) {
  const shopifyVariants = variants.map(
    (variant) => {
      const {
        sku,
        inventoryItem,
        ...rest
      } = variant;

      const finalVariant = {
        ...rest,
      };

      if (sku !== undefined && sku !== null && sku !== "") {
        finalVariant.inventoryItem = {
          ...(inventoryItem || {}),
          sku,
        };
      } else if (inventoryItem) {
        finalVariant.inventoryItem =
          inventoryItem;
      }

      if (finalVariant.compareAtPrice === null || finalVariant.compareAtPrice === "") {
        delete finalVariant.compareAtPrice;
      }

      if (finalVariant.barcode === null || finalVariant.barcode === "") {
        delete finalVariant.barcode;
      }

      return finalVariant;
    }
  );

  const response = await admin.graphql(
    `
      mutation CreateProductVariants(
        $productId: ID!
        $variants: [ProductVariantsBulkInput!]!
      ) {
        productVariantsBulkCreate(
          productId: $productId
          variants: $variants
        ) {
          product {
            id
            title
          }

          productVariants {
            id
            title
            price
            compareAtPrice
            sku
            barcode
            availableForSale
            inventoryQuantity

            selectedOptions {
              name
              value
            }
          }

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        productId,
        variants: shopifyVariants,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data.productVariantsBulkCreate
      .userErrors;

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return result.data.productVariantsBulkCreate;
}


// ============================================================
// UPDATE PRODUCT VARIANTS
// ============================================================

export async function updateProductVariants(
  admin,
  productId,
  variants
) {
  const shopifyVariants = variants.map(
    (variant) => {
      const {
        sku,
        inventoryItem,
        ...rest
      } = variant;

      const finalVariant = {
        ...rest,
      };

      if (sku !== undefined && sku !== null && sku !== "") {
        finalVariant.inventoryItem = {
          ...(inventoryItem || {}),
          sku,
        };
      } else if (inventoryItem) {
        finalVariant.inventoryItem =
          inventoryItem;
      }

      if (finalVariant.compareAtPrice === "") {
        finalVariant.compareAtPrice = null;
      }

      if (finalVariant.barcode === "") {
        finalVariant.barcode = null;
      }

      return finalVariant;
    }
  );

  const response = await admin.graphql(
    `
      mutation UpdateProductVariants(
        $productId: ID!
        $variants: [ProductVariantsBulkInput!]!
      ) {
        productVariantsBulkUpdate(
          productId: $productId
          variants: $variants
        ) {
          product {
            id
            title
          }

          productVariants {
            id
            title
            price
            compareAtPrice
            sku
            barcode
            availableForSale
            inventoryQuantity

            selectedOptions {
              name
              value
            }
          }

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        productId,
        variants: shopifyVariants,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data.productVariantsBulkUpdate
      .userErrors;

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return result.data.productVariantsBulkUpdate;
}


// ============================================================
// DELETE PRODUCT VARIANTS
// ============================================================

export async function deleteProductVariants(
  admin,
  productId,
  variantsIds
) {
  const response = await admin.graphql(
    `
      mutation DeleteProductVariants(
        $productId: ID!
        $variantsIds: [ID!]!
      ) {
        productVariantsBulkDelete(
          productId: $productId
          variantsIds: $variantsIds
        ) {
          product {
            id
            title
          }

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        productId,
        variantsIds,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data.productVariantsBulkDelete
      .userErrors;

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return result.data.productVariantsBulkDelete;
}