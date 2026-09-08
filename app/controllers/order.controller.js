import { connectDB } from "../db.server";

import {
  getOrders,
  getOrderById as getOrderByIdFromShopify,
  updateOrder as updateOrderOnShopify,
  cancelOrder as cancelOrderOnShopify,
} from "../services/order.service";

import { getShopDetails } from "../services/shopify.service";

import Order from "../models/Order";


// ============================================================
// MAP SHOPIFY ORDER → MONGODB
// ============================================================

function mapOrderToMongo(
  order,
  shop
) {

  console.log(
    "Mapping order to MongoDB:",
    {
      name:
        order.name,

      note:
        order.note,

      tags:
        order.tags,
    }
  );


  return {

    shop,

    shopifyId:
      order.id,

    name:
      order.name || "",

    orderNumber:
      String(
        order.number || ""
      ),


    // ----------------------------------------------------------
    // IMPORTANT
    // ----------------------------------------------------------

    note:
      order.note || "",

    tags:
      Array.isArray(
        order.tags
      )
        ? order.tags
        : [],


    // ----------------------------------------------------------
    // CUSTOMER
    // ----------------------------------------------------------

    customer: {

      shopifyId:
        order.customer?.id ||
        "",

      firstName:
        order.customer?.firstName ||
        "",

      lastName:
        order.customer?.lastName ||
        "",

      displayName:
        order.customer?.displayName ||
        "",

      email:
        order.customer?.email ||
        "",

      phone:
        order.customer?.phone ||
        "",

    },


    financialStatus:
      order.displayFinancialStatus ||
      "",

    fulfillmentStatus:
      order.displayFulfillmentStatus ||
      "",


    currencyCode:
      order.currencyCode ||
      "",


    subtotalPrice:
      order.subtotalPriceSet
        ?.shopMoney
        ?.amount ||
      "0.00",


    totalShipping:
      order.totalShippingPriceSet
        ?.shopMoney
        ?.amount ||
      "0.00",


    totalTax:
      order.totalTaxSet
        ?.shopMoney
        ?.amount ||
      "0.00",


    totalPrice:
      order.totalPriceSet
        ?.shopMoney
        ?.amount ||
      "0.00",


    // ----------------------------------------------------------
    // LINE ITEMS
    // ----------------------------------------------------------

    lineItems:
      order.lineItems
        ?.nodes
        ?.map(
          (item) => ({

            shopifyId:
              item.id,

            title:
              item.title || "",

            quantity:
              item.quantity || 0,

            sku:
              item.sku || "",

            variantId:
              item.variant?.id ||
              "",

            variantTitle:
              item.variant?.title ||
              "",

            productId:
              item.variant
                ?.product
                ?.id || "",

            vendor:
              item.vendor || "",

            unitPrice:
              item.originalUnitPriceSet
                ?.shopMoney
                ?.amount ||
              "0.00",

            originalTotal:
              item.originalTotalSet
                ?.shopMoney
                ?.amount ||
              "0.00",

          })
        ) || [],


    // ----------------------------------------------------------
    // SHIPPING ADDRESS
    // ----------------------------------------------------------

    shippingAddress: {

      firstName:
        order.shippingAddress
          ?.firstName || "",

      lastName:
        order.shippingAddress
          ?.lastName || "",

      address1:
        order.shippingAddress
          ?.address1 || "",

      address2:
        order.shippingAddress
          ?.address2 || "",

      city:
        order.shippingAddress
          ?.city || "",

      province:
        order.shippingAddress
          ?.province || "",

      country:
        order.shippingAddress
          ?.country || "",

      zip:
        order.shippingAddress
          ?.zip || "",

      phone:
        order.shippingAddress
          ?.phone || "",

    },


    shopifyCreatedAt:
      order.createdAt
        ? new Date(
            order.createdAt
          )
        : null,


    shopifyUpdatedAt:
      order.updatedAt
        ? new Date(
            order.updatedAt
          )
        : null,


    cancelledAt:
      order.cancelledAt
        ? new Date(
            order.cancelledAt
          )
        : null,


    cancelReason:
      order.cancelReason ||
      "",

  };
}


// ============================================================
// SYNC ORDERS
// ============================================================

