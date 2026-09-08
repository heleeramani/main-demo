import {
  saveProductWebhook,
  deleteProductWebhook,
} from "../services/webhook.service";

/**
 * Handle PRODUCTS_CREATE webhook
 */
export async function handleProductCreateWebhook({
  shop,
  payload,
}) {
  await saveProductWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}

/**
 * Handle PRODUCTS_UPDATE webhook
 */
export async function handleProductUpdateWebhook({
  shop,
  payload,
}) {
  await saveProductWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}

/**
 * Handle PRODUCTS_DELETE webhook
 */
export async function handleProductDeleteWebhook({
  shop,
  payload,
}) {
  await deleteProductWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}