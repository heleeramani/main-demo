// app/services/discount.service.js

// ============================================================
// GET ALL DISCOUNTS
// ============================================================

export async function getDiscounts(admin) {
  const response = await admin.graphql(`
    #graphql
    query GetDiscounts {
      discountNodes(first: 50) {
        nodes {
          id

          discount {
            ... on DiscountCodeBasic {
              id
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
    }
  `);

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify get discounts errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  return (result.data?.discountNodes?.nodes || [])
    .map((node) => node.discount)
    .filter(Boolean);
}

// ============================================================
// GET SINGLE DISCOUNT
// ============================================================

export async function getDiscountById(admin, discountId) {
  if (!discountId) {
    throw new Error("Discount ID is required");
  }

  const response = await admin.graphql(
    `
      #graphql
      query GetDiscountById($id: ID!) {
        discountNode(id: $id) {
          id

          discount {
            ... on DiscountCodeBasic {
              id
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
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify get discount errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const discount = result.data?.discountNode?.discount;

  if (!discount) {
    throw new Error("Discount not found");
  }

  return discount;
}

// ============================================================
// CREATE DISCOUNT
// ============================================================

export async function createDiscount(admin, discountData) {
  if (!discountData) {
    throw new Error("Discount data is required");
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
  // Validate basic fields
  // ----------------------------------------------------------

  if (!title?.trim()) {
    throw new Error("Discount title is required");
  }

  if (!code?.trim()) {
    throw new Error("Discount code is required");
  }

  if (!startsAt) {
    throw new Error("Discount start date is required");
  }

  // ----------------------------------------------------------
  // Build discount value
  // ----------------------------------------------------------

  let value;

  if (discountType === "percentage") {
    const percentageValue = Number(percentage);

    if (
      !Number.isFinite(percentageValue) ||
      percentageValue <= 0 ||
      percentageValue > 100
    ) {
      throw new Error("Percentage must be between 0 and 100");
    }

    value = {
      percentage: percentageValue / 100,
    };
  } else if (discountType === "fixed") {
    const amount = Number(fixedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Fixed amount must be greater than 0");
    }

    value = {
      discountAmount: {
        amount: amount.toFixed(2),
        appliesOnEachItem: false,
      },
    };
  } else {
    throw new Error("Invalid discount type");
  }

  // ----------------------------------------------------------
  // Build Shopify input
  // ----------------------------------------------------------

  const basicCodeDiscount = {
    title: title.trim(),
    code: code.trim(),

    startsAt,

    customerSelection: {
      all: true,
    },

    customerGets: {
      value,

      items: {
        all: true,
      },
    },

    appliesOncePerCustomer: Boolean(appliesOncePerCustomer),
  };

  if (endsAt) {
    basicCodeDiscount.endsAt = endsAt;
  }

  if (usageLimit !== undefined && usageLimit !== null && usageLimit !== "") {
    const limit = Number(usageLimit);

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error("Usage limit must be a positive number");
    }

    basicCodeDiscount.usageLimit = limit;
  }

  console.log(
    "CREATE DISCOUNT INPUT:",
    JSON.stringify(basicCodeDiscount, null, 2),
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
                id
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

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        basicCodeDiscount,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify create discount errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data?.discountCodeBasicCreate?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  const discount =
    result.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount;

  if (!discount) {
    throw new Error("Shopify did not return the created discount");
  }

  console.log("DISCOUNT CREATED:", discount.id);

  return discount;
}

// ============================================================
// UPDATE DISCOUNT
// ============================================================

export async function updateDiscount(admin, discountData) {
  if (!discountData?.discountId) {
    throw new Error("Discount ID is required");
  }

  const {
    discountId,
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

  const input = {};

  // ----------------------------------------------------------
  // Basic fields
  // ----------------------------------------------------------

  if (title !== undefined && title !== null) {
    input.title = title.trim();
  }

  if (code !== undefined && code !== null) {
    input.code = code.trim();
  }

  if (startsAt !== undefined) {
    input.startsAt = startsAt || null;
  }

  if (endsAt !== undefined) {
    input.endsAt = endsAt || null;
  }

  if (usageLimit !== undefined) {
    if (usageLimit === "" || usageLimit === null) {
      input.usageLimit = null;
    } else {
      const limit = Number(usageLimit);

      if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error("Usage limit must be a positive number");
      }

      input.usageLimit = limit;
    }
  }

  if (appliesOncePerCustomer !== undefined) {
    input.appliesOncePerCustomer = Boolean(appliesOncePerCustomer);
  }

  // ----------------------------------------------------------
  // Discount value
  // ----------------------------------------------------------

  if (discountType === "percentage") {
    const percentageValue = Number(percentage);

    if (
      !Number.isFinite(percentageValue) ||
      percentageValue <= 0 ||
      percentageValue > 100
    ) {
      throw new Error("Percentage must be between 0 and 100");
    }

    input.customerGets = {
      value: {
        percentage: percentageValue / 100,
      },
    };
  }

  if (discountType === "fixed") {
    const amount = Number(fixedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Fixed amount must be greater than 0");
    }

    input.customerGets = {
      value: {
        discountAmount: {
          amount: amount.toFixed(2),
          appliesOnEachItem: false,
        },
      },
    };
  }

  console.log("UPDATE DISCOUNT INPUT:", JSON.stringify(input, null, 2));

  // ----------------------------------------------------------
  // Shopify mutation
  // ----------------------------------------------------------

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
                id
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

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        id: discountId,
        basicCodeDiscount: input,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify update discount errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data?.discountCodeBasicUpdate?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  const discount =
    result.data?.discountCodeBasicUpdate?.codeDiscountNode?.codeDiscount;

  if (!discount) {
    throw new Error("Shopify did not return the updated discount");
  }

  console.log("DISCOUNT UPDATED:", discount.id);

  return discount;
}

// ============================================================
// DELETE DISCOUNT
// ============================================================

export async function deleteDiscount(admin, discountId) {
  if (!discountId) {
    throw new Error("Discount ID is required");
  }

  const response = await admin.graphql(
    `
      #graphql
      mutation DeleteDiscount($id: ID!) {
        discountCodeDelete(id: $id) {
          deletedCodeDiscountId

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        id: discountId,
      },
    },
  );

  const result = await response.json();

  if (result.errors) {
    console.error("Shopify delete discount errors:", result.errors);

    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const userErrors = result.data?.discountCodeDelete?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(userErrors.map((error) => error.message).join(", "));
  }

  const deletedId = result.data?.discountCodeDelete?.deletedCodeDiscountId;

  if (!deletedId) {
    throw new Error("Shopify did not return the deleted discount ID");
  }

  console.log("DISCOUNT DELETED:", deletedId);

  return {
    deletedId,
  };
}
