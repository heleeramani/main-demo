import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";

// ============================================================
// LOADER
// ============================================================
// React Router requires a loader for this authenticated app route.
// This also verifies that the Shopify admin session is valid.
// ============================================================

export async function loader({ request }) {
  await authenticate.admin(request);

  return null;
}

// ============================================================
// DISCOUNTS PAGE
// ============================================================

export default function Discounts() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [discounts, setDiscounts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const [editMode, setEditMode] = useState(false);

  // ==========================================================
  // EMPTY FORM
  // ==========================================================

  const emptyForm = {
    title: "",
    code: "",
    discountType: "percentage",
    percentage: "10",
    fixedAmount: "",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    appliesOncePerCustomer: false,
  };

  const [form, setForm] = useState(emptyForm);

  // ==========================================================
  // CLEAR MESSAGES
  // ==========================================================

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  // ==========================================================
  // SAFE JSON RESPONSE
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
  // LOAD DISCOUNTS
  // ==========================================================

  async function loadDiscounts() {
    try {
      setLoading(true);

      clearMessages();

      const response = await fetch("/api/discounts");

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load discounts");
      }

      setDiscounts(data.discounts || []);

      setSuccess(
        `Discounts synced successfully: ${data.discounts?.length || 0}`,
      );
    } catch (error) {
      console.error("Load discounts error:", error);

      setError(error?.message || "Failed to load discounts");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDiscounts();
  }, []);

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(event) {
    const name = event.target.name;

    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================================
  // CREATE DISCOUNT
  // ==========================================================

  async function handleCreateDiscount() {
    try {
      setLoading(true);

      clearMessages();

      // ------------------------------------------------------
      // Validation
      // ------------------------------------------------------

      if (!form.title.trim()) {
        throw new Error("Discount title is required");
      }

      if (!form.code.trim()) {
        throw new Error("Discount code is required");
      }

      // ------------------------------------------------------
      // Prepare data
      // ------------------------------------------------------

      const discountData = {
        title: form.title.trim(),

        code: form.code.trim(),

        discountType: form.discountType,

        percentage: form.percentage,

        fixedAmount: form.fixedAmount,

        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : new Date().toISOString(),

        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,

        usageLimit: form.usageLimit,

        appliesOncePerCustomer: Boolean(form.appliesOncePerCustomer),
      };

      console.log("CREATE DISCOUNT:", discountData);

      // ------------------------------------------------------
      // API request
      // ------------------------------------------------------

      const response = await fetch("/api/discounts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "create",

          discount: discountData,
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create discount");
      }

      // ------------------------------------------------------
      // Success
      // ------------------------------------------------------

      setShowCreateForm(false);

      setForm(emptyForm);

      setSuccess("Discount created successfully");

      await loadDiscounts();
    } catch (error) {
      console.error("Create discount error:", error);

      setError(error?.message || "Failed to create discount");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // VIEW DISCOUNT
  // ==========================================================

  async function handleViewDiscount(discountId) {
    try {
      setLoading(true);

      clearMessages();

      const response = await fetch(
        `/api/discounts?discountId=${encodeURIComponent(discountId)}`,
      );

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get discount");
      }

      setSelectedDiscount(data.discount);

      setEditMode(false);
    } catch (error) {
      console.error("View discount error:", error);

      setError(error?.message || "Failed to get discount");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // START EDIT
  // ==========================================================

  function startEditDiscount(discount) {
    clearMessages();

    let discountType = "percentage";

    let percentage = "10";

    let fixedAmount = "";

    const value = discount?.customerGets?.value;

    if (value?.percentage !== undefined) {
      discountType = "percentage";

      percentage = String(Number(value.percentage) * 100);
    }

    if (value?.amount?.amount) {
      discountType = "fixed";

      fixedAmount = String(value.amount.amount);
    }

    setSelectedDiscount(discount);

    setEditMode(true);

    setForm({
      title: discount.title || "",

      code: discount.codes?.nodes?.[0]?.code || "",

      discountType,

      percentage,

      fixedAmount,

      startsAt: discount.startsAt ? discount.startsAt.slice(0, 16) : "",

      endsAt: discount.endsAt ? discount.endsAt.slice(0, 16) : "",

      usageLimit: discount.usageLimit ?? "",

      appliesOncePerCustomer: Boolean(discount.appliesOncePerCustomer),
    });
  }

  // ==========================================================
  // UPDATE DISCOUNT
  // ==========================================================

  async function handleUpdateDiscount() {
    try {
      setLoading(true);

      clearMessages();

      if (!selectedDiscount?.id) {
        throw new Error("Discount ID is missing");
      }

      const discountData = {
        id: selectedDiscount.id,

        title: form.title.trim(),

        code: form.code.trim(),

        discountType: form.discountType,

        percentage: form.percentage,

        fixedAmount: form.fixedAmount,

        startsAt: form.startsAt
          ? new Date(form.startsAt).toISOString()
          : undefined,

        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,

        usageLimit: form.usageLimit,

        appliesOncePerCustomer: Boolean(form.appliesOncePerCustomer),
      };

      console.log("UPDATE DISCOUNT:", discountData);

      const response = await fetch("/api/discounts", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(discountData),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update discount");
      }

      setSelectedDiscount(null);

      setEditMode(false);

      setForm(emptyForm);

      setSuccess("Discount updated successfully");

      await loadDiscounts();
    } catch (error) {
      console.error("Update discount error:", error);

      setError(error?.message || "Failed to update discount");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // DELETE DISCOUNT
  // ==========================================================

  async function handleDeleteDiscount(discountId) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this discount?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      clearMessages();

      const response = await fetch("/api/discounts", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          discountId,
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete discount");
      }

      setSelectedDiscount(null);

      setEditMode(false);

      setSuccess("Discount deleted successfully");

      await loadDiscounts();
    } catch (error) {
      console.error("Delete discount error:", error);

      setError(error?.message || "Failed to delete discount");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CLOSE DETAILS
  // ==========================================================

  function closeDetails() {
    setSelectedDiscount(null);

    setEditMode(false);

    setForm(emptyForm);

    clearMessages();
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <s-page heading="Discounts">
      {/* ====================================================
          CREATE BUTTON
      ===================================================== */}

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => {
          clearMessages();

          setShowCreateForm(true);

          setSelectedDiscount(null);

          setEditMode(false);

          setForm(emptyForm);
        }}
      >
        Create discount
      </s-button>

      {/* ====================================================
          ERROR
      ===================================================== */}

      {error && <s-banner tone="critical">{error}</s-banner>}

      {/* ====================================================
          SUCCESS
      ===================================================== */}

      {success && !error && <s-banner tone="success">{success}</s-banner>}

      {/* ====================================================
          CREATE FORM
      ===================================================== */}

      {showCreateForm && (
        <s-section heading="Create discount">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Title"
              name="title"
              value={form.title}
              onInput={handleChange}
            />

            <s-text-field
              label="Discount code"
              name="code"
              value={form.code}
              onInput={handleChange}
              help-text="Example: SAVE20"
            />

            <s-select
              label="Discount type"
              name="discountType"
              value={form.discountType}
              onChange={handleChange}
            >
              <s-option value="percentage">Percentage</s-option>

              <s-option value="fixed">Fixed amount</s-option>
            </s-select>

            {form.discountType === "percentage" ? (
              <s-text-field
                label="Percentage"
                name="percentage"
                type="number"
                value={form.percentage}
                onInput={handleChange}
                help-text="Example: 20 = 20% off"
              />
            ) : (
              <s-text-field
                label="Fixed amount"
                name="fixedAmount"
                type="number"
                value={form.fixedAmount}
                onInput={handleChange}
                help-text="Example: 10 = fixed discount amount"
              />
            )}

            <s-text-field
              label="Start date"
              name="startsAt"
              type="datetime-local"
              value={form.startsAt}
              onInput={handleChange}
            />

            <s-text-field
              label="End date"
              name="endsAt"
              type="datetime-local"
              value={form.endsAt}
              onInput={handleChange}
            />

            <s-text-field
              label="Usage limit"
              name="usageLimit"
              type="number"
              value={form.usageLimit}
              onInput={handleChange}
              help-text="Leave empty for unlimited"
            />

            <s-checkbox
              label="Limit to one use per customer"
              checked={form.appliesOncePerCustomer}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,

                  appliesOncePerCustomer: event.target.checked,
                }))
              }
            />

            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                onClick={handleCreateDiscount}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </s-button>

              <s-button
                onClick={() => {
                  setShowCreateForm(false);

                  setForm(emptyForm);

                  clearMessages();
                }}
              >
                Cancel
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>
      )}

      {/* ====================================================
          DISCOUNT DETAILS
      ===================================================== */}

      {selectedDiscount && (
        <s-section heading={editMode ? "Edit discount" : "Discount details"}>
          {editMode ? (
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Title"
                name="title"
                value={form.title}
                onInput={handleChange}
              />

              <s-text-field
                label="Discount code"
                name="code"
                value={form.code}
                onInput={handleChange}
              />

              <s-select
                label="Discount type"
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
              >
                <s-option value="percentage">Percentage</s-option>

                <s-option value="fixed">Fixed amount</s-option>
              </s-select>

              {form.discountType === "percentage" ? (
                <s-text-field
                  label="Percentage"
                  name="percentage"
                  type="number"
                  value={form.percentage}
                  onInput={handleChange}
                />
              ) : (
                <s-text-field
                  label="Fixed amount"
                  name="fixedAmount"
                  type="number"
                  value={form.fixedAmount}
                  onInput={handleChange}
                />
              )}

              <s-text-field
                label="Start date"
                name="startsAt"
                type="datetime-local"
                value={form.startsAt}
                onInput={handleChange}
              />

              <s-text-field
                label="End date"
                name="endsAt"
                type="datetime-local"
                value={form.endsAt}
                onInput={handleChange}
              />

              <s-text-field
                label="Usage limit"
                name="usageLimit"
                type="number"
                value={form.usageLimit}
                onInput={handleChange}
              />

              <s-checkbox
                label="Limit to one use per customer"
                checked={form.appliesOncePerCustomer}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,

                    appliesOncePerCustomer: event.target.checked,
                  }))
                }
              />

              <s-stack direction="inline" gap="base">
                <s-button
                  variant="primary"
                  onClick={handleUpdateDiscount}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save changes"}
                </s-button>

                <s-button onClick={closeDetails}>Cancel</s-button>
              </s-stack>
            </s-stack>
          ) : (
            <s-stack direction="block" gap="base">
              <s-text>
                <strong>Title:</strong> {selectedDiscount.title || "-"}
              </s-text>

              <s-text>
                <strong>Code:</strong>{" "}
                {selectedDiscount.codes?.nodes?.[0]?.code || "-"}
              </s-text>

              <s-text>
                <strong>Status:</strong> {selectedDiscount.status || "-"}
              </s-text>

              <s-text>
                <strong>Start:</strong> {selectedDiscount.startsAt || "-"}
              </s-text>

              <s-text>
                <strong>End:</strong> {selectedDiscount.endsAt || "No expiry"}
              </s-text>

              <s-text>
                <strong>Usage limit:</strong>{" "}
                {selectedDiscount.usageLimit ?? "Unlimited"}
              </s-text>

              <s-text>
                <strong>Used:</strong> {selectedDiscount.asyncUsageCount ?? 0}
              </s-text>

              <s-stack direction="inline" gap="base">
                <s-button onClick={() => startEditDiscount(selectedDiscount)}>
                  Edit
                </s-button>

                <s-button
                  tone="critical"
                  onClick={() => handleDeleteDiscount(selectedDiscount.id)}
                >
                  Delete
                </s-button>

                <s-button onClick={closeDetails}>Close</s-button>
              </s-stack>
            </s-stack>
          )}
        </s-section>
      )}

      {/* ====================================================
          DISCOUNT LIST
      ===================================================== */}

      <s-section heading="Discount list">
        <s-button onClick={loadDiscounts} disabled={loading}>
          {loading ? "Syncing..." : "Sync discounts"}
        </s-button>

        <div
          style={{
            marginTop: "16px",
            overflowX: "auto",
          }}
        >
          {discounts.length === 0 ? (
            <s-text>No discounts found.</s-text>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Code
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Title
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Status
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Type
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Usage
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {discounts.map((discount) => {
                  const value = discount?.customerGets?.value;

                  let type = "Unknown";

                  let valueText = "-";

                  if (value?.percentage !== undefined) {
                    type = "Percentage";

                    valueText = `${Number(value.percentage) * 100}%`;
                  }

                  if (value?.amount?.amount) {
                    type = "Fixed amount";

                    valueText = value.amount.amount;
                  }

                  return (
                    <tr key={discount.id}>
                      <td
                        style={{
                          padding: "10px",
                        }}
                      >
                        {discount.codes?.nodes?.[0]?.code || "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                        }}
                      >
                        {discount.title || "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                        }}
                      >
                        {discount.status || "-"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                        }}
                      >
                        {type} {valueText}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                        }}
                      >
                        {discount.asyncUsageCount ?? 0}
                        {" / "}
                        {discount.usageLimit ?? "∞"}
                      </td>

                      <td
                        style={{
                          padding: "10px",
                        }}
                      >
                        <s-stack direction="inline" gap="small">
                          <s-button
                            onClick={() => handleViewDiscount(discount.id)}
                          >
                            View
                          </s-button>

                          <s-button onClick={() => startEditDiscount(discount)}>
                            Edit
                          </s-button>

                          <s-button
                            tone="critical"
                            onClick={() => handleDeleteDiscount(discount.id)}
                          >
                            Delete
                          </s-button>
                        </s-stack>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </s-section>
    </s-page>
  );
}