export async function syncOrders({
  admin,
  session,
}) {

  console.log(
    "========================================"
  );

  console.log(
    "SYNC ORDERS STARTED"
  );

  console.log(
    "Shop:",
    session.shop
  );


  await connectDB();


  console.log(
    "MongoDB connection ready"
  );


  const orders =
    await getOrders(
      admin
    );


  console.log(
    "Orders received from Shopify:",
    orders.length
  );


  const savedOrders =
    [];


  for (
    const order of orders
  ) {

    console.log(
      "Saving order:",
      order.name
    );


    const data =
      mapOrderToMongo(
        order,
        session.shop
      );


    const savedOrder =
      await Order.findOneAndUpdate(
        {
          shop:
            session.shop,

          shopifyId:
            order.id,
        },

        data,

        {
          returnDocument:
            "after",

          upsert:
            true,

          runValidators:
            true,
        }
      );


    console.log(
      "MongoDB saved:",
      {
        name:
          savedOrder?.name,

        note:
          savedOrder?.note,

        tags:
          savedOrder?.tags,
      }
    );


    savedOrders.push(
      savedOrder
    );

  }


  console.log(
    "Total orders saved:",
    savedOrders.length
  );


  console.log(
    "SYNC ORDERS COMPLETED"
  );


  console.log(
    "========================================"
  );


  return Response.json({

    success:
      true,

    message:
      "Orders synced successfully",

    count:
      savedOrders.length,

    data:
      savedOrders,

  });
}


// ============================================================
// GET SINGLE ORDER
// ============================================================

export async function getOrderById({
  admin,
  session,
  orderId,
}) {

  await connectDB();


  if (!orderId) {

    throw new Error(
      "Order ID is required"
    );

  }


  const order =
    await getOrderByIdFromShopify(
      admin,
      orderId
    );


  const data =
    mapOrderToMongo(
      order,
      session.shop
    );


  const savedOrder =
    await Order.findOneAndUpdate(

      {
        shop:
          session.shop,

        shopifyId:
          order.id,
      },

      data,

      {
        returnDocument:
          "after",

        upsert:
          true,

        runValidators:
          true,
      }
    );


  return Response.json({

    success:
      true,

    data:
      savedOrder,

  });
}


// ============================================================
// CREATE ORDER
// ============================================================

// ============================================================
// CREATE ORDER
// ============================================================

