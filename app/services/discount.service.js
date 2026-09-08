// ============================================================
// DISCOUNT SERVICE
// ============================================================
// Shopify Discount Code GraphQL operations.
//
// Supports:
// - Get / sync discounts
// - Get single discount
// - Create percentage discount
// - Create fixed amount discount
// - Update discount
// - Delete discount
// ============================================================


// ============================================================
// GET DISCOUNTS
// ============================================================

export async function getDiscounts(admin) {
  const response = await admin.graphql(`
    #graphql
    query GetDiscounts {
      discountNodes(first: 50) {
        edges {
          node {
            id
            discount {
              ... on DiscountCodeBasic {
                title
                status
                startsAt
                endsAt
                usageLimit
                asyncUsageCount
                appliesOncePerCustomer

                codes(first: 1) {
                  nodes {
                    id
                    code
                  }
                }

                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }

                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }

                      appliesOnEachItem
                    }
                  }
                }

                customerSelection {
                  ... on DiscountCustomers {
                    customers {
                      id
                    }
                  }

                  ... on DiscountCustomerAll {
                    allCustomers
                  }
                }

                minimumRequirement {
                  ... on DiscountMinimumSubtotal {
                    greaterThanOrEqualToSubtotal {
                      amount
                      currencyCode
                    }
                  }

                  ... on DiscountMinimumQuantity {
                    greaterThanOrEqualToQuantity
                  }
                }

                combinesWith {
                  orderDiscounts
                  productDiscounts
                  shippingDiscounts
                }

                createdAt
                updatedAt
              }
            }
          }
        }
      }
    }
  `);

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }

  return (
    result.data?.discountNodes?.edges || []
  ).map((edge) => {
    const node = edge.node;

    return {
      id: node.id,
      ...node.discount,
    };
  });
}


// ============================================================
// GET SINGLE DISCOUNT
// ============================================================

export async function getDiscountById(
  admin,
  discountId
) {
  if (!discountId) {
    throw new Error(
      "Discount ID is required"
    );
  }

  const response = await admin.graphql(
    `
      #graphql
      query GetDiscount($id: ID!) {
        discountNode(id: $id) {
          id

          discount {
            ... on DiscountCodeBasic {
              title
              status
              startsAt
              endsAt
              usageLimit
              asyncUsageCount
              appliesOncePerCustomer

              codes(first: 1) {
                nodes {
                  id
                  code
                }
              }

              customerGets {
                value {
                  ... on DiscountPercentage {
                    percentage
                  }

                  ... on DiscountAmount {
                    amount {
                      amount
                      currencyCode
                    }

                    appliesOnEachItem
                  }
                }
              }

              combinesWith {
                orderDiscounts
                productDiscounts
                shippingDiscounts
              }

              createdAt
              updatedAt
            }
          }
        }
      }
    `,
    {
      variables: {
        id: discountId,
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

  const node =
    result.data?.discountNode;

  if (!node?.discount) {
    throw new Error(
      "Discount not found"
    );
  }

  return {
    id: node.id,
    ...node.discount,
  };
}


// ============================================================
// CREATE DISCOUNT
// ============================================================

export async function createDiscount(
  admin,
  discountData
) {
  if (!discountData) {
    throw new Error(
      "Discount data is required"
    );
  }

  const {
    title,
    code,
    discountType,
    percentage,
    fixedAmount,
    startsAt,
    endsAt,
    usageLimit,
    appliesOncePerCustomer,
  } = discountData;


  // ----------------------------------------------------------
  // Basic validation
  // ----------------------------------------------------------

  if (!title?.trim()) {
    throw new Error(
      "Discount title is required"
    );
  }

  if (!code?.trim()) {
    throw new Error(
      "Discount code is required"
    );
  }

  if (!startsAt) {
    throw new Error(
      "Discount start date is required"
    );
  }


  // ----------------------------------------------------------
  // Build customer gets value
  // ----------------------------------------------------------

  let value;


  if (discountType === "percentage") {
    const percentageValue =
      Number(percentage);

    if (
      !Number.isFinite(
        percentageValue
      ) ||
      percentageValue <= 0 ||
      percentageValue > 100
    ) {
      throw new Error(
        "Percentage must be between 0 and 100"
      );
    }

    value = {
      percentage:
        percentageValue / 100,
    };
  } else {
    const amount =
      Number(fixedAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Fixed amount must be greater than 0"
      );
    }

    value = {
      discountAmount: {
        amount: amount.toFixed(2),

        appliesOnEachItem: false,
      },
    };
  }


  // ----------------------------------------------------------
  // Shopify DiscountCodeBasicInput
  // ----------------------------------------------------------

  const input = {
    title: title.trim(),

    code: code.trim(),

    startsAt,

    endsAt:
      endsAt || null,

    customerSelection: {
      all: true,
    },

    customerGets: {
      value,

      items: {
        all: true,
      },
    },

    appliesOncePerCustomer:
      Boolean(
        appliesOncePerCustomer
      ),
  };


  // Only send usageLimit when provided
  if (
    usageLimit !== null &&
    usageLimit !== undefined &&
    usageLimit !== ""
  ) {
    input.usageLimit =
      Number(usageLimit);
  }


  console.log(
    "CREATE DISCOUNT INPUT:",
    JSON.stringify(
      input,
      null,
      2
    )
  );


  // ----------------------------------------------------------
  // Shopify mutation
  // ----------------------------------------------------------

  const response = await admin.graphql(
    `
      #graphql
      mutation CreateDiscount(
        $basicCodeDiscount: DiscountCodeBasicInput!
      ) {
        discountCodeBasicCreate(
          basicCodeDiscount: $basicCodeDiscount
        ) {
          codeDiscountNode {
            id

            codeDiscount {
              ... on DiscountCodeBasic {
                title
                status
                startsAt
                endsAt
                usageLimit
                asyncUsageCount
                appliesOncePerCustomer

                codes(first: 1) {
                  nodes {
                    id
                    code
                  }
                }

                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }

                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }

                      appliesOnEachItem
                    }
                  }
                }

                createdAt
                updatedAt
              }
            }
          }

          userErrors {
            field
            code
            message
          }
        }
      }
    `,
    {
      variables: {
        basicCodeDiscount: input,
      },
    }
  );


  const result =
    await response.json();


  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }


  const userErrors =
    result.data
      ?.discountCodeBasicCreate
      ?.userErrors || [];


  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }


  const created =
    result.data
      ?.discountCodeBasicCreate
      ?.codeDiscountNode;


  if (!created) {
    throw new Error(
      "Shopify did not return the created discount"
    );
  }


  return {
    id: created.id,

    ...created.codeDiscount,
  };
}


