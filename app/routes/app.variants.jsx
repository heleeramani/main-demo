import { useEffect, useState } from "react";

export default function Variants() {
  const [products, setProducts] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState("");

  const [product, setProduct] = useState(null);

  const [variants, setVariants] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [loadingVariants, setLoadingVariants] = useState(false);

  const [creating, setCreating] = useState(false);

  const [updating, setUpdating] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    price: "",
    compareAtPrice: "",
    sku: "",
    barcode: "",
    optionValues: {},
  });

  const [editingVariant, setEditingVariant] = useState(null);

  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

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

  // ==========================================================
  // LOAD VARIANTS
  // ==========================================================

  async function loadVariants(productId) {
    if (!productId) {
      return;
    }

    try {
      setLoadingVariants(true);

      setError("");

      setMessage("");

      const response = await fetch(
        `/api/variants?productId=${encodeURIComponent(productId)}`,
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to load variants (${response.status})`);
      }

      setProduct(data.product);

      setVariants(data.data || []);

      setEditingVariant(null);
    } catch (error) {
      console.error("Load variants error:", error);

      setError(error.message);
    } finally {
      setLoadingVariants(false);
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadProducts();
  }, []);

  // ==========================================================
  // PRODUCT CHANGE
  // ==========================================================

  function handleProductChange(event) {
    const productId = event.target.value;

    setSelectedProduct(productId);

    setProduct(null);

    setVariants([]);

    setError("");

    setMessage("");

    if (productId) {
      loadVariants(productId);
    }
  }

  // ==========================================================
  // OPTION CHANGE
  // ==========================================================

  function handleOptionChange(optionName, value) {
    setForm({
      ...form,

      optionValues: {
        ...form.optionValues,

        [optionName]: value,
      },
    });
  }

  // ==========================================================
  // CREATE VARIANT
  // ==========================================================

  async function handleCreateVariant(event) {
    event.preventDefault();

    try {
      setCreating(true);

      setError("");

      setMessage("");

      if (!selectedProduct) {
        throw new Error("Please select a product");
      }

      if (!form.price) {
        throw new Error("Price is required");
      }

      const optionValues = Object.entries(form.optionValues).map(
        ([optionName, value]) => ({
          optionName,
          name: value,
        }),
      );

      if (
        product?.options?.length &&
        optionValues.length !== product.options.length
      ) {
        throw new Error("Please select all product options");
      }

      const response = await fetch("/api/variants", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId: selectedProduct,

          variants: [
            {
              price: form.price,

              compareAtPrice: form.compareAtPrice || null,

              sku: form.sku || null,

              barcode: form.barcode || null,

              optionValues,
            },
          ],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to create variant (${response.status})`);
      }

      setMessage("Variant created successfully");

      setForm({
        price: "",
        compareAtPrice: "",
        sku: "",
        barcode: "",
        optionValues: {},
      });

      await loadVariants(selectedProduct);
    } catch (error) {
      console.error("Create variant error:", error);

      setError(error.message);
    } finally {
      setCreating(false);
    }
  }

  // ==========================================================
  // EDIT VARIANT
  // ==========================================================

  function handleEditVariant(variant) {
    const optionValues = {};

    variant.selectedOptions?.forEach((option) => {
      optionValues[option.name] = option.value;
    });

    setEditingVariant({
      id: variant.shopifyId,

      price: variant.price || "",

      compareAtPrice: variant.compareAtPrice || "",

      sku: variant.sku || "",

      barcode: variant.barcode || "",

      optionValues,
    });

    setError("");

    setMessage("");
  }

  // ==========================================================
  // UPDATE VARIANT
  // ==========================================================

  async function handleUpdateVariant(event) {
    event.preventDefault();

    try {
      setUpdating(true);

      setError("");

      setMessage("");

      const response = await fetch("/api/variants", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId: selectedProduct,

          variants: [
            {
              id: editingVariant.id,

              price: editingVariant.price,

              compareAtPrice: editingVariant.compareAtPrice || null,

              sku: editingVariant.sku || null,

              barcode: editingVariant.barcode || null,
            },
          ],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to update variant (${response.status})`);
      }

      setMessage("Variant updated successfully");

      setEditingVariant(null);

      await loadVariants(selectedProduct);
    } catch (error) {
      console.error("Update variant error:", error);

      setError(error.message);
    } finally {
      setUpdating(false);
    }
  }

  // ==========================================================
  // DELETE VARIANT
  // ==========================================================

  async function handleDeleteVariant(variantId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this variant?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      setError("");

      setMessage("");

      const response = await fetch("/api/variants", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId: selectedProduct,

          variantsIds: [variantId],
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to delete variant (${response.status})`);
      }

      setMessage("Variant deleted successfully");

      await loadVariants(selectedProduct);
    } catch (error) {
      console.error("Delete variant error:", error);

      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ==========================================================
  // CANCEL EDIT
  // ==========================================================

  function handleCancelEdit() {
    setEditingVariant(null);

    setError("");

    setMessage("");
  }

  return (
    <s-page heading="Product Variants">
      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {message && <s-banner tone="success">{message}</s-banner>}

      {error && <s-banner tone="critical">{error}</s-banner>}

      {/* ======================================================
          PRODUCT SELECTOR
      ====================================================== */}

      <s-section heading="Select Product">
        <s-select
          label="Product"
          value={selectedProduct}
          onChange={handleProductChange}
        >
          <s-option value="">Select a product</s-option>

          {products.map((item) => (
            <s-option key={item.shopifyId} value={item.shopifyId}>
              {item.title}
            </s-option>
          ))}
        </s-select>
      </s-section>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loadingProducts && (
        <s-section>
          <s-text>Loading products...</s-text>
        </s-section>
      )}

      {loadingVariants && (
        <s-section>
          <s-text>Loading variants...</s-text>
        </s-section>
      )}

      {/* ======================================================
          PRODUCT INFORMATION
      ====================================================== */}

      {product && (
        <s-section heading={`Variants - ${product.title}`}>
          <s-stack direction="block" gap="base">
            <s-text>Product ID: {product.id}</s-text>

            <s-text>Variants: {variants.length}</s-text>
          </s-stack>
        </s-section>
      )}

      {/* ======================================================
          CREATE VARIANT
      ====================================================== */}

      {product && (
        <s-section heading="Create Variant">
          <form onSubmit={handleCreateVariant}>
            <s-stack direction="block" gap="base">
              {/* PRODUCT OPTIONS */}

              {product.options?.map((option) => (
                <s-stack key={option.id} direction="block" gap="small">
                  <s-text-field
                    label={`${option.name} (Option Value)`}
                    placeholder={`Enter ${option.name} name (e.g., Variant 2, Large, Red)`}
                    value={form.optionValues[option.name] || ""}
                    onChange={(event) =>
                      handleOptionChange(option.name, event.target.value)
                    }
                  />

                  {option.values?.length > 0 && (
                    <s-select
                      label={`Or select existing ${option.name}`}
                      value={form.optionValues[option.name] || ""}
                      onChange={(event) =>
                        handleOptionChange(option.name, event.target.value)
                      }
                    >
                      <s-option value="">Choose existing {option.name}</s-option>

                      {option.values.map((value) => (
                        <s-option key={value} value={value}>
                          {value}
                        </s-option>
                      ))}
                    </s-select>
                  )}
                </s-stack>
              ))}

              <s-text-field
                label="Price"
                value={form.price}
                onChange={(event) =>
                  setForm({
                    ...form,
                    price: event.target.value,
                  })
                }
              />

              <s-text-field
                label="Compare At Price"
                value={form.compareAtPrice}
                onChange={(event) =>
                  setForm({
                    ...form,
                    compareAtPrice: event.target.value,
                  })
                }
              />

              <s-text-field
                label="SKU"
                value={form.sku}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sku: event.target.value,
                  })
                }
              />

              <s-text-field
                label="Barcode"
                value={form.barcode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    barcode: event.target.value,
                  })
                }
              />

              <s-button
                type="submit"
                {...(creating
                  ? {
                    loading: true,
                  }
                  : {})}
              >
                Create Variant
              </s-button>
            </s-stack>
          </form>
        </s-section>
      )}

      {/* ======================================================
          VARIANT LIST
      ====================================================== */}

      {product && (
        <s-section heading={`Variants (${variants.length})`}>
          {variants.length === 0 ? (
            <s-text>No variants found.</s-text>
          ) : (
            <s-stack direction="block" gap="base">
              {variants.map((variant) => (
                <s-box
                  key={variant.shopifyId}
                  padding="base"
                  border="base"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="small">
                    <s-heading>{variant.title}</s-heading>

                    <s-text>Price: {variant.price}</s-text>

                    <s-text>SKU: {variant.sku || "N/A"}</s-text>

                    <s-text>Barcode: {variant.barcode || "N/A"}</s-text>

                    <s-text>Inventory: {variant.inventoryQuantity}</s-text>

                    {variant.selectedOptions?.map((option) => (
                      <s-text key={option.name}>
                        {option.name}: {option.value}
                      </s-text>
                    ))}

                    <s-stack direction="inline" gap="base">
                      <s-button onClick={() => handleEditVariant(variant)}>
                        Edit
                      </s-button>

                      <s-button
                        onClick={() => handleDeleteVariant(variant.shopifyId)}
                        {...(deleting
                          ? {
                            loading: true,
                          }
                          : {})}
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

      {/* ======================================================
          EDIT VARIANT
      ====================================================== */}

      {editingVariant && (
        <s-section heading="Edit Variant">
          <form onSubmit={handleUpdateVariant}>
            <s-stack direction="block" gap="base">
              {product?.options?.map((option) => (
                <s-select
                  key={option.id}
                  label={option.name}
                  value={editingVariant.optionValues[option.name] || ""}
                  onChange={(event) =>
                    setEditingVariant({
                      ...editingVariant,

                      optionValues: {
                        ...editingVariant.optionValues,

                        [option.name]: event.target.value,
                      },
                    })
                  }
                >
                  {option.values.map((value) => (
                    <s-option key={value} value={value}>
                      {value}
                    </s-option>
                  ))}
                </s-select>
              ))}

              <s-text-field
                label="Price"
                value={editingVariant.price}
                onChange={(event) =>
                  setEditingVariant({
                    ...editingVariant,
                    price: event.target.value,
                  })
                }
              />

              <s-text-field
                label="Compare At Price"
                value={editingVariant.compareAtPrice}
                onChange={(event) =>
                  setEditingVariant({
                    ...editingVariant,
                    compareAtPrice: event.target.value,
                  })
                }
              />

              <s-text-field
                label="SKU"
                value={editingVariant.sku}
                onChange={(event) =>
                  setEditingVariant({
                    ...editingVariant,
                    sku: event.target.value,
                  })
                }
              />

              <s-text-field
                label="Barcode"
                value={editingVariant.barcode}
                onChange={(event) =>
                  setEditingVariant({
                    ...editingVariant,
                    barcode: event.target.value,
                  })
                }
              />

              <s-stack direction="inline" gap="base">
                <s-button
                  type="submit"
                  {...(updating
                    ? {
                      loading: true,
                    }
                    : {})}
                >
                  Update Variant
                </s-button>

                <s-button type="button" onClick={handleCancelEdit}>
                  Cancel
                </s-button>
              </s-stack>
            </s-stack>
          </form>
        </s-section>
      )}
    </s-page>
  );
}