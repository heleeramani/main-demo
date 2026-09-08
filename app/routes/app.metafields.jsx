import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";
import { connectDB } from "../db.server";
import Product from "../models/Product";

// ============================================================
// LOADER
// ============================================================

export async function loader({ request }) {
  await authenticate.admin(request);

  await connectDB();

  const products = await Product.find({})
    .sort({ title: 1 })
    .lean();

  return {
    products: products.map((product) => ({
      id: product._id.toString(),
      shopifyId: product.shopifyId,
      title: product.title,
    })),
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function Metafields() {
  const { products: initialProducts = [] } =
    useLoaderData();

  const [products] = useState(initialProducts);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [metafields, setMetafields] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [selectedMetafield, setSelectedMetafield] =
    useState(null);

  const [form, setForm] = useState({
    namespace: "custom",
    key: "",
    type: "single_line_text_field",
    value: "",
  });

  // ==========================================================
  // LOAD METAFIELDS
  // ==========================================================

  async function loadMetafields(productId) {
    if (!productId) {
      setMetafields([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/metafields?ownerId=${encodeURIComponent(
          productId,
        )}&ownerType=PRODUCT`,
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          text || "Invalid server response",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load metafields",
        );
      }

      setMetafields(
        Array.isArray(data.metafields)
          ? data.metafields
          : [],
      );
    } catch (error) {
      console.error(
        "Load metafields error:",
        error,
      );

      setError(
        error?.message ||
          "Failed to load metafields",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PRODUCT CHANGE
  // ==========================================================

  function handleProductChange(productId) {
    setSelectedProduct(productId);

    setMetafields([]);

    setSelectedMetafield(null);

    setEditing(false);

    setError("");

    setSuccess("");

    if (productId) {
      loadMetafields(productId);
    }
  }

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

      if (!selectedProduct) {
        throw new Error(
          "Please select a product",
        );
      }

      if (!form.namespace.trim()) {
        throw new Error(
          "Namespace is required",
        );
      }

      if (!form.key.trim()) {
        throw new Error(
          "Key is required",
        );
      }

      if (!form.value.trim()) {
        throw new Error(
          "Value is required",
        );
      }

      const response = await fetch(
        "/api/metafields",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "create",
            metafield: {
              ownerId: selectedProduct,
              ownerType: "PRODUCT",
              namespace:
                form.namespace.trim(),
              key: form.key.trim(),
              type: form.type,
              value: form.value,
            },
          }),
        },
      );

      const contentType =
        response.headers.get("content-type") ||
        "";

      let data;

      if (
        contentType.includes(
          "application/json",
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text || "Invalid server response",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create metafield",
        );
      }

      setForm({
        namespace: "custom",
        key: "",
        type: "single_line_text_field",
        value: "",
      });

      setSuccess(
        "Metafield created successfully",
      );

      await loadMetafields(
        selectedProduct,
      );
    } catch (error) {
      console.error(
        "Create metafield error:",
        error,
      );

      setError(
        error?.message ||
          "Failed to create metafield",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // EDIT
  // ==========================================================

  function handleEdit(metafield) {
    setSelectedMetafield(metafield);

    setEditing(true);

    setForm({
      namespace:
        metafield.namespace || "custom",

      key: metafield.key || "",

      type:
        metafield.type ||
        "single_line_text_field",

      value: metafield.value || "",
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

      if (!selectedMetafield) {
        throw new Error(
          "Metafield is not selected",
        );
      }

      if (!form.value.trim()) {
        throw new Error(
          "Value is required",
        );
      }

      const response = await fetch(
        "/api/metafields",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ownerId: selectedProduct,
            ownerType: "PRODUCT",
            namespace:
              selectedMetafield.namespace,
            key: selectedMetafield.key,
            type: selectedMetafield.type,
            value: form.value,
          }),
        },
      );

      const contentType =
        response.headers.get("content-type") ||
        "";

      let data;

      if (
        contentType.includes(
          "application/json",
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text || "Invalid server response",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update metafield",
        );
      }

      setEditing(false);

      setSelectedMetafield(null);

      setForm({
        namespace: "custom",
        key: "",
        type: "single_line_text_field",
        value: "",
      });

      setSuccess(
        "Metafield updated successfully",
      );

      await loadMetafields(
        selectedProduct,
      );
    } catch (error) {
      console.error(
        "Update metafield error:",
        error,
      );

      setError(
        error?.message ||
          "Failed to update metafield",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async function handleDelete(metafield) {
    const confirmed = window.confirm(
      `Delete metafield "${metafield.namespace}.${metafield.key}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/metafields",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ownerId: selectedProduct,
            namespace:
              metafield.namespace,
            key: metafield.key,
          }),
        },
      );

      const contentType =
        response.headers.get("content-type") ||
        "";

      let data;

      if (
        contentType.includes(
          "application/json",
        )
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text || "Invalid server response",
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete metafield",
        );
      }

      setSuccess(
        "Metafield deleted successfully",
      );

      await loadMetafields(
        selectedProduct,
      );
    } catch (error) {
      console.error(
        "Delete metafield error:",
        error,
      );

      setError(
        error?.message ||
          "Failed to delete metafield",
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  function handleCancel() {
    setEditing(false);

    setSelectedMetafield(null);

    setForm({
      namespace: "custom",
      key: "",
      type: "single_line_text_field",
      value: "",
    });

    setError("");
    setSuccess("");
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <s-page heading="Metafields">

      {/* ====================================================
          PRODUCT SELECT
      ==================================================== */}

      <s-section heading="Select Product">

        <s-select
          label="Product"
          value={selectedProduct}
          placeholder="Select a product"
          onChange={(event) =>
            handleProductChange(
              event.currentTarget.value,
            )
          }
        >
          <s-option value="">
            Select a product
          </s-option>

          {products.map((product) => {
            const productId =
              product.shopifyId ||
              product.id;

            return (
              <s-option
                key={productId}
                value={productId}
              >
                {product.title}
              </s-option>
            );
          })}
        </s-select>

        {products.length === 0 && (
          <s-text>
            No products found in MongoDB.
          </s-text>
        )}

      </s-section>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <s-banner
          tone="critical"
          heading="Error"
        >
          {error}
        </s-banner>
      )}

      {/* ====================================================
          SUCCESS
      ==================================================== */}

      {success && !error && (
        <s-banner
          tone="success"
          heading="Success"
        >
          {success}
        </s-banner>
      )}

      {/* ====================================================
          CREATE / UPDATE
      ==================================================== */}

      {selectedProduct && (
        <s-section
          heading={
            editing
              ? "Update Metafield"
              : "Create Metafield"
          }
        >

          <s-text-field
            label="Namespace"
            value={form.namespace}
            disabled={editing}
            onInput={(event) =>
              handleChange(
                "namespace",
                event.currentTarget.value,
              )
            }
          />

          <s-text-field
            label="Key"
            value={form.key}
            disabled={editing}
            onInput={(event) =>
              handleChange(
                "key",
                event.currentTarget.value,
              )
            }
          />

          <s-select
            label="Type"
            value={form.type}
            disabled={editing}
            onChange={(event) =>
              handleChange(
                "type",
                event.currentTarget.value,
              )
            }
          >
            <s-option value="single_line_text_field">
              Single line text
            </s-option>

            <s-option value="multi_line_text_field">
              Multi line text
            </s-option>

            <s-option value="integer">
              Integer
            </s-option>

            <s-option value="number_integer">
              Number integer
            </s-option>

            <s-option value="number_decimal">
              Number decimal
            </s-option>

            <s-option value="boolean">
              Boolean
            </s-option>

            <s-option value="date">
              Date
            </s-option>

            <s-option value="date_time">
              Date time
            </s-option>

            <s-option value="url">
              URL
            </s-option>

            <s-option value="json">
              JSON
            </s-option>
          </s-select>

          <s-text-field
            label="Value"
            value={form.value}
            onInput={(event) =>
              handleChange(
                "value",
                event.currentTarget.value,
              )
            }
          />

          <s-stack
            direction="inline"
            gap="base"
          >
            {editing ? (
              <>
                <s-button
                  variant="primary"
                  loading={saving}
                  onClick={handleUpdate}
                >
                  Update Metafield
                </s-button>

                <s-button
                  onClick={handleCancel}
                >
                  Cancel
                </s-button>
              </>
            ) : (
              <s-button
                variant="primary"
                loading={saving}
                onClick={handleCreate}
              >
                Create Metafield
              </s-button>
            )}
          </s-stack>

        </s-section>
      )}

      {/* ====================================================
          METAFIELD LIST
      ==================================================== */}

      {selectedProduct && (
        <s-section heading="Product Metafields">

          {loading ? (
            <s-spinner />

          ) : metafields.length === 0 ? (
            <s-text>
              No metafields found for this
              product.
            </s-text>

          ) : (
            <s-table>

              <s-table-header-row>

                <s-table-header>
                  Namespace
                </s-table-header>

                <s-table-header>
                  Key
                </s-table-header>

                <s-table-header>
                  Type
                </s-table-header>

                <s-table-header>
                  Value
                </s-table-header>

                <s-table-header>
                  Actions
                </s-table-header>

              </s-table-header-row>

              <s-table-body>

                {metafields.map(
                  (metafield) => (
                    <s-table-row
                      key={
                        metafield.shopifyId ||
                        metafield.id
                      }
                    >

                      <s-table-cell>
                        {
                          metafield.namespace
                        }
                      </s-table-cell>

                      <s-table-cell>
                        {metafield.key}
                      </s-table-cell>

                      <s-table-cell>
                        {metafield.type}
                      </s-table-cell>

                      <s-table-cell>
                        {metafield.value}
                      </s-table-cell>

                      <s-table-cell>

                        <s-stack
                          direction="inline"
                          gap="small"
                        >

                          <s-button
                            onClick={() =>
                              handleEdit(
                                metafield,
                              )
                            }
                          >
                            Edit
                          </s-button>

                          <s-button
                            tone="critical"
                            loading={saving}
                            onClick={() =>
                              handleDelete(
                                metafield,
                              )
                            }
                          >
                            Delete
                          </s-button>

                        </s-stack>

                      </s-table-cell>

                    </s-table-row>
                  ),
                )}

              </s-table-body>

            </s-table>
          )}

        </s-section>
      )}

    </s-page>
  );
}