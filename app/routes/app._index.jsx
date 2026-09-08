import { useState } from "react";

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState(null);
  const [error, setError] = useState("");

  async function syncStore() {
    try {
      setLoading(true);
      setError("");
      setStore(null);

      const response = await fetch("/api/store-sync");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sync store");
      }

      setStore(data.data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <s-page heading="ShopSync Demo">
      <s-section heading="Store">
        <s-button onClick={syncStore} {...(loading ? { loading: true } : {})}>
          Sync Store
        </s-button>

        {error && (
          <s-banner tone="critical">
            {error}
          </s-banner>
        )}

        {store && (
          <s-box padding="base">
            <s-stack gap="base">
              <s-text>
                <strong>Shop:</strong> {store.shop}
              </s-text>

              <s-text>
                <strong>Name:</strong> {store.name}
              </s-text>

              <s-text>
                <strong>Email:</strong> {store.email || "N/A"}
              </s-text>

              <s-text>
                <strong>Currency:</strong> {store.currencyCode}
              </s-text>

              <s-text>
                <strong>Shopify ID:</strong> {store.shopifyId}
              </s-text>
            </s-stack>
          </s-box>
        )}
      </s-section>
    </s-page>
  );
}