const RETURNABLE_FULFILLMENTS_QUERY = `#graphql
  query ReturnableFulfillments($orderId: ID!, $first: Int!) {
    returnableFulfillments(
      orderId: $orderId
      first: $first
    ) {
      nodes {
        id

        fulfillment {
          id
          status
          displayStatus

          location {
            id
            name
          }

          trackingInfo {
            company
            number
            url
          }
        }

        returnableFulfillmentLineItems(first: 50) {
          nodes {
            quantity

            fulfillmentLineItem {
              id

              lineItem {
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
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const ORDER_RETURNS_QUERY = `#graphql
  query OrderReturns($orderId: ID!, $first: Int!) {
    order(id: $orderId) {
      id
      name

      returns(first: $first) {
        nodes {
          id
          name
          status
          totalQuantity

          order {
            id
            name
          }

          returnLineItems(first: 50) {
            nodes {
              id
              quantity
              processableQuantity
              processedQuantity
              refundableQuantity
              refundedQuantity
              unprocessedQuantity
              returnReason
              returnReasonNote
              customerNote

              ... on ReturnLineItem {
                fulfillmentLineItem {
                  id

                  lineItem {
                    id
                    title
                    sku

                    variant {
                      id
                      title
                    }
                  }
                }
              }
            }
          }

          reverseFulfillmentOrders(first: 50) {
            nodes {
              id
              status
            }
          }

          closedAt
          createdAt
        }
      }
    }
  }
`;

const RETURN_BY_ID_QUERY = `#graphql
  query ReturnById($id: ID!) {
    return(id: $id) {
      id
      name
      status
      totalQuantity

      order {
        id
        name
      }

      returnLineItems(first: 50) {
        nodes {
          id
          quantity
          processableQuantity
          processedQuantity
          refundableQuantity
          refundedQuantity
          unprocessedQuantity
          returnReason
          returnReasonNote
          customerNote

          ... on ReturnLineItem {
            fulfillmentLineItem {
              id

              lineItem {
                id
                title
                sku

                variant {
                  id
                  title
                }
              }
            }
          }
        }
      }

      reverseFulfillmentOrders(first: 50) {
        nodes {
          id
          status
        }
      }

      closedAt
      createdAt
    }
  }
`;

const RETURN_CREATE_MUTATION = `#graphql
  mutation ReturnCreate($returnInput: ReturnInput!) {
    returnCreate(returnInput: $returnInput) {
      return {
        id
        name
        status
        totalQuantity

        order {
          id
          name
        }

        returnLineItems(first: 50) {
          nodes {
            id
            quantity
            processableQuantity
            processedQuantity
            refundableQuantity
            refundedQuantity
            unprocessedQuantity
            returnReason
            returnReasonNote
            customerNote

            ... on ReturnLineItem {
              fulfillmentLineItem {
                id

                lineItem {
                  id
                  title
                  sku

                  variant {
                    id
                    title
                  }
                }
              }
            }
          }
        }

        reverseFulfillmentOrders(first: 50) {
          nodes {
            id
            status
          }
        }

        closedAt
        createdAt
      }

      userErrors {
        field
        message
        code
      }
    }
  }
`;

const RETURN_PROCESS_MUTATION = `#graphql
  mutation ReturnProcess($input: ReturnProcessInput!) {
    returnProcess(input: $input) {
      return {
        id
        name
        status
        totalQuantity

        order {
          id
          name
        }

        returnLineItems(first: 50) {
          nodes {
            id
            quantity
            processableQuantity
            processedQuantity
            refundableQuantity
            refundedQuantity
            unprocessedQuantity
            returnReason
            returnReasonNote
            customerNote

            ... on ReturnLineItem {
              fulfillmentLineItem {
                id

                lineItem {
                  id
                  title
                  sku

                  variant {
                    id
                    title
                  }
                }
              }
            }
          }
        }

        reverseFulfillmentOrders(first: 50) {
          nodes {
            id
            status
          }
        }

        closedAt
        createdAt
      }

      userErrors {
        field
        message
        code
      }
    }
  }
