// ============================================================
// ORDER SERVICE
// Shopify GraphQL operations
// ============================================================


// ============================================================
// PROTECTED CUSTOMER DATA ERROR
// ============================================================

const PROTECTED_CUSTOMER_DATA_PATTERN =
  /not approved to access the (Order|Customer) object/i;


// ============================================================
// CHECK PROTECTED CUSTOMER DATA ERROR
// ============================================================

function isProtectedCustomerDataError(error) {
  return PROTECTED_CUSTOMER_DATA_PATTERN.test(
    error?.message || ""
  );
}


// ============================================================
// BUILD GET ORDERS QUERY
// ============================================================

function buildGetOrdersQuery({
  includeProtectedFields,
}) {
  return `
    #graphql

    query GetOrders {
      orders(
        first: 50
        query: "status:any"
        sortKey: CREATED_AT
        reverse: true
      ) {

        nodes {

          id
          name
          number

          # IMPORTANT
          # These fields are required for MongoDB update.
          note
          tags

          createdAt
          updatedAt

          cancelledAt
          cancelReason

          displayFinancialStatus
          displayFulfillmentStatus

          currencyCode

          subtotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }

          totalShippingPriceSet {
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


          ${
            includeProtectedFields
              ? `
          customer {
            id
            firstName
            lastName
            displayName
            email
            phone
          }
          `
              : ""
          }


          lineItems(first: 50) {

            nodes {

              id
              title
              quantity
              sku
              vendor

              variant {

                id
                title

                product {
                  id
                }

              }

              originalUnitPriceSet {

                shopMoney {
                  amount
                  currencyCode
                }

              }

              originalTotalSet {

                shopMoney {
                  amount
                  currencyCode
                }

              }

            }

          }


          ${
            includeProtectedFields
              ? `
          shippingAddress {

            firstName
            lastName
            address1
            address2
            city
            province
            country
            zip
            phone

          }
          `
              : ""
          }

        }

      }

    }
  `;
}


// ============================================================
// REQUEST ORDERS
// ============================================================

async function requestOrders(
  admin,
  includeProtectedFields
) {
  const response =
    await admin.graphql(
      buildGetOrdersQuery({
        includeProtectedFields,
      })
    );

  return response.json();
}


// ============================================================
// GET ORDERS
// ============================================================

export async function getOrders(admin) {
  let result;

  try {
    result =
      await requestOrders(
        admin,
        true
      );

  } catch (error) {

    if (
      !isProtectedCustomerDataError(
        error
      )
    ) {
      throw error;
    }

    console.warn(
      "Protected customer data access isn't approved. " +
        "Retrying without customer/shippingAddress."
    );

    result =
      await requestOrders(
        admin,
        false
      );
  }


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
  // Get orders
  // ----------------------------------------------------------

  const orders =
    result.data?.orders?.nodes ||
    [];


  console.log(
    `Shopify returned ${orders.length} orders`
  );


  console.log(
    "Shopify order names:",
    orders.map(
      (order) =>
        order.name
    )
  );


  // ----------------------------------------------------------
  // IMPORTANT DEBUG
  // ----------------------------------------------------------

  console.log(
    "Shopify order note/tags:",
    orders.map(
      (order) => ({
        name: order.name,
        note: order.note,
        tags: order.tags,
      })
    )
  );


  return orders;
}


// ============================================================
// BUILD GET SINGLE ORDER QUERY
// ============================================================

function buildGetOrderByIdQuery({
  includeProtectedFields,
}) {
  return `
    #graphql

    query GetOrder(
      $orderId: ID!
    ) {

      order(
        id: $orderId
      ) {

        id
        name
        number

        # IMPORTANT
        note
        tags

        createdAt
        updatedAt

        cancelledAt
        cancelReason

        displayFinancialStatus
        displayFulfillmentStatus

        currencyCode

        subtotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }

        totalShippingPriceSet {
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


        ${
          includeProtectedFields
            ? `
        customer {

          id
          firstName
          lastName
          displayName
          email
          phone

        }
        `
            : ""
        }


        lineItems(first: 50) {

          nodes {

            id
            title
            quantity
            sku
            vendor

            variant {

              id
              title

              product {
                id
              }

            }

            originalUnitPriceSet {

              shopMoney {
                amount
                currencyCode
              }

            }

            originalTotalSet {

              shopMoney {
                amount
                currencyCode
              }

            }

          }

        }


        ${
          includeProtectedFields
            ? `
        shippingAddress {

          firstName
          lastName
          address1
          address2
          city
          province
          country
          zip
          phone

        }
        `
            : ""
        }

      }

    }
  `;
}


