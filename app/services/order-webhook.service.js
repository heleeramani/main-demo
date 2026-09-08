import Order from "../models/Order";

/**
 * Convert Shopify Order webhook payload
 * into our MongoDB Order structure.
 */
function mapOrderWebhookToMongo(order, shop) {
  return {
    shop,

    shopifyId: order.admin_graphql_api_id || String(order.id || ""),

    name: order.name || "",

    orderNumber: order.number !== undefined ? String(order.number) : "",

    note: order.note || "",

    tags: Array.isArray(order.tags) ? order.tags : [],

    customer: {
      shopifyId:
        order.customer?.admin_graphql_api_id ||
        String(order.customer?.id || ""),

      firstName: order.customer?.first_name || "",

      lastName: order.customer?.last_name || "",

      displayName:
        order.customer?.display_name ||
        `${order.customer?.first_name || ""} ${
          order.customer?.last_name || ""
        }`.trim(),

      email: order.customer?.email || "",

      phone: order.customer?.phone || "",
    },

    financialStatus: order.financial_status || "",

    fulfillmentStatus: order.fulfillment_status || "",

    currencyCode: order.currency || "",

    subtotalPrice: order.subtotal_price || "0.00",

    totalShipping: order.total_shipping_price_set?.shop_money?.amount || "0.00",

    totalTax: order.total_tax || "0.00",

    totalPrice: order.total_price || "0.00",

    lineItems: Array.isArray(order.line_items)
      ? order.line_items.map((item) => ({
          shopifyId: item.admin_graphql_api_id || String(item.id || ""),

          title: item.title || "",

          quantity: Number(item.quantity) || 0,

          sku: item.sku || "",

          variantId:
            item.variant_admin_graphql_api_id || String(item.variant_id || ""),

          variantTitle: item.variant_title || "",

          productId:
            item.product_admin_graphql_api_id || String(item.product_id || ""),

          vendor: item.vendor || "",

          unitPrice: item.price || "0.00",

          originalTotal:
            item.price && item.quantity
              ? String(Number(item.price) * Number(item.quantity))
              : "0.00",
        }))
      : [],

    shippingAddress: {
      firstName: order.shipping_address?.first_name || "",

      lastName: order.shipping_address?.last_name || "",

      address1: order.shipping_address?.address1 || "",

      address2: order.shipping_address?.address2 || "",

      city: order.shipping_address?.city || "",

      province: order.shipping_address?.province || "",

      country: order.shipping_address?.country || "",

      zip: order.shipping_address?.zip || "",

      phone: order.shipping_address?.phone || "",
    },

    shopifyCreatedAt: order.created_at ? new Date(order.created_at) : null,

    shopifyUpdatedAt: order.updated_at ? new Date(order.updated_at) : null,

    cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : null,

    cancelReason: order.cancel_reason || "",
  };
}

/**
 * Create or update an order in MongoDB.
 *
 * Used for:
 * ORDERS_CREATE
 * ORDERS_UPDATED
 * ORDERS_CANCELLED
 */
export async function saveOrderWebhook({ shop, payload }) {
  const orderData = mapOrderWebhookToMongo(payload, shop);

  console.log("========================================");
  console.log("ORDER WEBHOOK → MONGODB");
  console.log("Topic order:", orderData.name);
  console.log("Shop:", shop);
  console.log("Shopify ID:", orderData.shopifyId);
  console.log("Note:", orderData.note);
  console.log("Tags:", orderData.tags);
  console.log("========================================");

  const order = await Order.findOneAndUpdate(
    {
      shop,
      shopifyId: orderData.shopifyId,
    },
    {
      $set: orderData,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );

  console.log("Order saved successfully:", order?.name);

  return order;
}
