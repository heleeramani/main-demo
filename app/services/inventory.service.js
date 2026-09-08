import { randomUUID } from "node:crypto";


// ============================================================
// GET LOCATIONS
// ============================================================

export async function getLocations(
  admin
) {
  const response =
    await admin.graphql(`
      #graphql
      query GetLocations {
        locations(first: 50) {
          nodes {
            id
            name
            isActive
            address {
              address1
              city
              province
              country
            }
          }
        }
      }
    `);

  const result =
    await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }

  return (
    result.data?.locations?.nodes ||
    []
  );
}


// ============================================================
// GET VARIANT INVENTORY
// ============================================================

export async function getVariantInventory(
  admin,
  variantId
) {
  const response =
    await admin.graphql(
      `
        #graphql
        query GetVariantInventory(
          $variantId: ID!
        ) {
          productVariant(
            id: $variantId
          ) {
            id
            title
            sku

            product {
              id
              title
            }

            inventoryItem {
              id
              tracked

              inventoryLevels(
                first: 50
              ) {
                nodes {
                  id

                  location {
                    id
                    name
                  }

                  quantities(
                    names: [
                      "available"
                      "on_hand"
                      "incoming"
                      "committed"
                      "damaged"
                    ]
                  ) {
                    name
                    quantity
                  }
                }
              }
            }
          }
        }
      `,
      {
        variables: {
          variantId,
        },
      }
    );

  const result =
    await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }

  if (
    !result.data?.productVariant
  ) {
    throw new Error(
      "Product variant not found"
    );
  }

  return (
    result.data.productVariant
  );
}


// ============================================================
// GET INVENTORY
// ============================================================
//
// Reduced query size to avoid Shopify's GraphQL query-cost
// limit.
// ============================================================

