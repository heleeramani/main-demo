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