export async function createOrder({
  admin,
  session,
  orderData,
}) {
  await connectDB();

  if (!orderData) {
    throw new Error(
      "Order data is required"
    );
  }

  // ----------------------------------------------------------
  // TRANSLATE LINE ITEM PRICE → SHOPIFY'S priceSet SHAPE
  // (OrderCreateLineItemInput has no flat "price" field)
  // ----------------------------------------------------------

  const shopDetails =
    await getShopDetails(admin);

  const preparedOrderData = {
    ...orderData,

    lineItems:
      (orderData.lineItems || []).map(
        ({ price, ...lineItem }) =>
          price === undefined ||
          price === null
            ? lineItem
            : {
                ...lineItem,

                priceSet: {
                  shopMoney: {
                    amount:
                      String(price),

                    currencyCode:
                      shopDetails.currencyCode,
                  },
                },
              }
      ),
  };

  console.log(
    "Creating Shopify order:",
    preparedOrderData
  );

  const response =
    await admin.graphql(
      `
        #graphql

        mutation CreateOrder(
          $order: OrderCreateOrderInput!
        ) {

          orderCreate(
            order: $order
          ) {

            order {

              id
              name
              number

              note
              tags

              createdAt
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
          order: preparedOrderData,
        },
      }
    );

  const result =
    await response.json();

  console.log(
    "Shopify order create response:",
    JSON.stringify(
      result,
      null,
      2
    )
  );

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
  // Shopify user errors
  // ----------------------------------------------------------

  const userErrors =
    result.data
      ?.orderCreate
      ?.userErrors || [];

  if (userErrors.length > 0) {
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
  // Created order
  // ----------------------------------------------------------

  const createdOrder =
    result.data
      ?.orderCreate
      ?.order;

  if (!createdOrder) {
    throw new Error(
      "Shopify did not return the created order"
    );
  }

  console.log(
    "Shopify order created:",
    {
      id:
        createdOrder.id,

      name:
        createdOrder.name,
    }
  );

  // ----------------------------------------------------------
  // GET COMPLETE ORDER FROM SHOPIFY
  // ----------------------------------------------------------

  const shopifyOrder =
    await getOrderByIdFromShopify(
      admin,
      createdOrder.id
    );

  // ----------------------------------------------------------
  // MAP TO MONGODB
  // ----------------------------------------------------------

  const data =
    mapOrderToMongo(
      shopifyOrder,
      session.shop
    );

  // ----------------------------------------------------------
  // SAVE MONGODB
  // ----------------------------------------------------------

  const savedOrder =
    await Order.findOneAndUpdate(

      {
        shop:
          session.shop,

        shopifyId:
          createdOrder.id,
      },

      data,

      {
        returnDocument:
          "after",

        upsert:
          true,

        runValidators:
          true,
      }
    );

  return Response.json({

    success:
      true,

    message:
      "Order created successfully",

    data:
      savedOrder,

  });
}


// ============================================================
// UPDATE ORDER
// ============================================================

export async function updateOrder({
  admin,
  session,
  orderData,
}) {

  await connectDB();


  if (!orderData?.id) {

    throw new Error(
      "Order ID is required"
    );

  }


  // ----------------------------------------------------------
  // UPDATE SHOPIFY
  // ----------------------------------------------------------

  const updatedOrder =
    await updateOrderOnShopify(
      admin,
      orderData
    );


  console.log(
    "Shopify update response:",
    {
      id:
        updatedOrder.id,

      name:
        updatedOrder.name,

      note:
        updatedOrder.note,

      tags:
        updatedOrder.tags,
    }
  );


  // ----------------------------------------------------------
  // GET COMPLETE ORDER FROM SHOPIFY
  // ----------------------------------------------------------

  const shopifyOrder =
    await getOrderByIdFromShopify(
      admin,
      updatedOrder.id
    );


  console.log(
    "Shopify order after update:",
    {
      id:
        shopifyOrder.id,

      name:
        shopifyOrder.name,

      note:
        shopifyOrder.note,

      tags:
        shopifyOrder.tags,
    }
  );


  // ----------------------------------------------------------
  // MAP TO MONGODB
  // ----------------------------------------------------------

  const data =
    mapOrderToMongo(
      shopifyOrder,
      session.shop
    );


  // ----------------------------------------------------------
  // SAVE MONGODB
  // ----------------------------------------------------------

  const savedOrder =
    await Order.findOneAndUpdate(

      {
        shop:
          session.shop,

        shopifyId:
          updatedOrder.id,
      },

      data,

      {
        returnDocument:
          "after",

        upsert:
          true,

        runValidators:
          true,
      }
    );


  console.log(
    "MongoDB order after update:",
    {
      name:
        savedOrder?.name,

      note:
        savedOrder?.note,

      tags:
        savedOrder?.tags,
    }
  );


  return Response.json({

    success:
      true,

    message:
      "Order updated successfully",

    data:
      savedOrder,

  });
}


// ============================================================
// CANCEL ORDER
// ============================================================

export async function cancelOrder({
  admin,
  session,
  orderId,
  reason,
  restock,
}) {

  await connectDB();


  if (!orderId) {

    throw new Error(
      "Order ID is required"
    );

  }


  const result =
    await cancelOrderOnShopify(
      admin,
      orderId,
      reason,
      restock
    );


  const shopifyOrder =
    await getOrderByIdFromShopify(
      admin,
      orderId
    );


  const data =
    mapOrderToMongo(
      shopifyOrder,
      session.shop
    );


  const savedOrder =
    await Order.findOneAndUpdate(

      {
        shop:
          session.shop,

        shopifyId:
          orderId,
      },

      data,

      {
        returnDocument:
          "after",

        upsert:
          true,

        runValidators:
          true,
      }
    );


  return Response.json({

    success:
      true,

    message:
      "Order cancellation requested successfully",

    job:
      result.job,

    data:
      savedOrder,

  });
}


// ============================================================
// DELETE ORDER
// ============================================================

// ============================================================
// DELETE ORDER
// ============================================================

export async function deleteOrder({
  admin,
  session,
  orderId,
}) {
  await connectDB();

  if (!orderId) {
    throw new Error(
      "Order ID is required"
    );
  }

  console.log(
    "Deleting Shopify order:",
    orderId
  );

  const response =
    await admin.graphql(
      `
        #graphql

        mutation DeleteOrder(
          $orderId: ID!
        ) {

          orderDelete(
            input: {
              id: $orderId
            }
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
          orderId,
        },
      }
    );

  const result =
    await response.json();

  console.log(
    "Shopify order delete response:",
    JSON.stringify(
      result,
      null,
      2
    )
  );

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
  // Shopify user errors
  // ----------------------------------------------------------

  const userErrors =
    result.data
      ?.orderDelete
      ?.userErrors || [];

  if (userErrors.length > 0) {
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
  // Deleted order ID
  // ----------------------------------------------------------

  const deletedId =
    result.data
      ?.orderDelete
      ?.deletedId;

  if (!deletedId) {
    throw new Error(
      "Shopify did not return the deleted order ID"
    );
  }

  console.log(
    "Shopify order deleted:",
    deletedId
  );

  // ----------------------------------------------------------
  // REMOVE FROM MONGODB
  // ----------------------------------------------------------

  await Order.deleteOne({
    shop:
      session.shop,

    shopifyId:
      orderId,
  });

  return Response.json({

    success:
      true,

    message:
      "Order deleted successfully",

    deletedId,

  });
}