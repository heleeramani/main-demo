import { useEffect, useMemo, useState } from "react";

export default function Metaobjects() {
  // ============================================================
  // PRODUCTS
  // ============================================================

  const [products, setProducts] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(false);

  // ============================================================
  // DEFINITIONS
  // ============================================================

  const [definitions, setDefinitions] = useState([]);

  const [selectedDefinitionId, setSelectedDefinitionId] = useState("");

  const [loadingDefinitions, setLoadingDefinitions] = useState(false);

  // ============================================================
  // PRODUCT METAOBJECTS
  // ============================================================

  const [metaobjects, setMetaobjects] = useState([]);

  const [loadingMetaobjects, setLoadingMetaobjects] = useState(false);

  // ============================================================
  // FORM
  // ============================================================

  const [metaobjectValues, setMetaobjectValues] = useState({});

  const [editingMetaobject, setEditingMetaobject] = useState(null);

  // ============================================================
  // LOADING STATES
  // ============================================================

  const [creating, setCreating] = useState(false);

  const [updating, setUpdating] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // MESSAGES
  // ============================================================

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // ============================================================
  // SELECTED PRODUCT
  // ============================================================

  const selectedProduct = useMemo(() => {
    return products.find(
      (product) => (product.shopifyId || product.id) === selectedProductId,
    );
  }, [products, selectedProductId]);

  // ============================================================
  // SELECTED DEFINITION
  // ============================================================

  const selectedDefinition = useMemo(() => {
    return definitions.find(
      (definition) =>
        (definition.shopifyId || definition.id) === selectedDefinitionId,
    );
  }, [definitions, selectedDefinitionId]);

  // ============================================================
  // CLEAR MESSAGES
  // ============================================================

  function clearMessages() {
    setMessage("");
    setError("");
  }

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setError("");

      const response = await fetch("/api/products");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load products");
      }

      setProducts(data.data || []);
    } catch (error) {
      console.error("Load products error:", error);

      setError(error.message);
    } finally {
      setLoadingProducts(false);
    }
  }

  // ============================================================
  // LOAD DEFINITIONS
  // ============================================================

  async function loadDefinitions() {
    try {
      setLoadingDefinitions(true);
      setError("");

      const response = await fetch("/api/metaobjects?definitions=true");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load definitions");
      }

      setDefinitions(data.data || []);
    } catch (error) {
      console.error("Load definitions error:", error);

      setError(error.message);
    } finally {
      setLoadingDefinitions(false);
    }
  }

  // ============================================================
  // LOAD PRODUCT METAOBJECTS
  // ============================================================

  async function loadProductMetaobjects(productId) {
    if (!productId) {
      setMetaobjects([]);
      return;
    }

    try {
      setLoadingMetaobjects(true);
      setError("");

      const response = await fetch(
        `/api/metaobjects?productId=${encodeURIComponent(productId)}`,
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load product metaobjects");
      }

      setMetaobjects(data.data || []);
    } catch (error) {
      console.error("Load product metaobjects error:", error);

      setError(error.message);
    } finally {
      setLoadingMetaobjects(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadProducts();
    loadDefinitions();
  }, []);

  // ============================================================
  // PRODUCT CHANGE
  // ============================================================

  useEffect(() => {
    setEditingMetaobject(null);
    setMetaobjectValues({});

    if (selectedProductId) {
      loadProductMetaobjects(selectedProductId);
    } else {
      setMetaobjects([]);
    }
  }, [selectedProductId]);

  // ============================================================
  // DEFINITION CHANGE
  // ============================================================

  useEffect(() => {
    setEditingMetaobject(null);

    if (!selectedDefinition) {
      setMetaobjectValues({});
      return;
    }

    const values = {};

    (selectedDefinition.fieldDefinitions || []).forEach((field) => {
      values[field.key] = "";
    });

    setMetaobjectValues(values);
  }, [selectedDefinitionId]);

  // ============================================================
  // GET FIELD VALUE
  // ============================================================

  function getFieldValue(metaobject, key) {
    const values = metaobject?.values;

    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return "";
    }

    const value = values[key];

    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }

    return JSON.stringify(value);
  }

  // ============================================================
  // FIELD CHANGE
  // ============================================================

  function handleFieldChange(key, value) {
    setMetaobjectValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  // ============================================================
  // EDIT METAOBJECT
  // ============================================================

  function handleEdit(metaobject) {
    clearMessages();

    setEditingMetaobject(metaobject);

    const values = {};

    (selectedDefinition?.fieldDefinitions || []).forEach((field) => {
      values[field.key] = getFieldValue(metaobject, field.key);
    });

    setMetaobjectValues(values);
  }

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  function cancelEdit() {
    setEditingMetaobject(null);

    const values = {};

    (selectedDefinition?.fieldDefinitions || []).forEach((field) => {
      values[field.key] = "";
    });

    setMetaobjectValues(values);
  }

  // ============================================================
  // CREATE METAOBJECT
  // ============================================================

  async function handleCreate() {
    try {
      clearMessages();

      if (!selectedProductId) {
        throw new Error("Please select a product");
      }

      if (!selectedDefinitionId) {
        throw new Error("Please select a metaobject definition");
      }

      const values = {};

      (selectedDefinition?.fieldDefinitions || []).forEach((field) => {
        values[field.key] = metaobjectValues[field.key] || "";
      });

      setCreating(true);

      const response = await fetch("/api/metaobjects", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "create-product-metaobject",

          productId: selectedProductId,

          productTitle: selectedProduct?.title || "",

          definitionId: selectedDefinitionId,

          metaobject: {
            values,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create metaobject");
      }

      setMessage("Metaobject created and linked to product successfully");

      cancelEdit();

      await loadProductMetaobjects(selectedProductId);
    } catch (error) {
      console.error("Create metaobject error:", error);

      setError(error.message);
    } finally {
      setCreating(false);
    }
  }

  // ============================================================
  // UPDATE METAOBJECT
  // ============================================================

  async function handleUpdate() {
    try {
      clearMessages();

      if (!editingMetaobject?.id) {
        throw new Error("Metaobject ID is required");
      }

      const values = {};

      (selectedDefinition?.fieldDefinitions || []).forEach((field) => {
        values[field.key] = metaobjectValues[field.key] || "";
      });

      setUpdating(true);

      const response = await fetch("/api/metaobjects", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "update-product-metaobject",

          productId: selectedProductId,

          metaobjectId: editingMetaobject.id,

          metaobject: {
            values,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update metaobject");
      }

      setMessage("Metaobject updated successfully");

      cancelEdit();

      await loadProductMetaobjects(selectedProductId);
    } catch (error) {
      console.error("Update metaobject error:", error);

      setError(error.message);
    } finally {
      setUpdating(false);
    }
  }

  // ============================================================
  // DELETE METAOBJECT
  // ============================================================

  async function handleDelete(metaobject) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this metaobject?",
    );

    if (!confirmed) {
      return;
    }

    try {
      clearMessages();

      setDeleting(true);

      const response = await fetch("/api/metaobjects", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "delete-product-metaobject",

          productId: selectedProductId,

          metaobjectId: metaobject.id,

          namespace: metaobject.referenceNamespace,

          key: metaobject.referenceKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete metaobject");
      }

      setMessage("Metaobject deleted successfully");

      await loadProductMetaobjects(selectedProductId);
    } catch (error) {
      console.error("Delete metaobject error:", error);

      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <s-page heading="Metaobjects">
      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {message && <s-banner tone="success">{message}</s-banner>}

      {error && <s-banner tone="critical">{error}</s-banner>}

      {/* ======================================================
          PRODUCT
      ====================================================== */}

      <s-section heading="Product">
        <s-select
          label="Select Product"
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.currentTarget.value)}
        >
          <s-option value="">Select Product</s-option>

          {products.map((product) => {
            const productId = product.shopifyId || product.id;

            return (
              <s-option key={productId} value={productId}>
                {product.title}
              </s-option>
            );
          })}
        </s-select>

        {loadingProducts && <s-text>Loading products...</s-text>}
      </s-section>

      {/* ======================================================
          DEFINITION
      ====================================================== */}

      {selectedProductId && (
        <s-section heading="Metaobject Definition">
          <s-select
            label="Select Metaobject Definition"
            value={selectedDefinitionId}
            onChange={(event) =>
              setSelectedDefinitionId(event.currentTarget.value)
            }
          >
            <s-option value="">Select Definition</s-option>

            {definitions.map((definition) => {
              const definitionId = definition.shopifyId || definition.id;

              return (
                <s-option key={definitionId} value={definitionId}>
                  {definition.name} ({definition.type})
                </s-option>
              );
            })}
          </s-select>

          {loadingDefinitions && <s-text>Loading definitions...</s-text>}
        </s-section>
      )}

      {/* ======================================================
          CREATE / UPDATE
      ====================================================== */}

      {selectedProductId && selectedDefinition && (
        <s-section
          heading={
            editingMetaobject
              ? "Edit Product Metaobject"
              : "Create Product Metaobject"
          }
        >
          <s-box padding="base" border="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-text>Product: {selectedProduct?.title}</s-text>

              <s-text>Definition: {selectedDefinition.name}</s-text>

              {(selectedDefinition.fieldDefinitions || []).map((field) => (
                <s-text-field
                  key={field.key}
                  label={`${field.name} (${field.key})`}
                  value={metaobjectValues[field.key] || ""}
                  onInput={(event) =>
                    handleFieldChange(field.key, event.currentTarget.value)
                  }
                />
              ))}

              <s-stack direction="inline" gap="base">
                {!editingMetaobject && (
                  <s-button
                    variant="primary"
                    loading={creating}
                    onClick={handleCreate}
                  >
                    Create Metaobject
                  </s-button>
                )}

                {editingMetaobject && (
                  <>
                    <s-button
                      variant="primary"
                      loading={updating}
                      onClick={handleUpdate}
                    >
                      Update
                    </s-button>

                    <s-button onClick={cancelEdit}>Cancel</s-button>
                  </>
                )}
              </s-stack>
            </s-stack>
          </s-box>
        </s-section>
      )}

      {/* ======================================================
          PRODUCT METAOBJECTS
      ====================================================== */}

      {selectedProductId && (
        <s-section heading={`Product Metaobjects (${metaobjects.length})`}>
          {loadingMetaobjects ? (
            <s-text>Loading product metaobjects...</s-text>
          ) : metaobjects.length === 0 ? (
            <s-text>No metaobjects linked to this product.</s-text>
          ) : (
            <s-stack direction="block" gap="base">
              {metaobjects.map((metaobject) => (
                <s-box
                  key={metaobject.id}
                  padding="base"
                  border="base"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="base">
                    <s-heading>
                      {metaobject.displayName ||
                        metaobject.handle ||
                        metaobject.type}
                    </s-heading>

                    <s-text>Type: {metaobject.type}</s-text>

                    <s-text>Handle: {metaobject.handle || "-"}</s-text>

                    <s-table>
                      <s-table-header-row>
                        <s-table-header>Field</s-table-header>

                        <s-table-header>Value</s-table-header>
                      </s-table-header-row>

                      <s-table-body>
                        {Object.entries(metaobject.values || {}).map(
                          ([key, value]) => (
                            <s-table-row key={key}>
                              <s-table-cell>{key}</s-table-cell>

                              <s-table-cell>
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value)}
                              </s-table-cell>
                            </s-table-row>
                          ),
                        )}
                      </s-table-body>
                    </s-table>

                    <s-stack direction="inline" gap="base">
                      <s-button onClick={() => handleEdit(metaobject)}>
                        Edit
                      </s-button>

                      <s-button
                        tone="critical"
                        loading={deleting}
                        onClick={() => handleDelete(metaobject)}
                      >
                        Delete
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}
            </s-stack>
          )}
        </s-section>
      )}
    </s-page>
  );
}
