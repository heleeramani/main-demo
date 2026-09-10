export async function getOrderFulfillmentOrders(admin, orderId) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    const response = await admin.graphql(
        `#graphql
      query FulfillmentOrderList($orderId: ID!) {
        order(id: $orderId) {
          id
          name

          fulfillmentOrders(first: 250) {
            nodes {
              id
              createdAt
              updatedAt
              requestStatus
              status
              fulfillAt
              fulfillBy

              assignedLocation {
                location {
                  id
                  name
                }
              }

              destination {
                id
                address1
                address2
                city
                company
                countryCode
                email
                firstName
                lastName
                phone
                province
                zip
              }

              lineItems(first: 250) {
                nodes {
                  id
                  totalQuantity
                  remainingQuantity
                  inventoryItemId
                  requiresShipping
                  productTitle
                  sku
                  variantTitle

                  variant {
                    id
                    sku
                    title
                  }

                  lineItem {
                    id
                    title
                  }
                }
              }
            }
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
            result.errors.map((error) => error.message).join(", ")
        );
    }

    const order = result.data?.order;

    if (!order) {
        throw new Error("Order not found");
    }

    return {
        orderId: order.id,
        orderName: order.name,
        fulfillmentOrders: order.fulfillmentOrders?.nodes || [],
    };
}


export async function getFulfillmentOrderById(
    admin,
    fulfillmentOrderId
) {
    if (!fulfillmentOrderId) {
        throw new Error("Fulfillment Order ID is required");
    }

    const response = await admin.graphql(
        `#graphql
      query FulfillmentOrderById($id: ID!) {
        fulfillmentOrder(id: $id) {
          id
          createdAt
          updatedAt
          requestStatus
          status
          fulfillAt
          fulfillBy

          assignedLocation {
            location {
              id
              name
            }
          }

          destination {
            id
            address1
            address2
            city
            company
            countryCode
            email
            firstName
            lastName
            phone
            province
            zip
          }

          lineItems(first: 250) {
            nodes {
              id
              totalQuantity
              remainingQuantity
              inventoryItemId
              requiresShipping
              productTitle
              sku
              variantTitle

              variant {
                id
                sku
                title
              }

              lineItem {
                id
                title
              }
            }
          }
        }
      }
    `,
        {
            variables: {
                id: fulfillmentOrderId,
            },
        }
    );

    const result = await response.json();

    if (result.errors) {
        throw new Error(
            result.errors.map((error) => error.message).join(", ")
        );
    }

    const fulfillmentOrder =
        result.data?.fulfillmentOrder;

    if (!fulfillmentOrder) {
        throw new Error("Fulfillment Order not found");
    }

    return fulfillmentOrder;
}


export async function getFulfillmentById(
    admin,
    fulfillmentId
) {
    if (!fulfillmentId) {
        throw new Error("Fulfillment ID is required");
    }

    const response = await admin.graphql(
        `#graphql
      query FulfillmentById($id: ID!) {
        fulfillment(id: $id) {
          id
          status
          displayStatus
          totalQuantity
          createdAt
          updatedAt
          deliveredAt
          estimatedDeliveryAt

          trackingInfo {
            company
            number
            url
          }

          location {
            id
            name
          }

          fulfillmentLineItems(first: 250) {
            nodes {
              id
              quantity

              lineItem {
                id
                title

                variant {
                  id
                  title
                  sku
                }
              }
            }
          }

          order {
            id
            name
          }
        }
      }
    `,
        {
            variables: {
                id: fulfillmentId,
            },
        }
    );

    const result = await response.json();

    if (result.errors) {
        throw new Error(
            result.errors.map((error) => error.message).join(", ")
        );
    }

    const fulfillment =
        result.data?.fulfillment;

    if (!fulfillment) {
        throw new Error("Fulfillment not found");
    }

    return fulfillment;
}


export async function createFulfillment(
    admin,
    fulfillmentData
) {
    if (!fulfillmentData?.fulfillmentOrderId) {
        throw new Error("Fulfillment Order ID is required");
    }

    const lineItemsByFulfillmentOrder = {
        fulfillmentOrderId:
            fulfillmentData.fulfillmentOrderId,
    };

    if (
        fulfillmentData.lineItems &&
        fulfillmentData.lineItems.length > 0
    ) {
        lineItemsByFulfillmentOrder.fulfillmentOrderLineItems =
            fulfillmentData.lineItems.map((item) => ({
                id: item.id,
                quantity: Number(item.quantity),
            }));
    }

    const fulfillmentInput = {
        lineItemsByFulfillmentOrder: [
            lineItemsByFulfillmentOrder,
        ],

        notifyCustomer:
            Boolean(fulfillmentData.notifyCustomer),
    };

    const trackingInfo = {};

    if (fulfillmentData.trackingCompany) {
        trackingInfo.company =
            fulfillmentData.trackingCompany;
    }

    if (fulfillmentData.trackingNumber) {
        trackingInfo.number =
            fulfillmentData.trackingNumber;
    }

    if (fulfillmentData.trackingUrl) {
        trackingInfo.url =
            fulfillmentData.trackingUrl;
    }

    if (Object.keys(trackingInfo).length > 0) {
        fulfillmentInput.trackingInfo = trackingInfo;
    }

    const response = await admin.graphql(
        `#graphql
      mutation FulfillmentCreate(
        $fulfillment: FulfillmentInput!
        $message: String
      ) {
        fulfillmentCreate(
          fulfillment: $fulfillment
          message: $message
        ) {
          fulfillment {
            id
            status
            displayStatus
            totalQuantity
            createdAt
            updatedAt
            deliveredAt
            estimatedDeliveryAt

            trackingInfo {
              company
              number
              url
            }

            location {
              id
              name
            }

            fulfillmentLineItems(first: 250) {
              nodes {
                id
                quantity

                lineItem {
                  id
                  title

                  variant {
                    id
                    title
                    sku
                  }
                }
              }
            }

            order {
              id
              name
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
                fulfillment: fulfillmentInput,
                message: fulfillmentData.message || null,
            },
        }
    );

    const result = await response.json();

    if (result.errors) {
        throw new Error(
            result.errors.map((error) => error.message).join(", ")
        );
    }

    const userErrors =
        result.data?.fulfillmentCreate?.userErrors || [];

    if (userErrors.length > 0) {
        throw new Error(
            userErrors
                .map((error) => error.message)
                .join(", ")
        );
    }

    const fulfillment =
        result.data?.fulfillmentCreate?.fulfillment;

    if (!fulfillment) {
        throw new Error(
            "Shopify did not return the created fulfillment"
        );
    }

    return fulfillment;
}


export async function updateFulfillmentTracking(
    admin,
    fulfillmentId,
    trackingData
) {
    if (!fulfillmentId) {
        throw new Error("Fulfillment ID is required");
    }

    const trackingInfoInput = {};

    if (trackingData?.company) {
        trackingInfoInput.company =
            trackingData.company;
    }

    if (trackingData?.number) {
        trackingInfoInput.number =
            trackingData.number;
    }

    if (trackingData?.url) {
        trackingInfoInput.url =
            trackingData.url;
    }

    const response = await admin.graphql(
        `#graphql
      mutation FulfillmentTrackingInfoUpdate(
        $fulfillmentId: ID!
        $trackingInfoInput: FulfillmentTrackingInput!
        $notifyCustomer: Boolean
      ) {
        fulfillmentTrackingInfoUpdate(
          fulfillmentId: $fulfillmentId
          trackingInfoInput: $trackingInfoInput
          notifyCustomer: $notifyCustomer
        ) {
          fulfillment {
            id
            status
            displayStatus
            totalQuantity
            updatedAt

            trackingInfo {
              company
              number
              url
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
                fulfillmentId,
                trackingInfoInput,
                notifyCustomer:
                    Boolean(trackingData?.notifyCustomer),
            },
        }
    );

    const result = await response.json();

    if (result.errors) {
        throw new Error(
            result.errors.map((error) => error.message).join(", ")
        );
    }

    const userErrors =
        result.data?.fulfillmentTrackingInfoUpdate
            ?.userErrors || [];

    if (userErrors.length > 0) {
        throw new Error(
            userErrors
                .map((error) => error.message)
                .join(", ")
        );
    }

    const fulfillment =
        result.data?.fulfillmentTrackingInfoUpdate
            ?.fulfillment;

    if (!fulfillment) {
        throw new Error(
            "Shopify did not return the updated fulfillment"
        );
    }

    return fulfillment;
}


export async function cancelFulfillment(
    admin,
    fulfillmentId
) {
    if (!fulfillmentId) {
        throw new Error("Fulfillment ID is required");
    }

    const response = await admin.graphql(
        `#graphql
      mutation FulfillmentCancel($id: ID!) {
        fulfillmentCancel(id: $id) {
          fulfillment {
            id
            status
            displayStatus
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
                id: fulfillmentId,
            },
        }
    );

    const result = await response.json();

    if (result.errors) {
        throw new Error(
            result.errors.map((error) => error.message).join(", ")
        );
    }

    const userErrors =
        result.data?.fulfillmentCancel?.userErrors || [];

    if (userErrors.length > 0) {
        throw new Error(
            userErrors
                .map((error) => error.message)
                .join(", ")
        );
    }

    const fulfillment =
        result.data?.fulfillmentCancel?.fulfillment;

    if (!fulfillment) {
        throw new Error(
            "Shopify did not return the cancelled fulfillment"
        );
    }

    return fulfillment;
}