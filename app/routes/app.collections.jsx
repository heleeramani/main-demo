import { useEffect, useState } from "react";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingProducts, setAddingProducts] = useState(false);
  const [removingProducts, setRemovingProducts] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [collectionType, setCollectionType] = useState("CUSTOM");

  const [form, setForm] = useState({
    title: "",
    description: "",
    handle: "",
  });

  const [selectedProducts, setSelectedProducts] = useState([]);

  const [automatedCondition, setAutomatedCondition] = useState({
    type: "productTag",
    relation: "TAGGED_WITH",
    value: "",
    conditionMatchType: "ANY",
  });

  const [automatedMatchType, setAutomatedMatchType] = useState("ALL");

  const [editingCollection, setEditingCollection] = useState(null);

  const [selectedCollection, setSelectedCollection] = useState(null);

  const [productsToAdd, setProductsToAdd] = useState([]);

  const [productsToRemove, setProductsToRemove] = useState([]);

  // ============================================================
  // SYNC COLLECTIONS
  // ============================================================

  async function syncCollections(showMessage = true) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/collections");

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to sync collections (${response.status})`);
      }

      setCollections(data.data || []);

      if (showMessage) {
        setMessage(`${data.count || 0} collections synced successfully`);
      }
    } catch (error) {
      console.error("Sync collections error:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  async function loadProducts() {
    try {
      setLoadingProducts(true);

      const response = await fetch("/api/products");

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to load products (${response.status})`);
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
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    syncCollections(false);
    loadProducts();
  }, []);

  // ============================================================
  // CREATE COLLECTION
  // ============================================================

  async function handleCreateCollection(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) {
        throw new Error("Collection title is required");
      }

      // ========================================================
      // CUSTOM COLLECTION
      // ========================================================

      if (collectionType === "CUSTOM") {
        const response = await fetch("/api/collections", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            action: "create",

            collectionType: "CUSTOM",

            title: form.title,

            descriptionHtml: form.description,

            handle: form.handle,

            productIds: selectedProducts,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || `Failed to create custom collection (${response.status})`);
        }

        setMessage("Custom collection created successfully");
      }

      // ========================================================
      // AUTOMATED COLLECTION
      // ========================================================

      if (collectionType === "AUTOMATED") {
        if (!automatedCondition.value.trim()) {
          throw new Error("Condition value is required");
        }

        const response = await fetch("/api/collections", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            action: "create",

            collectionType: "AUTOMATED",

            title: form.title,

            descriptionHtml: form.description,

            handle: form.handle,

            matchType: automatedMatchType,

            conditions: [
              {
                type: automatedCondition.type,

                relation: automatedCondition.relation,

                values: [automatedCondition.value],

                conditionMatchType: automatedCondition.conditionMatchType,
              },
            ],
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message || `Failed to create automated collection (${response.status})`,
          );
        }

        setMessage("Automated collection created successfully");
      }

      // ========================================================
      // RESET
      // ========================================================

      setForm({
        title: "",
        description: "",
        handle: "",
      });

      setSelectedProducts([]);

      setAutomatedCondition({
        type: "productTag",
        relation: "TAGGED_WITH",
        value: "",
        conditionMatchType: "ANY",
      });

      await syncCollections(false);
    } catch (error) {
      console.error("Create collection error:", error);

      setError(error.message);
    } finally {
      setCreating(false);
    }
  }

  // ============================================================
  // PRODUCT SELECTION
  // ============================================================

  function toggleProductSelection(productId) {
    setSelectedProducts((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }

      return [...current, productId];
    });
  }

  // ============================================================
  // EDIT COLLECTION
  // ============================================================

  function handleEditCollection(collection) {
    setError("");
    setMessage("");

    setEditingCollection({
      id: collection.shopifyId,

      title: collection.title || "",

      description: collection.descriptionHtml || collection.description || "",

      handle: collection.handle || "",
    });

    setTimeout(() => {
      document.getElementById("edit-collection-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  // ============================================================
  // UPDATE COLLECTION
  // ============================================================

  async function handleUpdateCollection(event) {
    event.preventDefault();

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      if (!editingCollection.title.trim()) {
        throw new Error("Collection title is required");
      }

      const response = await fetch("/api/collections", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: editingCollection.id,

          title: editingCollection.title,

          descriptionHtml: editingCollection.description,

          handle: editingCollection.handle,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to update collection (${response.status})`);
      }

      setMessage("Collection updated successfully");

      setEditingCollection(null);

      await syncCollections(false);
    } catch (error) {
      console.error("Update collection error:", error);

      setError(error.message);
    } finally {
      setUpdating(false);
    }
  }

  // ============================================================
  // DELETE COLLECTION
  // ============================================================

  async function handleDeleteCollection(collectionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this collection?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/collections", {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: collectionId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to delete collection (${response.status})`);
      }

      setMessage("Collection deleted successfully");

      if (selectedCollection?.shopifyId === collectionId) {
        setSelectedCollection(null);
      }

      if (editingCollection?.id === collectionId) {
        setEditingCollection(null);
      }

      await syncCollections(false);
    } catch (error) {
      console.error("Delete collection error:", error);

      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ============================================================
  // OPEN PRODUCT MANAGEMENT
  // ============================================================

  function handleManageProducts(collection) {
    setError("");
    setMessage("");

    setSelectedCollection(collection);

    setProductsToAdd([]);
    setProductsToRemove([]);

    setTimeout(() => {
      document.getElementById("collection-products-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  // ============================================================
  // ADD PRODUCTS
  // ============================================================

  async function handleAddProducts() {
    if (!selectedCollection) {
      return;
    }

    if (selectedCollection.collectionType === "AUTOMATED") {
      setError("Products cannot be manually added to an automated collection.");

      return;
    }

    if (productsToAdd.length === 0) {
      setError("Select at least one product to add.");

      return;
    }

    try {
      setAddingProducts(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/collections", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "add-products",

          collectionId: selectedCollection.shopifyId,

          productIds: productsToAdd,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to add products (${response.status})`);
      }

      setMessage("Products added successfully");

      setProductsToAdd([]);

      await syncCollections(false);

      const updatedCollection = data.data;

      setSelectedCollection(updatedCollection);
    } catch (error) {
      console.error("Add products error:", error);

      setError(error.message);
    } finally {
      setAddingProducts(false);
    }
  }

  // ============================================================
  // REMOVE PRODUCTS
  // ============================================================

  async function handleRemoveProducts() {
    if (!selectedCollection) {
      return;
    }

    if (selectedCollection.collectionType === "AUTOMATED") {
      setError(
        "Products cannot be manually removed from an automated collection.",
      );

      return;
    }

    if (productsToRemove.length === 0) {
      setError("Select at least one product to remove.");

      return;
    }

    try {
      setRemovingProducts(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/collections", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "remove-products",

          collectionId: selectedCollection.shopifyId,

          productIds: productsToRemove,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `Failed to remove products (${response.status})`);
      }

      setMessage("Products removed successfully");

      setProductsToRemove([]);

      await syncCollections(false);

      setSelectedCollection(data.data);
    } catch (error) {
      console.error("Remove products error:", error);

      setError(error.message);
    } finally {
      setRemovingProducts(false);
    }
  }

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  function handleCancelEdit() {
    setEditingCollection(null);
    setError("");
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <s-page heading="Collections">
      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {message && <s-banner tone="success">{message}</s-banner>}

      {error && <s-banner tone="critical">{error}</s-banner>}

      {/* ======================================================
          COLLECTION MANAGEMENT
      ====================================================== */}

      <s-section heading="Collection Management">
        <s-button
          onClick={() => syncCollections(true)}
          {...(loading ? { loading: true } : {})}
        >
          Sync Collections
        </s-button>
      </s-section>

      {/* ======================================================
          CREATE COLLECTION
      ====================================================== */}

      <s-section heading="Create Collection">
        <s-stack direction="block" gap="base">
          {/* ==================================================
              COLLECTION TYPE
          ================================================== */}

          <s-text>Collection Type</s-text>

          <s-stack direction="inline" gap="base">
            <s-button
              {...(collectionType === "CUSTOM" ? { variant: "primary" } : {})}
              onClick={() => setCollectionType("CUSTOM")}
            >
              Custom
            </s-button>

            <s-button
              {...(collectionType === "AUTOMATED"
                ? {
                    variant: "primary",
                  }
                : {})}
              onClick={() => setCollectionType("AUTOMATED")}
            >
              Automated
            </s-button>
          </s-stack>

          {/* ==================================================
              BASIC FIELDS
          ================================================== */}

          <form onSubmit={handleCreateCollection}>
            <s-stack direction="block" gap="base">
              <s-text-field
                label="Title"
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,  

                    title: event.target.value,
                  })
                }
              />

              <s-text-area
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,

                    description: event.target.value,
                  })
                }
              />

              <s-text-field
                label="Handle"
                value={form.handle}
                onChange={(event) =>
                  setForm({
                    ...form,

                    handle: event.target.value,
                  })
                }
              />

              {/* ==============================================
                  CUSTOM COLLECTION
              ============================================== */}

              {collectionType === "CUSTOM" && (
                <s-box padding="base" border="base" borderRadius="base">
                  <s-stack direction="block" gap="base">
                    <s-heading>Select Products</s-heading>

                    {loadingProducts ? (
                      <s-text>Loading products...</s-text>
                    ) : products.length === 0 ? (
                      <s-text>No products found.</s-text>
                    ) : (
                      <s-stack direction="block" gap="small">
                        {products.map((product) => (
                          <s-box
                            key={product.shopifyId}
                            padding="small"
                            border="base"
                            borderRadius="base"
                          >
                            <s-stack direction="inline" gap="base">
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(
                                  product.shopifyId,
                                )}
                                onChange={() =>
                                  toggleProductSelection(product.shopifyId)
                                }
                              />

                              <s-text>{product.title}</s-text>
                            </s-stack>
                          </s-box>
                        ))}
                      </s-stack>
                    )}
                  </s-stack>
                </s-box>
              )}

              {/* ==============================================
                  AUTOMATED COLLECTION
              ============================================== */}

              {collectionType === "AUTOMATED" && (
                <s-box padding="base" border="base" borderRadius="base">
                  <s-stack direction="block" gap="base">
                    <s-heading>Automated Conditions</s-heading>

                    <s-text>
                      Shopify will automatically include products matching this
                      condition.
                    </s-text>

                    <s-text>Condition Field</s-text>

                    <s-text>Product Tag</s-text>

                    <s-text>Relation</s-text>

                    <s-text>Tagged With</s-text>

                    <s-text-field
                      label="Tag Value"
                      value={automatedCondition.value}
                      onChange={(event) =>
                        setAutomatedCondition({
                          ...automatedCondition,

                          value: event.target.value,
                        })
                      }
                    />

                    <s-text>Match Conditions</s-text>

                    <s-stack direction="inline" gap="base">
                      <s-button
                        {...(automatedMatchType === "ALL"
                          ? {
                              variant: "primary",
                            }
                          : {})}
                        onClick={() => setAutomatedMatchType("ALL")}
                      >
                        All
                      </s-button>

                      <s-button
                        {...(automatedMatchType === "ANY"
                          ? {
                              variant: "primary",
                            }
                          : {})}
                        onClick={() => setAutomatedMatchType("ANY")}
                      >
                        Any
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-box>
              )}

              {/* ==============================================
                  CREATE BUTTON
              ============================================== */}

              <s-button
                type="submit"
                {...(creating
                  ? {
                      loading: true,
                    }
                  : {})}
              >
                {collectionType === "CUSTOM"
                  ? "Create Custom Collection"
                  : "Create Automated Collection"}
              </s-button>
            </s-stack>
          </form>
        </s-stack>
      </s-section>

      {/* ======================================================
          COLLECTION LIST
      ====================================================== */}

      <s-section heading={`Collections (${collections.length})`}>
        {collections.length === 0 ? (
          <s-text>No collections found.</s-text>
        ) : (
          <s-stack direction="block" gap="base">
            {collections.map((collection) => (
              <s-box
                key={collection.shopifyId}
                padding="base"
                border="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-heading>{collection.title}</s-heading>

                  <s-text>Type: {collection.collectionType || "CUSTOM"}</s-text>

                  <s-text>Handle: {collection.handle || "N/A"}</s-text>

                  <s-text>Products: {collection.productsCount}</s-text>

                  <s-text>Sort Order: {collection.sortOrder || "N/A"}</s-text>

                  <s-text>Shopify ID: {collection.shopifyId}</s-text>

                  {/* ==========================================
                        ACTIONS
                    ========================================== */}

                  <s-stack direction="inline" gap="base">
                    <s-button onClick={() => handleManageProducts(collection)}>
                      Manage Products
                    </s-button>

                    <s-button onClick={() => handleEditCollection(collection)}>
                      Edit
                    </s-button>

                    <s-button
                      onClick={() =>
                        handleDeleteCollection(collection.shopifyId)
                      }
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

      {/* ======================================================
          MANAGE PRODUCTS
      ====================================================== */}

      {selectedCollection && (
        <div id="collection-products-section">
          <s-section heading={`Manage Products - ${selectedCollection.title}`}>
            <s-stack direction="block" gap="base">
              <s-text>
                Collection Type: {selectedCollection.collectionType || "CUSTOM"}
              </s-text>

              {/* ==================================================
                  AUTOMATED COLLECTION
              ================================================== */}

              {selectedCollection.collectionType === "AUTOMATED" ? (
                <s-box padding="base" border="base" borderRadius="base">
                  <s-text>
                    This is an automated collection. Shopify automatically
                    manages its products based on the configured conditions.
                  </s-text>
                </s-box>
              ) : (
                <>
                  {/* ==============================================
                      CURRENT PRODUCTS
                  ============================================== */}

                  <s-box padding="base" border="base" borderRadius="base">
                    <s-stack direction="block" gap="base">
                      <s-heading>Current Products</s-heading>

                      {(selectedCollection.products || []).length === 0 ? (
                        <s-text>No products in this collection.</s-text>
                      ) : (
                        (selectedCollection.products || []).map((product) => (
                          <s-box
                            key={product.shopifyId}
                            padding="small"
                            border="base"
                            borderRadius="base"
                          >
                            <s-stack direction="inline" gap="base">
                              <input
                                type="checkbox"
                                checked={productsToRemove.includes(
                                  product.shopifyId,
                                )}
                                onChange={() => {
                                  setProductsToRemove((current) =>
                                    current.includes(product.shopifyId)
                                      ? current.filter(
                                          (id) => id !== product.shopifyId,
                                        )
                                      : [...current, product.shopifyId],
                                  );
                                }}
                              />

                              <s-text>{product.title}</s-text>
                            </s-stack>
                          </s-box>
                        ))
                      )}

                      <s-button
                        onClick={handleRemoveProducts}
                        {...(removingProducts
                          ? {
                              loading: true,
                            }
                          : {})}
                      >
                        Remove Selected Products
                      </s-button>
                    </s-stack>
                  </s-box>

                  {/* ==============================================
                      ADD PRODUCTS
                  ============================================== */}

                  <s-box padding="base" border="base" borderRadius="base">
                    <s-stack direction="block" gap="base">
                      <s-heading>Add Products</s-heading>

                      {products.map((product) => {
                        const alreadyAdded = (
                          selectedCollection.products || []
                        ).some((item) => item.shopifyId === product.shopifyId);

                        return (
                          <s-box
                            key={product.shopifyId}
                            padding="small"
                            border="base"
                            borderRadius="base"
                          >
                            <s-stack direction="inline" gap="base">
                              <input
                                type="checkbox"
                                disabled={alreadyAdded}
                                checked={productsToAdd.includes(
                                  product.shopifyId,
                                )}
                                onChange={() => {
                                  setProductsToAdd((current) =>
                                    current.includes(product.shopifyId)
                                      ? current.filter(
                                          (id) => id !== product.shopifyId,
                                        )
                                      : [...current, product.shopifyId],
                                  );
                                }}
                              />

                              <s-text>
                                {product.title}

                                {alreadyAdded ? " (Already added)" : ""}
                              </s-text>
                            </s-stack>
                          </s-box>
                        );
                      })}

                      <s-button
                        onClick={handleAddProducts}
                        {...(addingProducts
                          ? {
                              loading: true,
                            }
                          : {})}
                      >
                        Add Selected Products
                      </s-button>
                    </s-stack>
                  </s-box>
                </>
              )}
            </s-stack>
          </s-section>
        </div>
      )}

      {/* ======================================================
          EDIT COLLECTION
      ====================================================== */}

      {editingCollection && (
        <div id="edit-collection-section">
          <s-section heading="Edit Collection">
            <form onSubmit={handleUpdateCollection}>
              <s-stack direction="block" gap="base">
                <s-text-field
                  label="Title"
                  value={editingCollection.title}
                  onChange={(event) =>
                    setEditingCollection({
                      ...editingCollection,

                      title: event.target.value,
                    })
                  }
                />

                <s-text-area
                  label="Description"
                  value={editingCollection.description}
                  onChange={(event) =>
                    setEditingCollection({
                      ...editingCollection,

                      description: event.target.value,
                    })
                  }
                />

                <s-text-field
                  label="Handle"
                  value={editingCollection.handle}
                  onChange={(event) =>
                    setEditingCollection({
                      ...editingCollection,

                      handle: event.target.value,
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
                    Update Collection
                  </s-button>

                  <s-button type="button" onClick={handleCancelEdit}>
                    Cancel
                  </s-button>
                </s-stack>
              </s-stack>
            </form>
          </s-section>
        </div>
      )}
    </s-page>
  );
}
