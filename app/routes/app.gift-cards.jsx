// app/routes/app.gift-cards.jsx

import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";

// ============================================================
// LOADER
// ============================================================

export async function loader({ request }) {
  await authenticate.admin(request);

  return null;
}

// ============================================================
// COMPONENT
// ============================================================

export default function GiftCards() {
  const [giftCards, setGiftCards] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedGiftCard, setSelectedGiftCard] = useState(null);

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    initialValue: "",
    customerId: "",
    note: "",
    expiresOn: "",
  });

  // ==========================================================
  // HELPERS
  // ==========================================================

  function getGiftCardId(giftCard) {
    return giftCard?.id || giftCard?.shopifyId || "";
  }

  function getInitialValue(giftCard) {
    return giftCard?.initialValue?.amount ?? giftCard?.initialValue ?? 0;
  }

  function getBalance(giftCard) {
    return giftCard?.balance?.amount ?? giftCard?.currentBalance ?? 0;
  }

  function getCurrency(giftCard) {
    return (
      giftCard?.balance?.currencyCode ??
      giftCard?.initialValue?.currencyCode ??
      giftCard?.currencyCode ??
      "USD"
    );
  }

  function getCustomerName(giftCard) {
    return giftCard?.customer?.displayName || giftCard?.customerName || "-";
  }

  function getCustomerEmail(giftCard) {
    return giftCard?.customer?.email || giftCard?.customerEmail || "-";
  }

  function getCustomerId(giftCard) {
    return giftCard?.customer?.id || giftCard?.customerId || "";
  }

  function formatMoney(amount, currencyCode) {
    if (amount === undefined || amount === null) {
      return "-";
    }

    return `${currencyCode || ""} ${Number(amount).toFixed(2)}`;
  }

  // ==========================================================
  // SAFE JSON
  // ==========================================================

  async function getJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();

    throw new Error(text || "Server returned an invalid response");
  }

  // ==========================================================
  // LOAD GIFT CARDS
  // ==========================================================

  async function loadGiftCards(showMessage = true) {
    try {
      setLoading(true);
      setError("");

      if (showMessage) {
        setSuccess("");
      }

      const response = await fetch("/api/gift-cards");

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load gift cards");
      }

      console.log("GIFT CARDS FROM API:", data.giftCards);

      setGiftCards(data.giftCards || []);

      if (showMessage) {
        setSuccess(data.message || "Gift cards synced successfully");
      }

      return data;
    } catch (error) {
      console.error("Load gift cards error:", error);

      setError(error?.message || "Failed to load gift cards");

      throw error;
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadGiftCards(false).catch(() => {});
  }, []);

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ==========================================================
  // CREATE
  // ==========================================================

  async function handleCreate() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.initialValue) {
        throw new Error("Initial value is required");
      }

      const response = await fetch("/api/gift-cards", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "create",

          giftCard: {
            initialValue: form.initialValue,

            customerId: form.customerId.trim(),

            note: form.note.trim(),

            expiresOn: form.expiresOn || "",
          },
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create gift card");
      }

      const giftCardCode = data.giftCardCode || "";

      setForm({
        initialValue: "",
        customerId: "",
        note: "",
        expiresOn: "",
      });

      // Refresh list WITHOUT replacing
      // our success message.
      await loadGiftCards(false);

      if (giftCardCode) {
        setSuccess(`Gift card created successfully. Code: ${giftCardCode}`);
      } else {
        setSuccess("Gift card created successfully");
      }
    } catch (error) {
      console.error("Create gift card error:", error);

      setError(error?.message || "Failed to create gift card");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // VIEW
  // ==========================================================

  async function handleView(giftCardId) {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/gift-cards?giftCardId=${encodeURIComponent(giftCardId)}`,
      );

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get gift card");
      }

      setSelectedGiftCard(data.giftCard);
    } catch (error) {
      console.error("View gift card error:", error);

      setError(error?.message || "Failed to get gift card");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // EDIT
  // ==========================================================

  function handleEdit(giftCard) {
    const giftCardId = getGiftCardId(giftCard);

    setSelectedGiftCard({
      ...giftCard,
      id: giftCardId,
    });

    setEditing(true);

    setForm({
      initialValue: "",

      customerId: getCustomerId(giftCard),

      note: giftCard.note || "",

      expiresOn: giftCard.expiresOn
        ? new Date(giftCard.expiresOn).toISOString().split("T")[0]
        : "",
    });

    setError("");
    setSuccess("");
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  async function handleUpdate() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const giftCardId = getGiftCardId(selectedGiftCard);

      if (!giftCardId) {
        throw new Error("Gift Card ID is missing");
      }

      const response = await fetch("/api/gift-cards", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          giftCardId,

          customerId: form.customerId.trim(),

          note: form.note.trim(),

          expiresOn: form.expiresOn || null,
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update gift card");
      }

      setEditing(false);

      setSelectedGiftCard(data.giftCard);

      await loadGiftCards(false);

      setSuccess(data.message || "Gift card updated successfully");
    } catch (error) {
      console.error("Update gift card error:", error);

      setError(error?.message || "Failed to update gift card");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // DEACTIVATE
  // ==========================================================

  async function handleDeactivate(giftCardId) {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this gift card?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/gift-cards", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          giftCardId,
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to deactivate gift card");
      }

      setSelectedGiftCard(null);

      setEditing(false);

      await loadGiftCards(false);

      setSuccess(data.message || "Gift card deactivated successfully");
    } catch (error) {
      console.error("Deactivate gift card error:", error);

      setError(error?.message || "Failed to deactivate gift card");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  function handleCancelEdit() {
    setEditing(false);

    setForm({
      initialValue: "",
      customerId: "",
      note: "",
      expiresOn: "",
    });
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <s-page heading="Gift Cards">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <s-button
        slot="primary-action"
        onClick={() => loadGiftCards(true)}
        loading={loading}
      >
        Sync Gift Cards
      </s-button>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <s-banner tone="critical" heading="Error">
          {error}
        </s-banner>
      )}

      {/* ====================================================
          SUCCESS
      ==================================================== */}

      {success && !error && (
        <s-banner tone="success" heading="Success">
          {success}
        </s-banner>
      )}

      {/* ====================================================
          CREATE / UPDATE
      ==================================================== */}

      <s-section heading={editing ? "Update Gift Card" : "Create Gift Card"}>
        {!editing && (
          <s-text-field
            label="Initial Value"
            type="number"
            value={form.initialValue}
            onInput={(event) =>
              handleChange("initialValue", event.currentTarget.value)
            }
          />
        )}

        <s-text-field
          label="Customer ID"
          value={form.customerId}
          placeholder="gid://shopify/Customer/..."
          onInput={(event) =>
            handleChange("customerId", event.currentTarget.value)
          }
        />

        <s-text-field
          label="Note"
          value={form.note}
          onInput={(event) => handleChange("note", event.currentTarget.value)}
        />

        <s-text-field
          label="Expiration Date"
          type="date"
          value={form.expiresOn}
          onInput={(event) =>
            handleChange("expiresOn", event.currentTarget.value)
          }
        />

        <s-stack direction="inline" gap="base">
          {editing ? (
            <>
              <s-button
                variant="primary"
                onClick={handleUpdate}
                loading={saving}
              >
                Update Gift Card
              </s-button>

              <s-button onClick={handleCancelEdit}>Cancel</s-button>
            </>
          ) : (
            <s-button variant="primary" onClick={handleCreate} loading={saving}>
              Create Gift Card
            </s-button>
          )}
        </s-stack>
      </s-section>

      {/* ====================================================
          DETAILS
      ==================================================== */}

      {selectedGiftCard && (
        <s-section heading="Gift Card Details">
          <s-stack gap="base">
            <s-text>
              <strong>ID:</strong> {getGiftCardId(selectedGiftCard)}
            </s-text>

            <s-text>
              <strong>Status:</strong>{" "}
              {selectedGiftCard.enabled ? "Active" : "Inactive"}
            </s-text>

            <s-text>
              <strong>Initial Value:</strong>{" "}
              {formatMoney(
                getInitialValue(selectedGiftCard),
                getCurrency(selectedGiftCard),
              )}
            </s-text>

            <s-text>
              <strong>Current Balance:</strong>{" "}
              {formatMoney(
                getBalance(selectedGiftCard),
                getCurrency(selectedGiftCard),
              )}
            </s-text>

            <s-text>
              <strong>Customer:</strong> {getCustomerName(selectedGiftCard)}
            </s-text>

            <s-text>
              <strong>Email:</strong> {getCustomerEmail(selectedGiftCard)}
            </s-text>

            <s-text>
              <strong>Note:</strong> {selectedGiftCard.note || "-"}
            </s-text>

            <s-text>
              <strong>Expires:</strong>{" "}
              {selectedGiftCard.expiresOn
                ? new Date(selectedGiftCard.expiresOn).toLocaleDateString()
                : "-"}
            </s-text>
          </s-stack>
        </s-section>
      )}

      {/* ====================================================
          GIFT CARD LIST
      ==================================================== */}

      <s-section heading="Gift Cards">
        {loading ? (
          <s-spinner />
        ) : giftCards.length === 0 ? (
          <s-text>No gift cards found.</s-text>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>ID</s-table-header>

              <s-table-header>Initial Value</s-table-header>

              <s-table-header>Balance</s-table-header>

              <s-table-header>Customer</s-table-header>

              <s-table-header>Status</s-table-header>

              <s-table-header>Expires</s-table-header>

              <s-table-header>Actions</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {giftCards.map((giftCard) => {
                const giftCardId = getGiftCardId(giftCard);

                return (
                  <s-table-row key={giftCardId}>
                    <s-table-cell>
                      {giftCardId ? giftCardId.split("/").pop() : "-"}
                    </s-table-cell>

                    <s-table-cell>
                      {formatMoney(
                        getInitialValue(giftCard),
                        getCurrency(giftCard),
                      )}
                    </s-table-cell>

                    <s-table-cell>
                      {formatMoney(getBalance(giftCard), getCurrency(giftCard))}
                    </s-table-cell>

                    <s-table-cell>{getCustomerName(giftCard)}</s-table-cell>

                    <s-table-cell>
                      {giftCard.enabled ? "Active" : "Inactive"}
                    </s-table-cell>

                    <s-table-cell>
                      {giftCard.expiresOn
                        ? new Date(giftCard.expiresOn).toLocaleDateString()
                        : "-"}
                    </s-table-cell>

                    <s-table-cell>
                      <s-stack direction="inline" gap="small">
                        <s-button onClick={() => handleView(giftCardId)}>
                          View
                        </s-button>

                        {giftCard.enabled && (
                          <>
                            <s-button onClick={() => handleEdit(giftCard)}>
                              Edit
                            </s-button>

                            <s-button
                              tone="critical"
                              onClick={() => handleDeactivate(giftCardId)}
                            >
                              Deactivate
                            </s-button>
                          </>
                        )}
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}
