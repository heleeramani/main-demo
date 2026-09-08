// ============================================================
// GET PRODUCT METAFIELDS
// ============================================================

export async function getMetafields(admin, ownerId, ownerType = "PRODUCT") {
  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  if (ownerType !== "PRODUCT") {
    throw new Error(`Unsupported owner type: ${ownerType}`);
  }

  const response = await admin.graphql(
    `#graphql
      query GetProductMetafields($ownerId: ID!) {
        product(id: $ownerId) {
          id

          metafields(first: 100) {
            nodes {
              id
              namespace
              key
              value
              type
              jsonValue
              ownerType
              createdAt
              updatedAt

              definition {
                id
                name
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        ownerId,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify metafields GraphQL errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const product = result.data?.product;

  if (!product) {
    throw new Error("Product not found in Shopify");
  }

  return product.metafields?.nodes || [];
}

// ============================================================
// GET METAFIELD DEFINITIONS
// ============================================================

export async function getMetafieldDefinitions(admin, ownerType = "PRODUCT") {
  const response = await admin.graphql(
    `#graphql
      query MetafieldDefinitions(
        $ownerType: MetafieldOwnerType!
        $first: Int
      ) {
        metafieldDefinitions(
          ownerType: $ownerType
          first: $first
        ) {
          nodes {
            id
            name
            namespace
            key

            type {
              name
            }
          }
        }
      }
    `,
    {
      variables: {
        ownerType,
        first: 100,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify metafield definitions errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  return result.data?.metafieldDefinitions?.nodes || [];
}

// ============================================================
// SET / CREATE / UPDATE METAFIELD
// ============================================================

export async function setMetafield(admin, metafieldData) {
  if (!metafieldData) {
    throw new Error("Metafield data is required");
  }

  const { ownerId, namespace, key, type, value } = metafieldData;

  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  if (!namespace) {
    throw new Error("Namespace is required");
  }

  if (!key) {
    throw new Error("Key is required");
  }

  if (!type) {
    throw new Error("Metafield type is required");
  }

  if (value === undefined || value === null) {
    throw new Error("Metafield value is required");
  }

  const response = await admin.graphql(
    `#graphql
      mutation MetafieldsSet(
        $metafields: [MetafieldsSetInput!]!
      ) {
        metafieldsSet(
          metafields: $metafields
        ) {
          metafields {
            id
            namespace
            key
            value
            type
            jsonValue
            ownerType
            createdAt
            updatedAt

            definition {
              id
              name
            }
          }

          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId,
            namespace,
            key,
            type,
            value: String(value),
          },
        ],
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify metafieldsSet errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const payload = result.data?.metafieldsSet;

  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    console.error("Shopify metafieldsSet user errors:", userErrors);

    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  const metafield = payload?.metafields?.[0];

  if (!metafield) {
    throw new Error("Shopify did not return the metafield");
  }

  return metafield;
}

// ============================================================
// DELETE METAFIELD
// ============================================================

export async function deleteMetafield(admin, ownerId, namespace, key) {
  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  if (!namespace) {
    throw new Error("Namespace is required");
  }

  if (!key) {
    throw new Error("Metafield key is required");
  }

  const response = await admin.graphql(
    `#graphql
      mutation MetafieldsDelete(
        $metafields: [MetafieldIdentifierInput!]!
      ) {
        metafieldsDelete(
          metafields: $metafields
        ) {
          deletedMetafields {
            key
            namespace
            ownerId
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
        metafields: [
          {
            ownerId,
            namespace,
            key,
          },
        ],
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify metafieldsDelete errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const payload = result.data?.metafieldsDelete;

  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    console.error("Shopify metafieldsDelete user errors:", userErrors);

    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  return payload?.deletedMetafields || [];
}
