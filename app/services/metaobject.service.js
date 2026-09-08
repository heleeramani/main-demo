// ============================================================
// METAOBJECT SERVICE
// ============================================================


// ============================================================
// SANITIZE FIELD KEY
// ============================================================
// Metaobject field keys must be lowercase alphanumeric/underscore only.

function sanitizeFieldKey(key) {
  return (key || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ============================================================
// GET METAOBJECT DEFINITIONS
// ============================================================

export async function getMetaobjectDefinitions(admin) {
  const response = await admin.graphql(
    `#graphql
      query MetaobjectDefinitions {
        metaobjectDefinitions(first: 50) {
          nodes {
            id
            name
            type
            description

            fieldDefinitions {
              key
              name

              type {
                name
              }
            }

            createdAt
            updatedAt
          }
        }
      }
    `,
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  return result.data?.metaobjectDefinitions?.nodes || [];
}


// ============================================================
// CREATE METAOBJECT DEFINITION
// ============================================================

export async function createMetaobjectDefinition(
  admin,
  definitionData,
) {
  if (!definitionData?.name) {
    throw new Error("Metaobject definition name is required");
  }

  if (!definitionData?.type) {
    throw new Error("Metaobject definition type is required");
  }

  if (
    !Array.isArray(definitionData.fieldDefinitions) ||
    definitionData.fieldDefinitions.length === 0
  ) {
    throw new Error("At least one field definition is required");
  }

  const response = await admin.graphql(
    `#graphql
      mutation CreateMetaobjectDefinition(
        $definition: MetaobjectDefinitionCreateInput!
      ) {
        metaobjectDefinitionCreate(
          definition: $definition
        ) {
          metaobjectDefinition {
            id
            name
            type
            description

            fieldDefinitions {
              key
              name

              type {
                name
              }
            }

            createdAt
            updatedAt
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
        definition: {
          name: definitionData.name,
          type: definitionData.type,
          description: definitionData.description || "",

          fieldDefinitions:
            definitionData.fieldDefinitions.map((field) => ({
              key: sanitizeFieldKey(field.key),
              name: field.name,
              type: field.type,
            })),
        },
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  const payload =
    result.data?.metaobjectDefinitionCreate;

  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).join(", "),
    );
  }

  if (!payload?.metaobjectDefinition) {
    throw new Error(
      "Shopify did not return the created metaobject definition",
    );
  }

  return payload.metaobjectDefinition;
}


// ============================================================
// GET METAOBJECTS BY TYPE
// ============================================================

export async function getMetaobjects(admin, type) {
  if (!type) {
    throw new Error("Metaobject type is required");
  }

  const response = await admin.graphql(
    `#graphql
      query Metaobjects($type: String!) {
        metaobjects(
          type: $type
          first: 100
        ) {
          nodes {
            id
            type
            handle
            displayName
            values
            createdAt
            updatedAt

            capabilities {
              publishable {
                status
              }
            }
          }
        }
      }
    `,
    {
      variables: {
        type,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  return result.data?.metaobjects?.nodes || [];
}


// ============================================================
// GET SINGLE METAOBJECT
// ============================================================

export async function getMetaobjectById(
  admin,
  metaobjectId,
) {
  if (!metaobjectId) {
    throw new Error("Metaobject ID is required");
  }

  const response = await admin.graphql(
    `#graphql
      query Metaobject($id: ID!) {
        metaobject(id: $id) {
          id
          type
          handle
          displayName
          values
          createdAt
          updatedAt

          capabilities {
            publishable {
              status
            }
          }
        }
      }
    `,
    {
      variables: {
        id: metaobjectId,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  if (!result.data?.metaobject) {
    throw new Error("Metaobject not found");
  }

  return result.data.metaobject;
}


// ============================================================
// CREATE METAOBJECT
// ============================================================

export async function createMetaobject(
  admin,
  metaobjectData,
) {
  if (!metaobjectData?.type) {
    throw new Error("Metaobject type is required");
  }

  if (
    !metaobjectData?.values ||
    typeof metaobjectData.values !== "object" ||
    Array.isArray(metaobjectData.values)
  ) {
    throw new Error(
      "Metaobject values must be an object",
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation CreateMetaobject(
        $metaobject: MetaobjectCreateInput!
      ) {
        metaobjectCreate(
          metaobject: $metaobject
        ) {
          metaobject {
            id
            type
            handle
            displayName
            values
            createdAt
            updatedAt

            capabilities {
              publishable {
                status
              }
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
        metaobject: {
          type: metaobjectData.type,

          // Do NOT send handle.
          // Shopify generates a valid unique handle.
          values: metaobjectData.values,
        },
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  const payload = result.data?.metaobjectCreate;

  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).join(", "),
    );
  }

  if (!payload?.metaobject) {
    throw new Error(
      "Shopify did not return the created metaobject",
    );
  }

  return payload.metaobject;
}


// ============================================================
// UPDATE METAOBJECT
// ============================================================

export async function updateMetaobject(
  admin,
  metaobjectId,
  metaobjectData,
) {
  if (!metaobjectId) {
    throw new Error("Metaobject ID is required");
  }

  if (
    metaobjectData.values &&
    (
      typeof metaobjectData.values !== "object" ||
      Array.isArray(metaobjectData.values)
    )
  ) {
    throw new Error(
      "Metaobject values must be an object",
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation UpdateMetaobject(
        $id: ID!
        $metaobject: MetaobjectUpdateInput!
      ) {
        metaobjectUpdate(
          id: $id
          metaobject: $metaobject
        ) {
          metaobject {
            id
            type
            handle
            displayName
            values
            updatedAt

            capabilities {
              publishable {
                status
              }
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
        id: metaobjectId,

        metaobject: {
          ...(metaobjectData.values
            ? {
                values: metaobjectData.values,
              }
            : {}),
        },
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  const payload = result.data?.metaobjectUpdate;

  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).join(", "),
    );
  }

  if (!payload?.metaobject) {
    throw new Error(
      "Shopify did not return the updated metaobject",
    );
  }

  return payload.metaobject;
}


// ============================================================
// DELETE METAOBJECT
// ============================================================

export async function deleteMetaobject(
  admin,
  metaobjectId,
) {
  if (!metaobjectId) {
    throw new Error("Metaobject ID is required");
  }

  const response = await admin.graphql(
    `#graphql
      mutation DeleteMetaobject(
        $id: ID!
      ) {
        metaobjectDelete(id: $id) {
          deletedId

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
        id: metaobjectId,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", "),
    );
  }

  const payload = result.data?.metaobjectDelete;

  const userErrors = payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).join(", "),
    );
  }

  return {
    deletedId: payload?.deletedId,
  };
}