export async function getInventory(
  admin
) {
  const response =
    await admin.graphql(`
      #graphql
      query GetInventory {
        products(first: 20) {
          nodes {
            id
            title

            variants(first: 20) {
              nodes {
                id
                title
                sku

                inventoryItem {
                  id
                  tracked

                  inventoryLevels(
                    first: 20
                  ) {
                    nodes {
                      id

                      location {
                        id
                        name
                      }

                      quantities(
                        names: [
                          "available"
                          "on_hand"
                        ]
                      ) {
                        name
                        quantity
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

  const result =
    await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }

  return (
    result.data?.products?.nodes ||
    []
  );
}


// ============================================================
// GET CURRENT AVAILABLE QUANTITY
// ============================================================
//
// Required for InventoryChangeInput.changeFromQuantity.
// ============================================================

export async function getCurrentAvailableQuantity(
  admin,
  inventoryItemId,
  locationId
) {
  const response =
    await admin.graphql(
      `
        #graphql
        query GetCurrentInventoryQuantity(
          $inventoryItemId: ID!
          $locationId: ID!
        ) {
          inventoryItem(
            id: $inventoryItemId
          ) {
            id

            inventoryLevel(
              locationId: $locationId
            ) {
              id

              quantities(
                names: ["available"]
              ) {
                name
                quantity
              }
            }
          }
        }
      `,
      {
        variables: {
          inventoryItemId,
          locationId,
        },
      }
    );

  const result =
    await response.json();

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }

  const quantities =
    result.data?.inventoryItem
      ?.inventoryLevel
      ?.quantities || [];

  const available =
    quantities.find(
      (quantity) =>
        quantity.name ===
        "available"
    );

  return (
    available?.quantity || 0
  );
}


// ============================================================
// ADJUST INVENTORY
// ============================================================

export async function adjustInventory(
  admin,
  inventoryItemId,
  locationId,
  delta,
  reason
) {
  // ----------------------------------------------------------
  // Get current Shopify quantity
  // ----------------------------------------------------------

  const currentQuantity =
    await getCurrentAvailableQuantity(
      admin,
      inventoryItemId,
      locationId
    );


  // ----------------------------------------------------------
  // Generate idempotency key
  // ----------------------------------------------------------

  const idempotencyKey =
    randomUUID();


  // ----------------------------------------------------------
  // GraphQL mutation
  // ----------------------------------------------------------

  const response =
    await admin.graphql(
      `
        #graphql
        mutation AdjustInventory(
          $input: InventoryAdjustQuantitiesInput!
          $idempotencyKey: String!
        ) {
          inventoryAdjustQuantities(
            input: $input
          ) @idempotent(
            key: $idempotencyKey
          ) {
            inventoryAdjustmentGroup {
              createdAt
              reason
              referenceDocumentUri

              changes {
                name
                delta
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
          input: {
            reason,

            name: "available",

            referenceDocumentUri:
              "shopify-demo://inventory-adjustment",

            changes: [
              {
                delta,

                inventoryItemId,

                locationId,

                changeFromQuantity:
                  currentQuantity,
              },
            ],
          },

          idempotencyKey,
        },
      }
    );


  // ----------------------------------------------------------
  // Read response
  // ----------------------------------------------------------

  const result =
    await response.json();


  // ----------------------------------------------------------
  // GraphQL errors
  // ----------------------------------------------------------

  if (result.errors) {
    console.error(
      "Shopify GraphQL errors:",
      result.errors
    );

    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }


  // ----------------------------------------------------------
  // Shopify user errors
  // ----------------------------------------------------------

  const userErrors =
    result.data
      ?.inventoryAdjustQuantities
      ?.userErrors || [];

  if (
    userErrors.length > 0
  ) {
    throw new Error(
      userErrors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }


  return (
    result.data
      .inventoryAdjustQuantities
  );
}


// ============================================================
// GET INVENTORY LEVEL INFO
// ============================================================
//
// Reports whether an inventory item has a level at a given
// location yet, and its current available quantity. Needed
// because a location must be "activated" for an item before
// it can receive quantity via inventoryAdjustQuantities.
// ============================================================

export async function getInventoryLevelInfo(
  admin,
  inventoryItemId,
  locationId
) {
  const response =
    await admin.graphql(
      `
        #graphql
        query GetInventoryLevelInfo(
          $inventoryItemId: ID!
          $locationId: ID!
        ) {
          inventoryItem(
            id: $inventoryItemId
          ) {
            id

            inventoryLevel(
              locationId: $locationId
            ) {
              id

              quantities(
                names: ["available"]
              ) {
                name
                quantity
              }
            }
          }
        }
      `,
      {
        variables: {
          inventoryItemId,
          locationId,
        },
      }
    );

  const result =
    await response.json();

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

  const level =
    result.data?.inventoryItem
      ?.inventoryLevel;

  if (!level) {
    return {
      exists: false,
      quantity: 0,
    };
  }

  const available =
    level.quantities?.find(
      (quantity) =>
        quantity.name === "available"
    );

  return {
    exists: true,
    quantity: available?.quantity ?? 0,
  };
}


// ============================================================
// ACTIVATE INVENTORY AT LOCATION
// ============================================================
//
// Creates an inventory level (starting at 0) for an item at a
// location that isn't tracking it yet, so it can then receive
// quantity via inventoryAdjustQuantities.
// ============================================================

export async function activateInventoryAtLocation(
  admin,
  inventoryItemId,
  locationId
) {
  const idempotencyKey =
    randomUUID();

  const response =
    await admin.graphql(
      `
        #graphql
        mutation ActivateInventoryAtLocation(
          $inventoryItemId: ID!
          $locationId: ID!
          $available: Int
          $idempotencyKey: String!
        ) {
          inventoryActivate(
            inventoryItemId: $inventoryItemId
            locationId: $locationId
            available: $available
          ) @idempotent(
            key: $idempotencyKey
          ) {
            inventoryLevel {
              id
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
          inventoryItemId,
          locationId,
          available: 0,
          idempotencyKey,
        },
      }
    );

  const result =
    await response.json();

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
    result.data?.inventoryActivate
      ?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }
}


// ============================================================
// TRANSFER INVENTORY BETWEEN LOCATIONS
// ============================================================
//
// Moves stock immediately: decrements the source location and
// increments the destination location in a single atomic
// inventoryAdjustQuantities call. Unlike
// inventoryTransferCreateAsReadyToShip (a planned shipment
// that only moves quantity once shipped and received), this
// updates available quantity right away.
// ============================================================

export async function transferInventoryBetweenLocations(
  admin,
  {
    originLocationId,
    destinationLocationId,
    inventoryItemId,
    quantity,
  }
) {

  // ----------------------------------------------------------
  // Current quantity at the source location
  // ----------------------------------------------------------

  const origin =
    await getInventoryLevelInfo(
      admin,
      inventoryItemId,
      originLocationId
    );

  if (!origin.exists) {
    throw new Error(
      "This item is not stocked at the selected source location"
    );
  }

  if (origin.quantity < quantity) {
    throw new Error(
      `Not enough stock. Source location has only ${origin.quantity} available.`
    );
  }


  // ----------------------------------------------------------
  // Current quantity at the destination location
  // (activate it first if it isn't tracked there yet)
  // ----------------------------------------------------------

  let destination =
    await getInventoryLevelInfo(
      admin,
      inventoryItemId,
      destinationLocationId
    );

  if (!destination.exists) {
    await activateInventoryAtLocation(
      admin,
      inventoryItemId,
      destinationLocationId
    );

    destination = {
      exists: true,
      quantity: 0,
    };
  }


  // ----------------------------------------------------------
  // Atomic adjustment: source -quantity, destination +quantity
  // ----------------------------------------------------------

  const idempotencyKey =
    randomUUID();

  const response =
    await admin.graphql(
      `
        #graphql
        mutation TransferInventoryBetweenLocations(
          $input: InventoryAdjustQuantitiesInput!
          $idempotencyKey: String!
        ) {
          inventoryAdjustQuantities(
            input: $input
          ) @idempotent(
            key: $idempotencyKey
          ) {
            inventoryAdjustmentGroup {
              createdAt
              reason

              changes {
                name
                delta
                quantityAfterChange

                location {
                  id
                  name
                }
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
          input: {
            reason: "correction",
            name: "available",

            changes: [
              {
                inventoryItemId,
                locationId: originLocationId,
                delta: -quantity,
                changeFromQuantity: origin.quantity,
              },
              {
                inventoryItemId,
                locationId: destinationLocationId,
                delta: quantity,
                changeFromQuantity: destination.quantity,
              },
            ],
          },

          idempotencyKey,
        },
      }
    );

  const result =
    await response.json();

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
    result.data
      ?.inventoryAdjustQuantities
      ?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return (
    result.data
      .inventoryAdjustQuantities
      .inventoryAdjustmentGroup
  );
}