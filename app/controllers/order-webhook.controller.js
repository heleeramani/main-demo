import {
  saveOrderWebhook,
} from "../services/order-webhook.service";

/**
 * Handle ORDERS_CREATE webhook
 */
export async function handleOrderCreateWebhook({
  shop,
  payload,
}) {
  await saveOrderWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}

/**
 * Handle ORDERS_UPDATED webhook
 */
export async function handleOrderUpdatedWebhook({
  shop,
  payload,
}) {
  await saveOrderWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}

/**
 * Handle ORDERS_CANCELLED webhook
 */
export async function handleOrderCancelledWebhook({
  shop,
  payload,
}) {
  await saveOrderWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}