// ============================================================
// ENSURE PRODUCT METAFIELD DEFINITION
// ============================================================

export async function ensureProductMetaobjectMetafieldDefinition(
  admin,
  metaobjectDefinition,
) {
  if (!metaobjectDefinition?.id) {
    throw new Error(
      "Metaobject definition ID is required",
    );
  }

  if (!metaobjectDefinition?.type) {
    throw new Error(
      "Metaobject definition type is required",
    );
  }

  const namespace = "custom";

  const key =
    `metaobject_${metaobjectDefinition.type}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");

  // ----------------------------------------------------------
  // CHECK EXISTING PRODUCT METAFIELD DEFINITION
  // ----------------------------------------------------------

  const existingResponse = await admin.graphql(
    `#graphql
      query ProductMetafieldDefinitions {
        metafieldDefinitions(
          ownerType: PRODUCT
          first: 250
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
  );

  const existingResult =
    await existingResponse.json();

  if (existingResult.errors) {
    throw new Error(
      existingResult.errors
        .map((error) => error.message)
        .join(", "),
    );
  }

  const existingDefinition =
    existingResult.data?.metafieldDefinitions?.nodes?.find(
      (definition) =>
        definition.namespace === namespace &&
        definition.key === key,
    );

  if (existingDefinition) {
    return existingDefinition;
  }

  // ----------------------------------------------------------
  // CREATE PRODUCT METAFIELD DEFINITION
  // ----------------------------------------------------------

  const response = await admin.graphql(
    `#graphql
      mutation CreateProductMetaobjectReferenceDefinition(
        $definition: MetafieldDefinitionInput!
      ) {
        metafieldDefinitionCreate(
          definition: $definition
        ) {
          createdDefinition {
            id
            name
            namespace
            key

            type {
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
        definition: {
          name:
            `${metaobjectDefinition.name} Metaobject`,

          namespace,

          key,

          description:
            `Reference to ${metaobjectDefinition.name} metaobject`,

          type: "metaobject_reference",

          ownerType: "PRODUCT",

          validations: [
            {
              name: "metaobject_definition_id",
              value: metaobjectDefinition.id,
            },
          ],
        },
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", "),
    );
  }

  const payload =
    result.data?.metafieldDefinitionCreate;

  const userErrors =
    payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", "),
    );
  }

  if (!payload?.createdDefinition) {
    throw new Error(
      "Shopify did not return the created metafield definition",
    );
  }

  return payload.createdDefinition;
}


// ============================================================
// LINK METAOBJECT TO PRODUCT
// ============================================================

export async function linkMetaobjectToProduct(
  admin,
  productId,
  metaobject,
  metaobjectDefinition,
) {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!metaobject?.id) {
    throw new Error("Metaobject ID is required");
  }

  const definition =
    await ensureProductMetaobjectMetafieldDefinition(
      admin,
      metaobjectDefinition,
    );

  const response = await admin.graphql(
    `#graphql
      mutation SetProductMetaobjectReference(
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
            ownerType
            updatedAt
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
            ownerId: productId,
            namespace: definition.namespace,
            key: definition.key,
            type: "metaobject_reference",
            value: metaobject.id,
          },
        ],
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", "),
    );
  }

  const payload = result.data?.metafieldsSet;

  const userErrors =
    payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", "),
    );
  }

  return {
    ...metaobject,

    productId,

    referenceNamespace:
      definition.namespace,

    referenceKey:
      definition.key,
  };
}


