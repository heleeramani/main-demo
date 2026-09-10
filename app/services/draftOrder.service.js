// Draft Order fields
const DRAFT_ORDER_FIELDS = `
  id
  name
  status
  email

  customer {
    id
    firstName
    lastName
    displayName
    email
  }

  lineItems(first: 250) {
    nodes {
      id
      name
      title
      quantity

      originalUnitPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }

      sku

      variant {
        id
        title
        sku

        product {
          id
          title
        }
      }
    }
  }

  subtotalPriceSet {
    shopMoney {
      amount
      currencyCode
    }
  }

  totalTaxSet {
    shopMoney {
      amount
      currencyCode
    }
  }

  totalPriceSet {
    shopMoney {
      amount
      currencyCode
    }
  }

  currencyCode

  shippingAddress {
    firstName
    lastName
    company
    address1
    address2
    city
    province
    country
    countryCode
    zip
    phone
  }

  billingAddress {
    firstName
    lastName
    company
    address1
    address2
    city
    province
    country
    countryCode
    zip
    phone
  }

  note2
  tags
  invoiceUrl
  completedAt
  createdAt
  updatedAt
`;


// Get Draft Orders
export async function getDraftOrders(admin) {
  const response = await admin.graphql(
    `#graphql
      query DraftOrders {
        draftOrders(first: 250) {
          nodes {
            ${DRAFT_ORDER_FIELDS}
          }
        }
      }
    `
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return result.data?.draftOrders?.nodes || [];
}


// Get Draft Order By ID
export async function getDraftOrderById(
  admin,
  draftOrderId
) {
  if (!draftOrderId) {
    throw new Error(
      "Draft Order ID is required"
    );
  }

  const response = await admin.graphql(
    `#graphql
      query DraftOrderById($id: ID!) {
        draftOrder(id: $id) {
          ${DRAFT_ORDER_FIELDS}
        }
      }
    `,
    {
      variables: {
        id: draftOrderId,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const draftOrder =
    result.data?.draftOrder;

  if (!draftOrder) {
    throw new Error(
      "Draft Order not found"
    );
  }

  return draftOrder;
}


// Create Draft Order
export async function createDraftOrder(
  admin,
  draftOrderData
) {
  if (!draftOrderData) {
    throw new Error(
      "Draft Order data is required"
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation DraftOrderCreate(
        $input: DraftOrderInput!
      ) {
        draftOrderCreate(
          input: $input
        ) {
          draftOrder {
            ${DRAFT_ORDER_FIELDS}
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
        input: draftOrderData,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data?.draftOrderCreate
      ?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const draftOrder =
    result.data?.draftOrderCreate
      ?.draftOrder;

  if (!draftOrder) {
    throw new Error(
      "Shopify did not return the created Draft Order"
    );
  }

  return draftOrder;
}


// Update Draft Order
export async function updateDraftOrder(
  admin,
  draftOrderId,
  draftOrderData
) {
  if (!draftOrderId) {
    throw new Error(
      "Draft Order ID is required"
    );
  }

  if (!draftOrderData) {
    throw new Error(
      "Draft Order data is required"
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation DraftOrderUpdate(
        $id: ID!
        $input: DraftOrderInput!
      ) {
        draftOrderUpdate(
          id: $id
          input: $input
        ) {
          draftOrder {
            ${DRAFT_ORDER_FIELDS}
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
        id: draftOrderId,
        input: draftOrderData,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data?.draftOrderUpdate
      ?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const draftOrder =
    result.data?.draftOrderUpdate
      ?.draftOrder;

  if (!draftOrder) {
    throw new Error(
      "Shopify did not return the updated Draft Order"
    );
  }

  return draftOrder;
}


// Complete Draft Order
export async function completeDraftOrder(
  admin,
  draftOrderId
) {
  if (!draftOrderId) {
    throw new Error(
      "Draft Order ID is required"
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation DraftOrderComplete(
        $id: ID!
      ) {
        draftOrderComplete(
          id: $id
        ) {
          draftOrder {
            id
            name
            status
            completedAt
            invoiceUrl
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
        id: draftOrderId,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data?.draftOrderComplete
      ?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const draftOrder =
    result.data?.draftOrderComplete
      ?.draftOrder;

  if (!draftOrder) {
    throw new Error(
      "Shopify did not return the completed Draft Order"
    );
  }

  return draftOrder;
}

// Delete Draft Order
export async function deleteDraftOrder(
  admin,
  draftOrderId
) {
  if (!draftOrderId) {
    throw new Error(
      "Draft Order ID is required"
    );
  }

  const response = await admin.graphql(
    `#graphql
      mutation DraftOrderDelete(
        $input: DraftOrderDeleteInput!
      ) {
        draftOrderDelete(
          input: $input
        ) {
          deletedId

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
          id: draftOrderId,
        },
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const userErrors =
    result.data?.draftOrderDelete
      ?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const deletedId =
    result.data?.draftOrderDelete?.deletedId;

  if (!deletedId) {
    throw new Error(
      "Shopify did not return the deleted Draft Order ID"
    );
  }

  return {
    deletedDraftOrderId: deletedId,
  };
}