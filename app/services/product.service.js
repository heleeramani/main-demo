export async function getProducts(admin) {
  const response = await admin.graphql(`
    #graphql
    query GetProducts {
      products(first: 50) {
        nodes {
          id
          title
          description
          vendor
          productType
          handle
          status

          media(first: 10) {
            nodes {
              ... on MediaImage {
                id
                image {
                  url
                  altText
                }
              }
            }
          }

          variants(first: 50) {
            nodes {
              id
              title
              price
              sku
            }
          }
        }
      }
    }
  `);

  const result = await response.json();

  if (result.errors) {
    throw new Error("Failed to fetch products from Shopify");
  }

  return result.data.products.nodes;
}

export async function createProduct(admin, productData) {
  const response = await admin.graphql(
    `
      #graphql
      mutation CreateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            description
            vendor
            productType
            handle
            status
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
        product: productData,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data.productCreate.userErrors;

  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  return result.data.productCreate.product;
}


export async function updateProduct(admin, productData) {
  const response = await admin.graphql(
    `
      #graphql
      mutation UpdateProduct($product: ProductUpdateInput!) {
        productUpdate(product: $product) {
          product {
            id
            title
            description
            vendor
            productType
            handle
            status
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
        product: productData,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);

    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  const userErrors = result.data.productUpdate.userErrors;

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).join(", ")
    );
  }

  return result.data.productUpdate.product;
}

/* =========================================================
   BULK PRODUCT QUERY
   https://shopify.dev/docs/api/usage/bulk-operations/queries
========================================================= */

const BULK_PRODUCT_QUERY = `
  {
    products {
      edges {
        node {
          id
          title
          description
          vendor
          productType
          handle
          status

          media {
            edges {
              node {
                __typename
                id

                ... on MediaImage {
                  image {
                    url
                    altText
                  }
                }
              }
            }
          }

          variants {
            edges {
              node {
                __typename
                id
                title
                price
                sku
              }
            }
          }
        }
      }
    }
  }
`;

export async function startBulkProductQuery(admin) {
  const response = await admin.graphql(
    `
      #graphql
      mutation BulkOperationRunQuery($query: String!) {
        bulkOperationRunQuery(query: $query) {
          bulkOperation {
            id
            status
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
        query: BULK_PRODUCT_QUERY,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);

    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  const userErrors =
    result.data.bulkOperationRunQuery.userErrors;

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).join(", ")
    );
  }

  return result.data.bulkOperationRunQuery.bulkOperation;
}

export async function getCurrentBulkOperation(admin) {
  const response = await admin.graphql(`
    #graphql
    query CurrentBulkOperation {
      currentBulkOperation(type: QUERY) {
        id
        status
        errorCode
        createdAt
        completedAt
        objectCount
        fileSize
        url
        partialDataUrl
      }
    }
  `);

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);

    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  return result.data.currentBulkOperation;
}

export async function downloadBulkProductResults(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download bulk operation result file: ${response.status}`
    );
  }

  const jsonl = await response.text();

  return parseBulkProductJsonl(jsonl);
}

/**
 * Reconstructs product nodes (with nested media/variants) from the
 * flat JSONL bulk result, where child rows are linked to their
 * parent product via `__parentId`.
 */
export function parseBulkProductJsonl(jsonl) {
  const lines = jsonl
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const productsById = new Map();

  for (const line of lines) {
    const node = JSON.parse(line);

    if (!node.__parentId) {
      productsById.set(node.id, {
        ...node,
        media: { nodes: [] },
        variants: { nodes: [] },
      });

      continue;
    }

    const parent = productsById.get(node.__parentId);

    if (!parent) {
      continue;
    }

    if (node.__typename === "MediaImage") {
      parent.media.nodes.push({
        id: node.id,
        image: node.image || null,
      });
    } else if (node.__typename === "ProductVariant") {
      parent.variants.nodes.push({
        id: node.id,
        title: node.title,
        price: node.price,
        sku: node.sku,
      });
    }
  }

  return Array.from(productsById.values());
}

export async function deleteProduct(admin, productId) {
  const response = await admin.graphql(
    `
      #graphql
      mutation DeleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          id: productId,
        },
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
    result.data.productDelete.userErrors;

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return result.data.productDelete;
}