// ============================================================
// GET PRODUCT METAOBJECT REFERENCES
// ============================================================

export async function getProductMetaobjectReferences(
  admin,
  productId,
) {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  const response = await admin.graphql(
    `#graphql
      query ProductMetaobjectReferences(
        $productId: ID!
      ) {
        product(id: $productId) {
          id
          title

          metafields(first: 100) {
            nodes {
              id
              namespace
              key
              value
              type
              jsonValue
              createdAt
              updatedAt

              reference {
                __typename

                ... on Metaobject {
                  id
                  type
                  handle
                  displayName
                  values
                }
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
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", "),
    );
  }

  const product =
    result.data?.product;

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    productId: product.id,
    productTitle: product.title,
    metafields:
      product.metafields?.nodes || [],
  };
}


// ============================================================
// DELETE PRODUCT METAOBJECT REFERENCE
// ============================================================

export async function unlinkMetaobjectFromProduct(
  admin,
  productId,
  namespace,
  key,
) {
  if (!productId) {
    throw new Error("Product ID is required");
  }

  if (!namespace || !key) {
    throw new Error(
      "Metafield namespace and key are required",
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation DeleteProductMetaobjectReference(
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
            ownerId: productId,
            namespace,
            key,
          },
        ],
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", "),
    );
  }

  const payload =
    result.data?.metafieldsDelete;

  const userErrors =
    payload?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", "),
    );
  }

  return payload.deletedMetafields || [];
}