// ============================================================
// GET SINGLE ORDER
// ============================================================

export async function getOrderById(
  admin,
  orderId
) {
  let result;


  try {

    const response =
      await admin.graphql(
        buildGetOrderByIdQuery({
          includeProtectedFields: true,
        }),
        {
          variables: {
            orderId,
          },
        }
      );


    result =
      await response.json();

  } catch (error) {

    if (
      !isProtectedCustomerDataError(
        error
      )
    ) {
      throw error;
    }


    console.warn(
      "Retrying order without protected customer data."
    );


    const response =
      await admin.graphql(
        buildGetOrderByIdQuery({
          includeProtectedFields: false,
        }),
        {
          variables: {
            orderId,
          },
        }
      );


    result =
      await response.json();
  }


  // ----------------------------------------------------------
  // GraphQL errors
  // ----------------------------------------------------------

  if (result.errors) {

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
  // Check order
  // ----------------------------------------------------------

  if (
    !result.data?.order
  ) {
    throw new Error(
      "Order not found"
    );
  }


  // ----------------------------------------------------------
  // IMPORTANT DEBUG
  // ----------------------------------------------------------

  console.log(
    "Shopify single order:",
    {
      id:
        result.data.order.id,

      name:
        result.data.order.name,

      note:
        result.data.order.note,

      tags:
        result.data.order.tags,
    }
  );


  return result.data.order;
}


// ============================================================
// UPDATE ORDER
// ============================================================

export async function updateOrder(
  admin,
  orderData
) {

  if (!orderData?.id) {

    throw new Error(
      "Order ID is required"
    );

  }


  console.log(
    "Updating Shopify order:",
    {
      id:
        orderData.id,

      note:
        orderData.note,

      tags:
        orderData.tags,
    }
  );


  const response =
    await admin.graphql(
      `
        #graphql

        mutation UpdateOrder(
          $input: OrderInput!
        ) {

          orderUpdate(
            input: $input
          ) {

            order {

              id
              name

              note
              tags

              updatedAt

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
          input: orderData,
        },
      }
    );


  const result =
    await response.json();


  // ----------------------------------------------------------
  // GraphQL errors
  // ----------------------------------------------------------

  if (result.errors) {

    console.error(
      "Order update GraphQL errors:",
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
      ?.orderUpdate
      ?.userErrors || [];


  if (
    userErrors.length > 0
  ) {

    console.error(
      "Order update user errors:",
      userErrors
    );

    throw new Error(
      userErrors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );

  }


  // ----------------------------------------------------------
  // Updated order
  // ----------------------------------------------------------

  const updatedOrder =
    result.data
      ?.orderUpdate
      ?.order;


  if (!updatedOrder) {

    throw new Error(
      "Shopify did not return the updated order"
    );

  }


  // ----------------------------------------------------------
  // IMPORTANT DEBUG
  // ----------------------------------------------------------

  console.log(
    "SHOPIFY ORDER UPDATED:",
    {
      id:
        updatedOrder.id,

      name:
        updatedOrder.name,

      note:
        updatedOrder.note,

      tags:
        updatedOrder.tags,

      updatedAt:
        updatedOrder.updatedAt,
    }
  );


  return updatedOrder;
}


// ============================================================
// CANCEL ORDER
// ============================================================

export async function cancelOrder(
  admin,
  orderId,
  reason,
  restock
) {

  const response =
    await admin.graphql(
      `
        #graphql

        mutation CancelOrder(

          $orderId: ID!

          $refundMethod:
            OrderCancelRefundMethodInput!

          $restock: Boolean!

          $reason:
            OrderCancelReason!

        ) {

          orderCancel(

            orderId:
              $orderId

            refundMethod:
              $refundMethod

            restock:
              $restock

            reason:
              $reason

          ) {

            job {

              id
              done

            }

            orderCancelUserErrors {

              field
              message
              code

            }

          }

        }
      `,
      {
        variables: {

          orderId,

          refundMethod: {
            originalPaymentMethodsRefund:
              false,
          },

          restock,

          reason,
        },
      }
    );


  const result =
    await response.json();


  if (result.errors) {

    throw new Error(
      result.errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );

  }


  const errors =
    result.data
      ?.orderCancel
      ?.orderCancelUserErrors ||
    [];


  if (
    errors.length > 0
  ) {

    throw new Error(
      errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );

  }


  return result.data.orderCancel;
}