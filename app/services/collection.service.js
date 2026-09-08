// ============================================================
// COLLECTION SERVICE (SHOPIFY GRAPHQL API)
// ============================================================
// This file handles all Shopify GraphQL operations for Collections.
// ============================================================

const COLLECTION_FRAGMENT = `
  id
  title
  description
  descriptionHtml
  handle
  productsCount {
    count
  }
  sortOrder
  templateSuffix
  updatedAt
  image {
    id
    url
    altText
  }
  seo {
    title
    description
  }
  products(first: 50) {
    nodes {
      id
      title
      handle
    }
  }
  ruleSet {
    appliedDisjunctively
    rules {
      column
      relation
      condition
    }
  }
`;

// ============================================================
// GET ALL COLLECTIONS
// ============================================================

export async function getCollections(admin) {
  const response = await admin.graphql(`
    #graphql
    query GetCollections {
      collections(first: 50) {
        nodes {
          ${COLLECTION_FRAGMENT}
        }
      }
    }
  `);

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  return result.data.collections.nodes;
}

// ============================================================
// GET COLLECTION BY ID
// ============================================================

export async function getCollectionById(admin, collectionId) {
  const response = await admin.graphql(
    `
      #graphql
      query GetCollectionById($id: ID!) {
        collection(id: $id) {
          ${COLLECTION_FRAGMENT}
        }
      }
    `,
    {
      variables: {
        id: collectionId,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  return result.data.collection;
}

// ============================================================
// CREATE COLLECTION (CUSTOM OR AUTOMATED)
// ============================================================

export async function createCollection(admin, collectionData) {
  const input = {
    title: collectionData.title,
    descriptionHtml: collectionData.descriptionHtml || "",
    handle: collectionData.handle || undefined,
  };

  // Automated collection rules
  if (
    collectionData.collectionType === "AUTOMATED" &&
    Array.isArray(collectionData.conditions) &&
    collectionData.conditions.length > 0
  ) {
    input.ruleSet = {
      appliedDisjunctively: collectionData.matchType === "ANY",
      rules: collectionData.conditions.map((condition) => {
        let column = condition.column || condition.field || condition.type || "TAG";
        if (column === "productTag") column = "TAG";
        if (column === "productTitle") column = "TITLE";
        if (column === "productType") column = "TYPE";
        if (column === "productVendor") column = "VENDOR";

        let relation = condition.relation || "EQUALS";
        if (relation === "TAGGED_WITH") relation = "EQUALS";

        const conditionValue = Array.isArray(condition.values)
          ? condition.values[0]
          : condition.value || "";

        return {
          column,
          relation,
          condition: conditionValue,
        };
      }),
    };
  } else if (Array.isArray(collectionData.productIds) && collectionData.productIds.length > 0) {
    // Custom collection initial products
    input.products = collectionData.productIds;
  }

  const response = await admin.graphql(
    `
      #graphql
      mutation CreateCollection($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            ${COLLECTION_FRAGMENT}
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
        input,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data.collectionCreate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  return result.data.collectionCreate.collection;
}

// ============================================================
// UPDATE COLLECTION
// ============================================================

export async function updateCollection(admin, collectionData) {
  const input = {
    id: collectionData.id,
    title: collectionData.title,
    descriptionHtml: collectionData.descriptionHtml || "",
    handle: collectionData.handle || undefined,
  };

  const response = await admin.graphql(
    `
      #graphql
      mutation UpdateCollection($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection {
            ${COLLECTION_FRAGMENT}
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
        input,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data.collectionUpdate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  return result.data.collectionUpdate.collection;
}

// ============================================================
// ADD PRODUCTS TO CUSTOM COLLECTION
// ============================================================

export async function addProductsToCollection(admin, collectionId, productIds) {
  const response = await admin.graphql(
    `
      #graphql
      mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection {
            ${COLLECTION_FRAGMENT}
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
        id: collectionId,
        productIds,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data.collectionAddProducts?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  return result.data.collectionAddProducts;
}

// ============================================================
// REMOVE PRODUCTS FROM CUSTOM COLLECTION
// ============================================================

export async function removeProductsFromCollection(admin, collectionId, productIds) {
  const response = await admin.graphql(
    `
      #graphql
      mutation RemoveProductsFromCollection($id: ID!, $productIds: [ID!]!) {
        collectionRemoveProducts(id: $id, productIds: $productIds) {
          job {
            id
            done
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
        id: collectionId,
        productIds,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data.collectionRemoveProducts?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  // Fetch updated collection after removing products
  const updatedCollection = await getCollectionById(admin, collectionId);

  return {
    collection: updatedCollection,
    job: result.data.collectionRemoveProducts.job,
  };
}

// ============================================================
// DELETE COLLECTION
// ============================================================

export async function deleteCollection(admin, collectionId) {
  const response = await admin.graphql(
    `
      #graphql
      mutation DeleteCollection($input: CollectionDeleteInput!) {
        collectionDelete(input: $input) {
          deletedCollectionId
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
          id: collectionId,
        },
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify GraphQL errors:", result.errors);
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data.collectionDelete?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  return result.data.collectionDelete;
}