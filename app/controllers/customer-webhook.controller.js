import {
  saveCustomerWebhook,
  deleteCustomerWebhook,
} from "../services/customer-webhook.service";


// ============================================================
// CUSTOMER CREATE WEBHOOK
// ============================================================

export async function handleCustomerCreateWebhook({
  shop,
  payload,
}) {
  await saveCustomerWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}


// ============================================================
// CUSTOMER UPDATE WEBHOOK
// ============================================================

export async function handleCustomerUpdateWebhook({
  shop,
  payload,
}) {
  await saveCustomerWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}


// ============================================================
// CUSTOMER DELETE WEBHOOK
// ============================================================

export async function handleCustomerDeleteWebhook({
  shop,
  payload,
}) {
  await deleteCustomerWebhook({
    shop,
    payload,
  });

  return new Response(null, {
    status: 200,
  });
}