// ============================================================
// UPDATE DISCOUNT
// ============================================================

export async function updateDiscount(
  admin,
  discountData
) {
  if (!discountData?.id) {
    throw new Error(
      "Discount ID is required"
    );
  }

  const {
    id,
    title,
    code,
    percentage,
    fixedAmount,
    discountType,
    startsAt,
    endsAt,
    usageLimit,
    appliesOncePerCustomer,
  } = discountData;


  const input = {};


  if (title !== undefined) {
    input.title =
      title.trim();
  }


  if (code !== undefined) {
    input.code =
      code.trim();
  }


  if (startsAt !== undefined) {
    input.startsAt =
      startsAt;
  }


  if (endsAt !== undefined) {
    input.endsAt =
      endsAt || null;
  }


  if (
    usageLimit !== undefined
  ) {
    input.usageLimit =
      usageLimit === "" ||
      usageLimit === null
        ? null
        : Number(usageLimit);
  }


  if (
    appliesOncePerCustomer !==
    undefined
  ) {
    input.appliesOncePerCustomer =
      Boolean(
        appliesOncePerCustomer
      );
  }


  // ----------------------------------------------------------
  // Update discount value
  // ----------------------------------------------------------

  if (discountType === "percentage") {
    const percentageValue =
      Number(percentage);

    if (
      !Number.isFinite(
        percentageValue
      ) ||
      percentageValue <= 0 ||
      percentageValue > 100
    ) {
      throw new Error(
        "Percentage must be between 0 and 100"
      );
    }

    input.customerGets = {
      value: {
        percentage:
          percentageValue / 100,
      },
    };
  }


  if (discountType === "fixed") {
    const amount =
      Number(fixedAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Fixed amount must be greater than 0"
      );
    }

    input.customerGets = {
      value: {
        discountAmount: {
          amount:
            amount.toFixed(2),

          appliesOnEachItem: false,
        },
      },
    };
  }


  console.log(
    "UPDATE DISCOUNT ID:",
    id
  );

  console.log(
    "UPDATE DISCOUNT INPUT:",
    JSON.stringify(
      input,
      null,
      2
    )
  );


  const response = await admin.graphql(
    `
      #graphql
      mutation UpdateDiscount(
        $id: ID!
        $basicCodeDiscount: DiscountCodeBasicInput!
      ) {
        discountCodeBasicUpdate(
          id: $id
          basicCodeDiscount: $basicCodeDiscount
        ) {
          codeDiscountNode {
            id

            codeDiscount {
              ... on DiscountCodeBasic {
                title
                status
                startsAt
                endsAt
                usageLimit
                asyncUsageCount
                appliesOncePerCustomer

                codes(first: 1) {
                  nodes {
                    id
                    code
                  }
                }

                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }

                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }

                      appliesOnEachItem
                    }
                  }
                }

                updatedAt
              }
            }
          }

          userErrors {
            field
            code
            message
          }
        }
      }
    `,
    {
      variables: {
        id,

        basicCodeDiscount:
          input,
      },
    }
  );


  const result =
    await response.json();


  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }


  const userErrors =
    result.data
      ?.discountCodeBasicUpdate
      ?.userErrors || [];


  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }


  const updated =
    result.data
      ?.discountCodeBasicUpdate
      ?.codeDiscountNode;


  if (!updated) {
    throw new Error(
      "Shopify did not return the updated discount"
    );
  }


  return {
    id: updated.id,

    ...updated.codeDiscount,
  };
}


// ============================================================
// DELETE DISCOUNT
// ============================================================

export async function deleteDiscount(
  admin,
  discountId
) {
  if (!discountId) {
    throw new Error(
      "Discount ID is required"
    );
  }


  const response = await admin.graphql(
    `
      #graphql
      mutation DeleteDiscount(
        $id: ID!
      ) {
        discountCodeDelete(
          id: $id
        ) {
          deletedCodeDiscountId

          userErrors {
            field
            code
            message
          }
        }
      }
    `,
    {
      variables: {
        id: discountId,
      },
    }
  );


  const result =
    await response.json();


  if (result.errors) {
    throw new Error(
      result.errors
        .map((error) => error.message)
        .join(", ")
    );
  }


  const userErrors =
    result.data
      ?.discountCodeDelete
      ?.userErrors || [];


  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }


  const deletedId =
    result.data
      ?.discountCodeDelete
      ?.deletedCodeDiscountId;


  if (!deletedId) {
    throw new Error(
      "Shopify did not return the deleted discount ID"
    );
  }


  return {
    deletedId,
  };
}