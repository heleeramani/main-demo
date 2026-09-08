import { useEffect, useState } from "react";

// ============================================================
// CUSTOMERS PAGE
// ============================================================

export default function Customers() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [editMode, setEditMode] = useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    note: "",
    tags: "",
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
  //
  // This prevents:
  //
  // Unexpected token 'U'
  //
  // if backend accidentally returns plain text.
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
  // LOAD / SYNC CUSTOMERS
  // ==========================================================

  async function loadCustomers() {
    try {
      setLoading(true);
      clearMessages();

      const response = await fetch("/api/customers");

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load customers");
      }

      setCustomers(data.data || []);

      setSuccess(
        `Customers synced successfully: ${data.data?.length || 0}`,
      );
    } catch (error) {
      console.error("Load customers error:", error);

      setError(error?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // LOAD CUSTOMERS WHEN PAGE OPENS
  // ==========================================================

  useEffect(() => {
    loadCustomers();
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
  // CREATE CUSTOMER
  // ==========================================================

  async function handleCreateCustomer() {
    try {
      setLoading(true);
      clearMessages();

      // ================================================
      // Basic validation
      // ================================================

      if (!form.firstName.trim()) {
        throw new Error("First name is required");
      }

      if (!form.email.trim()) {
        throw new Error("Email is required");
      }

      // ================================================
      // Customer payload
      // ================================================

      const customerData = {
        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        email: form.email.trim(),

        note: form.note.trim(),

        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      // ================================================
      // IMPORTANT
      //
      // Only send phone when user entered it.
      //
      // Empty phone:
      // ""
      //
      // is NOT sent to Shopify.
      // ================================================

      if (form.phone.trim()) {
        customerData.phone = form.phone.trim();
      }

      console.log("CREATE CUSTOMER PAYLOAD:", customerData);

      // ================================================
      // API REQUEST
      // ================================================

      const response = await fetch("/api/customers", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customer: customerData,
        }),
      });

      // ================================================
      // Parse response safely
      // ================================================

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create customer");
      }

      // ================================================
      // Success
      // ================================================

      setSuccess("Customer created successfully");

      setShowCreateForm(false);

      setForm(emptyForm);

      await loadCustomers();
    } catch (error) {
      console.error("Create customer error:", error);

      setError(error?.message || "Failed to create customer");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // VIEW CUSTOMER
  // ==========================================================

  async function handleViewCustomer(customerId) {
    try {
      setLoading(true);
      clearMessages();

      const response = await fetch(
        `/api/customers?customerId=${encodeURIComponent(customerId)}`,
      );

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get customer");
      }

      setSelectedCustomer(data.data);

      setEditMode(false);
    } catch (error) {
      console.error("View customer error:", error);

      setError(error?.message || "Failed to get customer");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // START EDIT
  // ==========================================================

  function startEditCustomer(customer) {
    clearMessages();

    setSelectedCustomer(customer);

    setEditMode(true);

    setForm({
      firstName: customer.firstName || "",

      lastName: customer.lastName || "",

      email: customer.email || "",

      phone: customer.phone || "",

      note: customer.note || "",

      tags: Array.isArray(customer.tags) ? customer.tags.join(", ") : "",
    });
  }

  // ==========================================================
  // UPDATE CUSTOMER
  // ==========================================================

  async function handleUpdateCustomer() {
    try {
      setLoading(true);
      clearMessages();

      if (!selectedCustomer?.shopifyId) {
        throw new Error("Customer ID is missing");
      }

      // ================================================
      // Update payload
      // ================================================

      const customerData = {
        id: selectedCustomer.shopifyId,

        firstName: form.firstName.trim(),

        lastName: form.lastName.trim(),

        email: form.email.trim(),

        note: form.note.trim(),

        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      // ================================================
      // Only send phone if entered
      // ================================================

      if (form.phone.trim()) {
        customerData.phone = form.phone.trim();
      }

      console.log("UPDATE CUSTOMER PAYLOAD:", customerData);

      // ================================================
      // API REQUEST
      // ================================================

      const response = await fetch("/api/customers", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(customerData),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update customer");
      }

      // ================================================
      // Success
      // ================================================

      setSuccess("Customer updated successfully");

      setEditMode(false);

      setSelectedCustomer(null);

      setForm(emptyForm);

      await loadCustomers();
    } catch (error) {
      console.error("Update customer error:", error);

      setError(error?.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // DELETE CUSTOMER
  // ==========================================================

  async function handleDeleteCustomer(customerId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      clearMessages();

      const response = await fetch("/api/customers", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          customerId,
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete customer");
      }

      setSuccess("Customer deleted successfully");

      setSelectedCustomer(null);

      setEditMode(false);

      await loadCustomers();
    } catch (error) {
      console.error("Delete customer error:", error);

      setError(error?.message || "Failed to delete customer");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CLOSE CUSTOMER DETAILS
  // ==========================================================

  function closeCustomerDetails() {
    setSelectedCustomer(null);

    setEditMode(false);

    setForm(emptyForm);
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <s-page heading="Customers">
      {/* ====================================================
          PRIMARY ACTION
      ===================================================== */}

      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => {
          clearMessages();

          setShowCreateForm(true);

          setSelectedCustomer(null);

          setEditMode(false);

          setForm(emptyForm);
        }}
      >
        Create customer
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
          CREATE CUSTOMER
      ===================================================== */}

      {showCreateForm && (
        <s-section heading="Create customer">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="First name"
              name="firstName"
              value={form.firstName}
              onInput={handleChange}
            />

            <s-text-field
              label="Last name"
              name="lastName"
              value={form.lastName}
              onInput={handleChange}
            />

            <s-text-field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onInput={handleChange}
            />

            <s-text-field
              label="Phone"
              name="phone"
              value={form.phone}
              onInput={handleChange}
              help-text="Optional. Use international format, e.g. +919876543210"
            />

            <s-text-field
              label="Tags"
              name="tags"
              value={form.tags}
              onInput={handleChange}
              help-text="Separate multiple tags with commas"
            />

            <s-text-field
              label="Note"
              name="note"
              value={form.note}
              onInput={handleChange}
            />

            <s-stack direction="inline" gap="base">
              <s-button
                variant="primary"
                onClick={handleCreateCustomer}
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
          CUSTOMER DETAILS
      ===================================================== */}

      {selectedCustomer && (
        <s-section heading={editMode ? "Edit customer" : "Customer details"}>
          <s-stack direction="block" gap="base">
            {/* ==================================================
                EDIT MODE
            ================================================== */}

            {editMode ? (
              <>
                <s-text-field
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onInput={handleChange}
                />

                <s-text-field
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onInput={handleChange}
                />

                <s-text-field
                  label="Email"
                  name="email"
                  value={form.email}
                  onInput={handleChange}
                />

                <s-text-field
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onInput={handleChange}
                  help-text="Optional. Use international format."
                />

                <s-text-field
                  label="Tags"
                  name="tags"
                  value={form.tags}
                  onInput={handleChange}
                />

                <s-text-field
                  label="Note"
                  name="note"
                  value={form.note}
                  onInput={handleChange}
                />

                <s-stack direction="inline" gap="base">
                  <s-button
                    variant="primary"
                    onClick={handleUpdateCustomer}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save changes"}
                  </s-button>

                  <s-button onClick={closeCustomerDetails}>Cancel</s-button>
                </s-stack>
              </>
            ) : (
              /* ==================================================
                 VIEW MODE
              ================================================== */

              <>
                <s-text>
                  <strong>Name:</strong>{" "}
                  {selectedCustomer.displayName ||
                    `${selectedCustomer.firstName || ""} ${
                      selectedCustomer.lastName || ""
                    }`.trim() ||
                    "-"}
                </s-text>

                <s-text>
                  <strong>Email:</strong> {selectedCustomer.email || "-"}
                </s-text>

                <s-text>
                  <strong>Phone:</strong> {selectedCustomer.phone || "-"}
                </s-text>

                <s-text>
                  <strong>State:</strong> {selectedCustomer.state || "-"}
                </s-text>

                <s-text>
                  <strong>Tags:</strong>{" "}
                  {selectedCustomer.tags?.length
                    ? selectedCustomer.tags.join(", ")
                    : "-"}
                </s-text>

                <s-text>
                  <strong>Note:</strong> {selectedCustomer.note || "-"}
                </s-text>

                <s-stack direction="inline" gap="base">
                  <s-button onClick={() => startEditCustomer(selectedCustomer)}>
                    Edit
                  </s-button>

                  <s-button
                    tone="critical"
                    onClick={() =>
                      handleDeleteCustomer(selectedCustomer.shopifyId)
                    }
                  >
                    Delete
                  </s-button>

                  <s-button onClick={closeCustomerDetails}>Close</s-button>
                </s-stack>
              </>
            )}
          </s-stack>
        </s-section>
      )}

      {/* ====================================================
          CUSTOMER LIST
      ===================================================== */}

      <s-section heading="Customer list">
        <s-button onClick={loadCustomers} disabled={loading}>
          {loading ? "Syncing..." : "Sync customers"}
        </s-button>

        <div
          style={{
            marginTop: "16px",
            overflowX: "auto",
          }}
        >
          {customers.length === 0 ? (
            <s-text>No customers found.</s-text>
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
                    Name
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Email
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Phone
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px",
                    }}
                  >
                    Tags
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
                {customers.map((customer) => (
                  <tr key={customer.shopifyId}>
                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {customer.displayName ||
                        `${customer.firstName || ""} ${
                          customer.lastName || ""
                        }`.trim() ||
                        "-"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {customer.email || "-"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {customer.phone || "-"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      {customer.tags?.length ? customer.tags.join(", ") : "-"}
                    </td>

                    <td
                      style={{
                        padding: "10px",
                      }}
                    >
                      <s-stack direction="inline" gap="small">
                        <s-button
                          onClick={() => handleViewCustomer(customer.shopifyId)}
                        >
                          View
                        </s-button>

                        <s-button onClick={() => startEditCustomer(customer)}>
                          Edit
                        </s-button>

                        <s-button
                          tone="critical"
                          onClick={() =>
                            handleDeleteCustomer(customer.shopifyId)
                          }
                        >
                          Delete
                        </s-button>
                      </s-stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </s-section>
    </s-page>
  );
}