`;

function getGraphQLErrors(result) {
    return result?.errors || [];
}

function getUserErrors(payload) {
    return payload?.userErrors || [];
}

function throwIfGraphQLError(result, message) {
    const errors = getGraphQLErrors(result);

    if (errors.length > 0) {
        console.error(message);
        console.error(JSON.stringify(errors, null, 2));

        throw new Error(
            errors
                .map((error) => error.message)
                .join(", ")
        );
    }
}

function throwIfUserError(userErrors, message) {
    if (userErrors.length > 0) {
        console.error(message);
        console.error(
            JSON.stringify(userErrors, null, 2)
        );

        throw new Error(
            userErrors
                .map((error) => {
                    const field = Array.isArray(error.field)
                        ? ` [${error.field.join(".")}]`
                        : "";

                    return `${error.message}${field}`;
                })
                .join(", ")
        );
    }
}

/* =========================================================
   RETURNABLE FULFILLMENTS
========================================================= */

export async function getReturnableFulfillments(
    admin,
    orderId
) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    console.log(
        "========================================"
    );

    console.log(
        "CHECKING RETURNABLE FULFILLMENTS"
    );

    console.log("Order ID:", orderId);

    const response = await admin.graphql(
        RETURNABLE_FULFILLMENTS_QUERY,
        {
            variables: {
                orderId,
                first: 50,
            },
        }
    );

    const result = await response.json();

    console.log(
        "RETURNABLE FULFILLMENTS RAW RESPONSE:"
    );

    console.log(
        JSON.stringify(result, null, 2)
    );

    throwIfGraphQLError(
        result,
        "Failed to fetch returnable fulfillments"
    );

    const returnableFulfillments =
        result?.data?.returnableFulfillments?.nodes ||
        [];

    console.log(
        "RETURNABLE FULFILLMENT COUNT:",
        returnableFulfillments.length
    );

    if (returnableFulfillments.length === 0) {
        console.log(
            "NO RETURNABLE FULFILLMENTS FOUND"
        );

        console.log(
            "This means Shopify currently considers this order to have no returnable fulfillment."
        );

        console.log(
            "========================================"
        );

        return [];
    }

    const items = returnableFulfillments.flatMap(
        (returnableFulfillment) => {
            const fulfillment =
                returnableFulfillment.fulfillment;

            const lineItems =
                returnableFulfillment
                    .returnableFulfillmentLineItems
                    ?.nodes || [];

            console.log(
                "RETURNABLE FULFILLMENT:",
                JSON.stringify(
                    {
                        returnableFulfillmentId:
                            returnableFulfillment.id,

                        fulfillmentId:
                            fulfillment?.id,

                        status:
                            fulfillment?.status,

                        displayStatus:
                            fulfillment?.displayStatus,

                        location:
                            fulfillment?.location,

                        trackingInfo:
                            fulfillment?.trackingInfo,

                        lineItemCount:
                            lineItems.length,
                    },
                    null,
                    2
                )
            );

            return lineItems.map((item) => {
                const fulfillmentLineItem =
                    item.fulfillmentLineItem;

                const lineItem =
                    fulfillmentLineItem?.lineItem;

                return {
                    returnableFulfillmentId:
                        returnableFulfillment.id,

                    fulfillmentId:
                        fulfillment?.id || "",

                    fulfillmentStatus:
                        fulfillment?.status || "",

                    fulfillmentDisplayStatus:
                        fulfillment?.displayStatus || "",

                    fulfillmentLineItemId:
                        fulfillmentLineItem?.id || "",

                    quantity:
                        item.quantity || 0,

                    lineItemId:
                        lineItem?.id || "",

                    title:
                        lineItem?.title || "",

                    sku:
                        lineItem?.sku || "",

                    vendor:
                        lineItem?.vendor || "",

                    variantId:
                        lineItem?.variant?.id || "",

                    variantTitle:
                        lineItem?.variant?.title || "",

                    productId:
                        lineItem?.variant?.product?.id || "",

                    productTitle:
                        lineItem?.variant?.product?.title || "",

                    locationId:
                        fulfillment?.location?.id || "",

                    locationName:
                        fulfillment?.location?.name || "",

                    trackingInfo:
                        fulfillment?.trackingInfo || null,
                };
            });
        }
    );

    console.log(
        "FINAL RETURNABLE ITEM COUNT:",
        items.length
    );

    console.log(
        "FINAL RETURNABLE ITEMS:",
        JSON.stringify(items, null, 2)
    );

    console.log(
        "========================================"
    );

    return items;
}

/* =========================================================
   GET ORDER RETURNS
========================================================= */

export async function getOrderReturns(
    admin,
    orderId
) {
    if (!orderId) {
        throw new Error("Order ID is required");
    }

    const response = await admin.graphql(
        ORDER_RETURNS_QUERY,
        {
            variables: {
                orderId,
                first: 50,
            },
        }
    );

    const result = await response.json();

    throwIfGraphQLError(
        result,
        "Failed to fetch order returns"
    );

    const order =
        result?.data?.order;

    if (!order) {
        return {
            orderId,
            orderName: "",
            returns: [],
        };
    }

    return {
        orderId: order.id,
        orderName: order.name,
        returns: (
            order.returns?.nodes || []
        ).map(mapReturn),
    };
}

/* =========================================================
   GET RETURN BY ID
========================================================= */

export async function getReturnById(
    admin,
    returnId
) {
    if (!returnId) {
        throw new Error("Return ID is required");
    }

    const response = await admin.graphql(
        RETURN_BY_ID_QUERY,
        {
            variables: {
                id: returnId,
            },
        }
    );

    const result = await response.json();

    throwIfGraphQLError(
        result,
        "Failed to fetch return"
    );

    if (!result?.data?.return) {
        throw new Error("Return not found");
    }

    return mapReturn(
        result.data.return
    );
}

/* =========================================================
   CREATE RETURN
========================================================= */

export async function createReturn(
    admin,
    returnData
) {
    if (!returnData?.orderId) {
        throw new Error("Order ID is required");
    }

    if (
        !Array.isArray(
            returnData.returnLineItems
        ) ||
        returnData.returnLineItems.length === 0
    ) {
        throw new Error(
            "At least one return line item is required"
        );
    }

    const returnLineItems =
        returnData.returnLineItems.map(
            (item) => {
                if (!item.fulfillmentLineItemId) {
                    throw new Error(
                        "Fulfillment line item ID is required"
                    );
                }

                if (
                    !item.quantity ||
                    Number(item.quantity) < 1
                ) {
                    throw new Error(
                        "Return quantity must be at least 1"
                    );
                }

                const lineItem = {
                    fulfillmentLineItemId:
                        item.fulfillmentLineItemId,

                    quantity:
                        Number(item.quantity),
                };

                if (item.returnReason) {
                    lineItem.returnReason =
                        item.returnReason;
                }

                if (
                    item.returnReasonDefinitionId
                ) {
                    lineItem.returnReasonDefinitionId =
                        item.returnReasonDefinitionId;
                }

                if (item.returnReasonNote) {
                    lineItem.returnReasonNote =
                        item.returnReasonNote;
                }

                return lineItem;
            }
        );

    const input = {
        orderId:
            returnData.orderId,

        returnLineItems,
    };

    if (returnData.requestedAt) {
        input.requestedAt =
            returnData.requestedAt;
    }

    if (returnData.returnShippingFee) {
        input.returnShippingFee =
            returnData.returnShippingFee;
    }

    if (
        Array.isArray(
            returnData.exchangeLineItems
        ) &&
        returnData.exchangeLineItems.length > 0
    ) {
        input.exchangeLineItems =
            returnData.exchangeLineItems;
    }

    console.log(
        "CREATING RETURN WITH INPUT:"
    );

    console.log(
        JSON.stringify(input, null, 2)
    );

    const response = await admin.graphql(
        RETURN_CREATE_MUTATION,
        {
            variables: {
                returnInput: input,
            },
        }
    );

    const result = await response.json();

    console.log(
        "RETURN CREATE RESPONSE:"
    );

    console.log(
        JSON.stringify(result, null, 2)
    );

    throwIfGraphQLError(
        result,
        "Failed to create return"
    );

    const payload =
        result?.data?.returnCreate;

    if (!payload) {
        throw new Error(
            "Shopify did not return a returnCreate response"
        );
    }

    throwIfUserError(
        getUserErrors(payload),
        "Shopify returnCreate error"
    );

    if (!payload.return) {
        throw new Error(
            "Return was not created"
        );
    }

    return mapReturn(
        payload.return
    );
}

/* =========================================================
   PROCESS RETURN
========================================================= */

export async function processReturn(
    admin,
    processInput
) {
    if (!processInput?.returnId) {
        throw new Error(
            "Return ID is required"
        );
    }

    const input = {
        returnId:
            processInput.returnId,
    };

    if (
        Array.isArray(
            processInput.returnLineItems
        ) &&
        processInput.returnLineItems.length > 0
    ) {
        input.returnLineItems =
            processInput.returnLineItems.map(
                (item) => ({
                    id: item.id,
                    quantity:
                        Number(item.quantity),
                })
            );
    }

    if (
        Array.isArray(
            processInput.exchangeLineItems
        ) &&
        processInput.exchangeLineItems.length > 0
    ) {
        input.exchangeLineItems =
            processInput.exchangeLineItems;
    }

    if (processInput.financialTransfer) {
        input.financialTransfer =
            processInput.financialTransfer;
    }

    if (
        Array.isArray(
            processInput.refundDuties
        ) &&
        processInput.refundDuties.length > 0
    ) {
        input.refundDuties =
            processInput.refundDuties;
    }

    if (processInput.refundShipping) {
        input.refundShipping =
            processInput.refundShipping;
    }

    if (processInput.note) {
        input.note =
            processInput.note;
    }

    if (
        typeof processInput.notifyCustomer ===
        "boolean"
    ) {
        input.notifyCustomer =
            processInput.notifyCustomer;
    }

    if (processInput.tipLineId) {
        input.tipLineId =
            processInput.tipLineId;
    }

    console.log(
        "PROCESSING RETURN WITH INPUT:"
    );

    console.log(
        JSON.stringify(input, null, 2)
    );

    const response = await admin.graphql(
        RETURN_PROCESS_MUTATION,
        {
            variables: {
                input,
            },
        }
    );

    const result = await response.json();

    console.log(
        "RETURN PROCESS RESPONSE:"
    );

    console.log(
        JSON.stringify(result, null, 2)
    );

    throwIfGraphQLError(
        result,
        "Failed to process return"
    );

    const payload =
        result?.data?.returnProcess;

    if (!payload) {
        throw new Error(
            "Shopify did not return a returnProcess response"
        );
    }

    throwIfUserError(
        getUserErrors(payload),
        "Shopify returnProcess error"
    );

    if (!payload.return) {
        throw new Error(
            "Return was not processed"
        );
    }

    return mapReturn(
        payload.return
    );
}

/* =========================================================
   MAP SHOPIFY RETURN
========================================================= */

function mapReturn(returnData) {
    if (!returnData) {
        return null;
    }

    const returnLineItems =
        returnData.returnLineItems?.nodes ||
        [];

    const reverseFulfillmentOrders =
        returnData.reverseFulfillmentOrders
            ?.nodes || [];

    return {
        id:
            returnData.id || "",

        shopifyId:
            returnData.id || "",

        name:
            returnData.name || "",

        orderId:
            returnData.order?.id || "",

        orderName:
            returnData.order?.name || "",

        status:
            returnData.status || "",

        totalQuantity:
            returnData.totalQuantity ??
            returnLineItems.reduce(
                (total, item) =>
                    total +
                    (item.quantity || 0),
                0
            ),

        returnLineItems:
            returnLineItems.map(
                (item) => {
                    const fulfillmentLineItem =
                        item.fulfillmentLineItem;

                    const lineItem =
                        fulfillmentLineItem?.lineItem;

                    return {
                        shopifyId:
                            item.id || "",

                        fulfillmentLineItemId:
                            fulfillmentLineItem?.id ||
                            "",

                        lineItemId:
                            lineItem?.id || "",

                        title:
                            lineItem?.title || "",

                        variantId:
                            lineItem?.variant?.id ||
                            "",

                        variantTitle:
                            lineItem?.variant?.title ||
                            "",

                        sku:
                            lineItem?.sku || "",

                        quantity:
                            item.quantity || 0,

                        processableQuantity:
                            item.processableQuantity ||
                            0,

                        processedQuantity:
                            item.processedQuantity ||
                            0,

                        refundableQuantity:
                            item.refundableQuantity ||
                            0,

                        refundedQuantity:
                            item.refundedQuantity ||
                            0,

                        returnReason:
                            item.returnReason || "",

                        returnReasonNote:
                            item.returnReasonNote || "",

                        customerNote:
                            item.customerNote || "",
                    };
                }
            ),

        reverseFulfillmentOrders:
            reverseFulfillmentOrders.map(
                (item) => ({
                    shopifyId:
                        item.id || "",

                    status:
                        item.status || "",

                    locationId: "",

                    locationName: "",
                })
            ),

        requestedAt: null,

        closedAt:
            returnData.closedAt || null,

        createdAtShopify:
            returnData.createdAt || null,

        updatedAtShopify: null,
    };
}