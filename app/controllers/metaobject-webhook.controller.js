import {
  handleMetaobjectCreate,
  handleMetaobjectUpdate,
  handleMetaobjectDelete,
} from "../services/metaobject-webhook.service";

// ============================================================
// METAOBJECT CREATE
// ============================================================

export async function createMetaobjectWebhookController({ shop, payload }) {
  return handleMetaobjectCreate(shop, payload);
}

// ============================================================
// METAOBJECT UPDATE
// ============================================================

export async function updateMetaobjectWebhookController({ shop, payload }) {
  return handleMetaobjectUpdate(shop, payload);
}

// ============================================================
// METAOBJECT DELETE
// ============================================================

export async function deleteMetaobjectWebhookController({ shop, payload }) {
  return handleMetaobjectDelete(shop, payload);
}
