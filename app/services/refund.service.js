import { randomUUID } from "crypto";

// ---------------------------------------------
// Get Refunds for an Order
// ---------------------------------------------

export async function getOrderRefunds(
    admin,
    orderId
) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    const response = await admin.graphql(
        `#graphql
      query OrderRefunds($orderId: ID!) {
        order(id: $orderId) {
          id
          name

          refunds {
            id
            note

            totalRefundedSet {
              shopMoney {
                amount
                currencyCode
              }

              presentmentMoney {
                amount
                currencyCode
              }
            }

            refundLineItems(first: 250) {
              nodes {
                id
                quantity
                restockType

                lineItem {
                  id
                  title
                  quantity

                  variant {
                    id
                    title
                    sku
                  }
                }

                location {
                  id
                  name
                }

                subtotalSet {
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
              }
            }

            transactions(first: 250) {
              nodes {
                id
                kind
                status
                gateway

                amountSet {
                  shopMoney {
                    amount
                    currencyCode
                  }

                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }

                processedAt
              }
            }

            duties {
              originalDuty {
                countryCodeOfOrigin
              }

              amountSet {
                shopMoney {
                  amount
                  currencyCode
                }

                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }

            processedAt
            createdAt
            updatedAt
          }
        }
      }
    `,
        {
            variables: {
                orderId,
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

    const order = result.data?.order;

    if (!order) {
        throw new Error("Order not found");
    }

    return {
        orderId: order.id,
        orderName: order.name,
        refunds: order.refunds || [],
    };
}


// ---------------------------------------------
// Get Single Refund
// ---------------------------------------------

export async function getRefundById(
    admin,
    refundId
) {
    if (!refundId) {
        throw new Error("Refund ID is required");
    }

    const response = await admin.graphql(
        `#graphql
      query RefundById($id: ID!) {
        refund(id: $id) {
          id
          note

          order {
            id
            name
          }

          totalRefundedSet {
            shopMoney {
              amount
              currencyCode
            }

            presentmentMoney {
              amount
              currencyCode
            }
          }

          refundLineItems(first: 250) {
            nodes {
              id
              quantity
              restockType

              lineItem {
                id
                title
                quantity

                variant {
                  id
                  title
                  sku
                }
              }

              location {
                id
                name
              }

              subtotalSet {
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
            }
          }

          transactions(first: 250) {
            nodes {
              id
              kind
              status
              gateway

              amountSet {
                shopMoney {
                  amount
                  currencyCode
                }

                presentmentMoney {
                  amount
                  currencyCode
                }
              }

              processedAt
            }
          }

          duties {
            originalDuty {
              countryCodeOfOrigin
            }

            amountSet {
              shopMoney {
                amount
                currencyCode
              }

              presentmentMoney {
                amount
                currencyCode
              }
            }
          }

          processedAt
          createdAt
          updatedAt
        }
      }
    `,
        {
            variables: {
                id: refundId,
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

    const refund =
        result.data?.refund;

    if (!refund) {
        throw new Error("Refund not found");
    }

    return refund;
}


// ---------------------------------------------
// Create Refund
// ---------------------------------------------

export async function createRefund(
    admin,
    refundData
) {
    if (!refundData) {
        throw new Error(
            "Refund data is required"
        );
    }

    if (!refundData.orderId) {
        throw new Error(
            "Order ID is required"
        );
    }

    const idempotencyKey =
        randomUUID();

    const response = await admin.graphql(
        `#graphql
      mutation RefundCreate(
        $input: RefundInput!
      ) {
        refundCreate(
          input: $input
        ) @idempotent(
          key: "${idempotencyKey}"
        ) {
          refund {
            id
            note

            order {
              id
              name
            }

            totalRefundedSet {
              shopMoney {
                amount
                currencyCode
              }

              presentmentMoney {
                amount
                currencyCode
              }
            }

            refundLineItems(first: 250) {
              nodes {
                id
                quantity
                restockType

                lineItem {
                  id
                  title
                  quantity

                  variant {
                    id
                    title
                    sku
                  }
                }

                location {
                  id
                  name
                }

                subtotalSet {
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
              }
            }

            transactions(first: 250) {
              nodes {
                id
                kind
                status
                gateway

                amountSet {
                  shopMoney {
                    amount
                    currencyCode
                  }

                  presentmentMoney {
                    amount
                    currencyCode
                  }
                }

                processedAt
              }
            }

            duties {
              originalDuty {
                countryCodeOfOrigin
              }

              amountSet {
                shopMoney {
                  amount
                  currencyCode
                }

                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }

            processedAt
            createdAt
            updatedAt
          }

          order {
            id
            name
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
                input: refundData,
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
        result.data?.refundCreate
            ?.userErrors || [];

    if (userErrors.length > 0) {
        throw new Error(
            userErrors
                .map((error) => error.message)
                .join(", ")
        );
    }

    const refund =
        result.data?.refundCreate?.refund;

    if (!refund) {
        throw new Error(
            "Shopify did not return the created refund"
        );
    }

    return refund;
}