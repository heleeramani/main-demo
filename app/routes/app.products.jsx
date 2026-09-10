import { useEffect, useMemo, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState([]);

  // ================================
  // PAGINATION
  // ================================

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ================================
  // BULK OPERATION
  // ================================

  const [bulkOperation, setBulkOperation] = useState(null);
  const [bulkStarting, setBulkStarting] = useState(false);
  const [bulkChecking, setBulkChecking] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  // ================================
  // METAFIELDS
  // ================================

  const [productMetafields, setProductMetafields] = useState({});
  const [loadingMetafields, setLoadingMetafields] = useState(false);

  // ================================
  // PRODUCT STATES
  // ================================

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ================================
  // CREATE PRODUCT FORM
  // ================================

  const [form, setForm] = useState({
    title: "",
    description: "",
    vendor: "",
    productType: "",
  });

  // ================================
  // EDIT PRODUCT
  // ================================

  const [editingProduct, setEditingProduct] = useState(null);

  // ================================
  // INVENTORY: LOCATIONS
  // ================================

  const [locations, setLocations] = useState([]);

  // ================================
  // INVENTORY: SELECTED PRODUCT PANEL
  // ================================

  const [selectedInventoryProduct, setSelectedInventoryProduct] =
    useState(null);

  const [productInventory, setProductInventory] = useState([]);

  const [loadingInventory, setLoadingInventory] = useState(false);

  const [inventoryError, setInventoryError] = useState("");

  const [inventoryMessage, setInventoryMessage] = useState("");

  // Adjust-quantity input values, keyed by `${inventoryItemId}-${locationId}`

  const [adjustInputs, setAdjustInputs] = useState({});

  const [adjustingKey, setAdjustingKey] = useState("");

  // ================================
  // INVENTORY: TRANSFER FORM
  // ================================

  const [transferVariantId, setTransferVariantId] = useState("");

  const [transferOriginLocationId, setTransferOriginLocationId] = useState("");

  const [transferDestinationLocationId, setTransferDestinationLocationId] =
    useState("");

  const [transferQuantity, setTransferQuantity] = useState("");

  const [transferNote, setTransferNote] = useState("");

  const [transferLoading, setTransferLoading] = useState(false);

  // ==========================================================
  // LOAD PRODUCT METAFIELDS
  // ==========================================================

  async function loadProductMetafields(productList) {
    if (!Array.isArray(productList) || productList.length === 0) {
      setProductMetafields({});
      return;
    }

    try {
      setLoadingMetafields(true);

      const results = await Promise.all(
        productList.map(async (product) => {
          const productId = product.shopifyId || product.id;

          if (!productId) {
            return {
              productId: null,
              metafields: [],
            };
          }

          try {
            const response = await fetch(
              `/api/metafields?ownerId=${encodeURIComponent(
                productId,
              )}&ownerType=PRODUCT`,
            );

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
              console.error(
                `Metafield API returned non-JSON response for ${productId}`,
              );

              return {
                productId,
                metafields: [],
              };
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
              console.error(
                `Failed to load metafields for ${productId}:`,
                data.message,
              );

              return {
                productId,
                metafields: [],
              };
            }

            /*
             * Supports both possible API response formats:
             *
             * {
             *   success: true,
             *   metafields: [...]
             * }
             *
             * OR
             *
             * {
             *   success: true,
             *   data: [...]
             * }
             */

            const metafields = Array.isArray(data.metafields)
              ? data.metafields
              : Array.isArray(data.data)
                ? data.data
                : [];

            return {
              productId,
              metafields,
            };
          } catch (error) {
            console.error(
              `Failed to load metafields for product ${productId}:`,
              error,
            );

            return {
              productId,
              metafields: [],
            };
          }
        }),
      );

      const metafieldMap = {};

      results.forEach((result) => {
        if (result.productId) {
          metafieldMap[result.productId] = result.metafields;
        }
      });

      console.log("PRODUCT METAFIELDS:", metafieldMap);

      setProductMetafields(metafieldMap);
    } catch (error) {
      console.error("Load product metafields error:", error);
    } finally {
      setLoadingMetafields(false);
    }
  }

  // ================================
  // LOAD ALL PRODUCTS FROM MONGODB
  // (no Shopify call, no 50-item cap — this is what the
  // paginated list below actually renders)
  // ================================

  async function loadProductsFromDb() {
    const response = await fetch("/api/products?source=db");

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to load products");
    }

    const productList = data.data || [];

    setProducts(productList);
    setCurrentPage(1);

    return productList;
  }

  // ================================
  // SYNC PRODUCTS
  // (live Shopify sync of the first 50, then re-read the full
  // synced catalog from MongoDB so bulk-synced products show too)
  // ================================

  async function syncProducts(showMessage = true) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sync products");
      }

      await loadProductsFromDb();

      if (showMessage) {
        setMessage(`${data.count || 0} products synced successfully`);
      }
    } catch (error) {
      console.error("Sync products error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // ================================
  // BULK PRODUCT QUERY
  // ================================

  async function handleBulkStart() {
    try {
      setBulkStarting(true);
      setBulkError("");
      setBulkMessage("");

      const response = await fetch("/api/products?bulk=start");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to start bulk product query");
      }

      setBulkOperation(data.data);
      setBulkMessage("Bulk product query started");
    } catch (error) {
      console.error("Start bulk product query error:", error);
      setBulkError(error.message);
    } finally {
      setBulkStarting(false);
    }
  }

  async function handleBulkCheckStatus() {
    try {
      setBulkChecking(true);
      setBulkError("");
      setBulkMessage("");

      const response = await fetch("/api/products?bulk=status");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to check bulk operation status");
      }

      setBulkOperation(data.data);
    } catch (error) {
      console.error("Check bulk operation status error:", error);
      setBulkError(error.message);
    } finally {
      setBulkChecking(false);
    }
  }

  async function handleBulkSync() {
    try {
      setBulkSyncing(true);
      setBulkError("");
      setBulkMessage("");

      const response = await fetch("/api/products?bulk=sync");

      const data = await response.json();

      if (data.data) {
        setBulkOperation(data.data);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sync bulk product results");
      }

      setBulkMessage(
        data.message ||
        `${data.count || 0} products synced from bulk operation`,
      );

      await loadProductsFromDb();
    } catch (error) {
      console.error("Sync bulk product results error:", error);
      setBulkError(error.message);
    } finally {
      setBulkSyncing(false);
    }
  }

  // ================================
  // LOAD LOCATIONS
  // ================================

  async function loadLocations() {
    try {
      const response = await fetch("/api/inventory?type=locations");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load locations");
      }

      setLocations(data.data || []);
    } catch (error) {
      console.error("Load locations error:", error);
      setInventoryError(error.message);
    }
  }

  // ================================
  // INITIAL LOAD
  // ================================

  useEffect(() => {
    syncProducts(false);
    loadLocations();
  }, []);

  // ================================
  // PAGINATION
  // ================================

  const totalPages = Math.max(
    1,
    Math.ceil(products.length / pageSize),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return products.slice(start, start + pageSize);
  }, [products, currentPage, pageSize]);

  // Only fetch metafields for the products currently visible on
  // this page, not the full (potentially bulk-synced) catalog.
  useEffect(() => {
    loadProductMetafields(paginatedProducts);
  }, [paginatedProducts]);

  // ================================
  // LOAD INVENTORY FOR ONE PRODUCT
  // ================================

  async function loadProductInventory(product) {
    try {
      setLoadingInventory(true);
      setInventoryError("");
      setInventoryMessage("");

      setSelectedInventoryProduct(product);

      const variants = product.variants || [];

      const results = await Promise.all(
        variants.map(async (variant) => {
          const response = await fetch(
            `/api/inventory?variantId=${encodeURIComponent(variant.shopifyId)}`,
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(
              data.message || `Failed to load inventory for ${variant.title}`,
            );
          }

          return {
            variantId: variant.shopifyId,
            variantTitle: variant.title || "Default Title",
            sku: variant.sku || "",
            inventoryItemId: data.data?.[0]?.inventoryItemId || "",
            locations: data.data || [],
          };
        }),
      );

      setProductInventory(results);

      // Default transfer form to first tracked variant

      const firstTracked = results.find((item) => item.inventoryItemId);

      setTransferVariantId(firstTracked?.variantId || "");

      setTransferOriginLocationId("");
      setTransferDestinationLocationId("");
      setTransferQuantity("");
      setTransferNote("");

      setTimeout(() => {
        document.getElementById("product-inventory-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      console.error("Load product inventory error:", error);

      setInventoryError(error.message);
    } finally {
      setLoadingInventory(false);
    }
  }

  // ================================
  // CLOSE INVENTORY PANEL
  // ================================

  function closeInventoryPanel() {
    setSelectedInventoryProduct(null);
    setProductInventory([]);
    setAdjustInputs({});
    setInventoryError("");
    setInventoryMessage("");
  }

  // ================================
  // ADJUST STOCK
  // ================================

  async function handleAdjustStock(inventoryItemId, locationId) {
    const key = `${inventoryItemId}-${locationId}`;

    const rawValue = adjustInputs[key];

    const delta = Number(rawValue);

    try {
      setInventoryError("");
      setInventoryMessage("");

      if (!rawValue || !Number.isInteger(delta) || delta === 0) {
        throw new Error("Enter a non-zero whole number, e.g. 10 or -5");
      }

      setAdjustingKey(key);

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: delta > 0 ? "increase" : "decrease",

          inventoryItemId,

          locationId,

          quantity: Math.abs(delta),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to adjust inventory");
      }

      setInventoryMessage(data.message || "Inventory adjusted successfully");

      setAdjustInputs((current) => ({
        ...current,
        [key]: "",
      }));

      if (selectedInventoryProduct) {
        await loadProductInventory(selectedInventoryProduct);
      }
    } catch (error) {
      console.error("Adjust stock error:", error);

      setInventoryError(error.message);
    } finally {
      setAdjustingKey("");
    }
  }

  // ================================
  // TRANSFER INVENTORY
  // ================================

  async function handleProductTransfer() {
    try {
      setInventoryError("");
      setInventoryMessage("");

      const variant = productInventory.find(
        (item) => item.variantId === transferVariantId,
      );

      if (!variant || !variant.inventoryItemId) {
        throw new Error("Select a variant that has tracked inventory");
      }

      if (!transferOriginLocationId) {
        throw new Error("Please select the source location");
      }

      if (!transferDestinationLocationId) {
        throw new Error("Please select the destination location");
      }

      if (transferOriginLocationId === transferDestinationLocationId) {
        throw new Error("Source and destination locations must be different");
      }

      const numericQuantity = Number(transferQuantity);

      if (!Number.isInteger(numericQuantity) || numericQuantity <= 0) {
        throw new Error("Transfer quantity must be a positive integer");
      }

      setTransferLoading(true);

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "transfer",

          originLocationId: transferOriginLocationId,

          destinationLocationId: transferDestinationLocationId,

          inventoryItemId: variant.inventoryItemId,

          quantity: numericQuantity,

          note: transferNote || "",

          referenceName: `PRODUCT-TRANSFER-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to transfer inventory");
      }

      setInventoryMessage(
        data.message || "Inventory transfer created successfully",
      );

      setTransferQuantity("");
      setTransferNote("");

      if (selectedInventoryProduct) {
        await loadProductInventory(selectedInventoryProduct);
      }
    } catch (error) {
      console.error("Transfer inventory error:", error);

      setInventoryError(error.message);
    } finally {
      setTransferLoading(false);
    }
  }

  // ================================
  // CREATE PRODUCT
  // ================================

  async function handleCreateProduct(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setMessage("");

      if (!form.title.trim()) {
        throw new Error("Product title is required");
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create product");
      }

      setMessage("Product created successfully");

      setForm({
        title: "",
        description: "",
        vendor: "",
        productType: "",
      });

      await syncProducts(false);
    } catch (error) {
      console.error("Create product error:", error);

      setError(error.message);
    } finally {
      setCreating(false);
    }
  }

  // ================================
  // OPEN EDIT FORM
  // ================================

  function handleEditProduct(product) {
    setError("");
    setMessage("");

    setEditingProduct({
      id: product.shopifyId,

      title: product.title || "",

      description: product.description || "",

      vendor: product.vendor || "",

      productType: product.productType || "",
    });

    setTimeout(() => {
      document.getElementById("edit-product-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  // ================================
  // UPDATE PRODUCT
  // ================================

  async function handleUpdateProduct(event) {
    event.preventDefault();

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      if (!editingProduct.title.trim()) {
        throw new Error("Product title is required");
      }

      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingProduct.id,

          title: editingProduct.title,

          descriptionHtml: editingProduct.description,

          vendor: editingProduct.vendor,

          productType: editingProduct.productType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update product");
      }

      setMessage("Product updated successfully");

      setEditingProduct(null);

      await syncProducts(false);
    } catch (error) {
      console.error("Update product error:", error);

      setError(error.message);
    } finally {
      setUpdating(false);
    }
  }

  // ================================
  // DELETE PRODUCT
  // ================================

  async function handleDeleteProduct(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: productId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete product");
      }

      setMessage("Product deleted successfully");

      if (editingProduct?.id === productId) {
        setEditingProduct(null);
      }

      await syncProducts(false);
    } catch (error) {
      console.error("Delete product error:", error);

      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  // ================================
  // CANCEL EDIT
  // ================================

  function handleCancelEdit() {
    setEditingProduct(null);
    setError("");
  }

  // ================================
  // TRANSFER LOCATION OPTIONS
  // ================================

  const transferOriginOptions = useMemo(() => {
    return locations.filter(
      (location) => location.id !== transferDestinationLocationId,
    );
  }, [locations, transferDestinationLocationId]);

  const transferDestinationOptions = useMemo(() => {
    return locations.filter(
      (location) => location.id !== transferOriginLocationId,
    );
  }, [locations, transferOriginLocationId]);

  // ================================
  // SELECTED TRANSFER VARIANT
  // ================================

  const trackedVariants = productInventory.filter(
    (item) => item.inventoryItemId,
  );

  const selectedTransferVariant = trackedVariants.find(
    (item) => item.variantId === transferVariantId,
  );

  // ================================
  // AVAILABLE QUANTITY
  // ================================

  function getAvailableAtLocation(locationId) {
    const match = selectedTransferVariant?.locations.find(
      (location) => location.locationId === locationId,
    );

    return match?.available ?? 0;
  }

  // ================================
  // UI
  // ================================

  return (
    <s-page heading="Products">
      {/* ================================= */}
      {/* SUCCESS MESSAGE */}
      {/* ================================= */}

      {message && <s-banner tone="success">{message}</s-banner>}

      {/* ================================= */}
      {/* ERROR MESSAGE */}
      {/* ================================= */}

      {error && <s-banner tone="critical">{error}</s-banner>}

      {/* ================================= */}
      {/* PRODUCT MANAGEMENT */}
      {/* ================================= */}

      <s-section heading="Product Management">
        <s-button
          onClick={() => syncProducts(true)}
          {...(loading ? { loading: true } : {})}
        >
          Sync Products
        </s-button>
      </s-section>

      {/* ================================= */}
      {/* BULK PRODUCT QUERY */}
      {/* ================================= */}

      <s-section heading="Bulk Product Query">
        {bulkError && <s-banner tone="critical">{bulkError}</s-banner>}

        {bulkMessage && <s-banner tone="success">{bulkMessage}</s-banner>}

        <s-stack direction="block" gap="base">
          <s-text>
            Fetches every product from Shopify in one background
            operation, instead of the 50-item cap on the regular sync
            above. Start it, check its status until it completes, then
            sync the results.
          </s-text>

          {bulkOperation && (
            <s-text>
              Status: <strong>{bulkOperation.status || "-"}</strong>
              {typeof bulkOperation.objectCount !== "undefined"
                ? ` · Objects: ${bulkOperation.objectCount}`
                : ""}
              {bulkOperation.errorCode
                ? ` · Error: ${bulkOperation.errorCode}`
                : ""}
            </s-text>
          )}

          <s-stack direction="inline" gap="base">
            <s-button
              onClick={handleBulkStart}
              {...(bulkStarting ? { loading: true } : {})}
            >
              Start Bulk Query
            </s-button>

            <s-button
              onClick={handleBulkCheckStatus}
              {...(bulkChecking ? { loading: true } : {})}
            >
              Check Status
            </s-button>

            <s-button
              variant="primary"
              onClick={handleBulkSync}
              {...(bulkSyncing ? { loading: true } : {})}
            >
              Sync Results
            </s-button>
          </s-stack>
        </s-stack>
      </s-section>

      {/* ================================= */}
      {/* CREATE PRODUCT */}
      {/* ================================= */}

      <s-section heading="Create Product">
        <form onSubmit={handleCreateProduct}>
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
              label="Vendor"
              value={form.vendor}
              onChange={(event) =>
                setForm({
                  ...form,
                  vendor: event.target.value,
                })
              }
            />

            <s-text-field
              label="Product Type"
              value={form.productType}
              onChange={(event) =>
                setForm({
                  ...form,
                  productType: event.target.value,
                })
              }
            />

            <s-button type="submit" {...(creating ? { loading: true } : {})}>
              Create Product
            </s-button>
          </s-stack>
        </form>
      </s-section>

      {/* ================================= */}
      {/* PRODUCT LIST */}
      {/* ================================= */}

      <s-section heading={`Products (${products.length})`}>
        {products.length === 0 ? (
          <s-text>No products found.</s-text>
        ) : (
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text>
                Page {currentPage} of {totalPages} — showing{" "}
                {paginatedProducts.length} of {products.length} products
              </s-text>

              <s-select
                label="Per page"
                value={String(pageSize)}
                onChange={(event) => {
                  setPageSize(Number(event.currentTarget.value));
                  setCurrentPage(1);
                }}
              >
                <s-option value="10">10 per page</s-option>
                <s-option value="20">20 per page</s-option>
                <s-option value="50">50 per page</s-option>
                <s-option value="100">100 per page</s-option>
              </s-select>
            </s-stack>

            {paginatedProducts.map((product) => {
              const productId = product.shopifyId || product.id;

              const metafields = productMetafields[productId] || [];

              return (
                <s-box
                  key={productId}
                  padding="base"
                  border="base"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="small">
                    {/* ================================= */}
                    {/* PRODUCT DETAILS */}
                    {/* ================================= */}

                    <s-heading>{product.title}</s-heading>

                    <s-text>Vendor: {product.vendor || "N/A"}</s-text>

                    <s-text>
                      Product Type: {product.productType || "N/A"}
                    </s-text>

                    <s-text>Status: {product.status || "N/A"}</s-text>

                    <s-text>Shopify ID: {product.shopifyId}</s-text>

                    {/* ================================= */}
                    {/* PRODUCT METAFIELDS */}
                    {/* ================================= */}

                    {metafields.length > 0 && (
                      <s-box padding="base" border="base" borderRadius="base">
                        <s-stack direction="block" gap="base">
                          <s-heading>
                            Metafields ({metafields.length})
                          </s-heading>

                          <s-table>
                            <s-table-header-row>
                              <s-table-header>Namespace</s-table-header>

                              <s-table-header>Key</s-table-header>

                              <s-table-header>Type</s-table-header>

                              <s-table-header>Value</s-table-header>
                            </s-table-header-row>

                            <s-table-body>
                              {metafields.map((metafield) => (
                                <s-table-row
                                  key={
                                    metafield.shopifyId ||
                                    metafield.id ||
                                    `${metafield.namespace}-${metafield.key}`
                                  }
                                >
                                  <s-table-cell>
                                    {metafield.namespace || "-"}
                                  </s-table-cell>

                                  <s-table-cell>
                                    {metafield.key || "-"}
                                  </s-table-cell>

                                  <s-table-cell>
                                    {metafield.type || "-"}
                                  </s-table-cell>

                                  <s-table-cell>
                                    {metafield.value ||
                                      metafield.jsonValue ||
                                      "-"}
                                  </s-table-cell>
                                </s-table-row>
                              ))}
                            </s-table-body>
                          </s-table>
                        </s-stack>
                      </s-box>
                    )}

                    {/* ================================= */}
                    {/* METAFIELD LOADING */}
                    {/* ================================= */}

                    {loadingMetafields && metafields.length === 0 && (
                      <s-text>Loading metafields...</s-text>
                    )}

                    {/* ================================= */}
                    {/* ACTION BUTTONS */}
                    {/* ================================= */}

                    <s-stack direction="inline" gap="base">
                      {/* MANAGE INVENTORY */}

                      <s-button
                        onClick={() => loadProductInventory(product)}
                        {...(loadingInventory &&
                          selectedInventoryProduct?.shopifyId ===
                          product.shopifyId
                          ? {
                            loading: true,
                          }
                          : {})}
                      >
                        Manage Inventory
                      </s-button>

                      {/* EDIT */}

                      <s-button onClick={() => handleEditProduct(product)}>
                        Edit
                      </s-button>

                      {/* DELETE */}

                      <s-button
                        onClick={() => handleDeleteProduct(product.shopifyId)}
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
              );
            })}

            <s-stack direction="inline" gap="base">
              <s-button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                {...(currentPage <= 1 ? { disabled: true } : {})}
              >
                Previous
              </s-button>

              <s-text>
                Page {currentPage} of {totalPages}
              </s-text>

              <s-button
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                {...(currentPage >= totalPages ? { disabled: true } : {})}
              >
                Next
              </s-button>
            </s-stack>
          </s-stack>
        )}
      </s-section>

      {/* ================================= */}
      {/* PRODUCT INVENTORY PANEL */}
      {/* ================================= */}

      {selectedInventoryProduct && (
        <div id="product-inventory-section">
          <s-section heading={`Inventory — ${selectedInventoryProduct.title}`}>
            <s-stack direction="block" gap="base">
              {/* INVENTORY SUCCESS */}

              {inventoryMessage && (
                <s-banner tone="success">{inventoryMessage}</s-banner>
              )}

              {/* INVENTORY ERROR */}

              {inventoryError && (
                <s-banner tone="critical">{inventoryError}</s-banner>
              )}

              {/* INVENTORY LOADING */}

              {loadingInventory ? (
                <s-text>Loading inventory...</s-text>
              ) : productInventory.length === 0 ? (
                <s-text>This product has no variants.</s-text>
              ) : (
                productInventory.map((variant) => (
                  <s-box
                    key={variant.variantId}
                    padding="base"
                    border="base"
                    borderRadius="base"
                  >
                    <s-stack direction="block" gap="base">
                      <s-heading>
                        {variant.variantTitle}

                        {variant.sku ? ` · SKU: ${variant.sku}` : ""}
                      </s-heading>

                      {!variant.inventoryItemId ? (
                        <s-text>
                          Inventory is not tracked for this variant.
                        </s-text>
                      ) : variant.locations.length === 0 ? (
                        <s-text>Not stocked at any location yet.</s-text>
                      ) : (
                        variant.locations.map((location) => {
                          const key = `${variant.inventoryItemId}-${location.locationId}`;

                          return (
                            <s-box
                              key={key}
                              padding="base"
                              border="base"
                              borderRadius="base"
                            >
                              <s-stack direction="block" gap="small">
                                <s-text>
                                  Location: {location.locationName || "N/A"}
                                </s-text>

                                <s-text>
                                  Available Quantity: {location.available ?? 0}
                                </s-text>

                                <s-stack direction="inline" gap="base">
                                  <s-text-field
                                    label="Adjust Inventory"
                                    placeholder="Example: 10 or -5"
                                    value={adjustInputs[key] || ""}
                                    onChange={(event) =>
                                      setAdjustInputs((current) => ({
                                        ...current,
                                        [key]: event.target.value,
                                      }))
                                    }
                                  />

                                  <s-button
                                    onClick={() =>
                                      handleAdjustStock(
                                        variant.inventoryItemId,
                                        location.locationId,
                                      )
                                    }
                                    {...(adjustingKey === key
                                      ? {
                                        loading: true,
                                      }
                                      : {})}
                                  >
                                    Adjust Stock
                                  </s-button>
                                </s-stack>
                              </s-stack>
                            </s-box>
                          );
                        })
                      )}
                    </s-stack>
                  </s-box>
                ))
              )}

              {/* ================================= */}
              {/* TRANSFER INVENTORY */}
              {/* ================================= */}

              {trackedVariants.length > 0 && (
                <s-box padding="base" border="base" borderRadius="base">
                  <s-stack direction="block" gap="base">
                    <s-heading>Transfer Inventory Between Locations</s-heading>

                    {locations.length < 2 && (
                      <s-banner tone="warning">
                        You need at least 2 active locations to transfer
                        inventory.
                      </s-banner>
                    )}

                    {/* VARIANT */}

                    {trackedVariants.length > 1 && (
                      <s-select
                        label="Variant"
                        value={transferVariantId}
                        onChange={(event) =>
                          setTransferVariantId(event.currentTarget.value)
                        }
                      >
                        {trackedVariants.map((variant) => (
                          <s-option
                            key={variant.variantId}
                            value={variant.variantId}
                          >
                            {variant.variantTitle}
                          </s-option>
                        ))}
                      </s-select>
                    )}

                    {/* SOURCE LOCATION */}

                    <s-select
                      label="Source Location"
                      placeholder="Select source location"
                      value={transferOriginLocationId}
                      onChange={(event) => {
                        const value = event.currentTarget.value;

                        setTransferOriginLocationId(value);

                        if (value && value === transferDestinationLocationId) {
                          setTransferDestinationLocationId("");
                        }
                      }}
                    >
                      {transferOriginOptions.map((location) => (
                        <s-option key={location.id} value={location.id}>
                          {location.name} ({getAvailableAtLocation(location.id)}{" "}
                          available)
                        </s-option>
                      ))}
                    </s-select>

                    {/* DESTINATION LOCATION */}

                    <s-select
                      label="Destination Location"
                      placeholder="Select destination location"
                      value={transferDestinationLocationId}
                      onChange={(event) => {
                        const value = event.currentTarget.value;

                        setTransferDestinationLocationId(value);

                        if (value && value === transferOriginLocationId) {
                          setTransferOriginLocationId("");
                        }
                      }}
                    >
                      {transferDestinationOptions.map((location) => (
                        <s-option key={location.id} value={location.id}>
                          {location.name} ({getAvailableAtLocation(location.id)}{" "}
                          available)
                        </s-option>
                      ))}
                    </s-select>

                    {/* TRANSFER QUANTITY */}

                    <s-number-field
                      label="Transfer Quantity"
                      value={transferQuantity}
                      min="1"
                      onInput={(event) =>
                        setTransferQuantity(event.currentTarget.value)
                      }
                    />

                    {/* NOTE */}

                    <s-text-area
                      label="Note"
                      value={transferNote}
                      onInput={(event) =>
                        setTransferNote(event.currentTarget.value)
                      }
                    />

                    {/* TRANSFER BUTTON */}

                    <s-stack direction="inline" gap="base">
                      <s-button
                        variant="primary"
                        onClick={handleProductTransfer}
                        {...(locations.length < 2
                          ? {
                            disabled: true,
                          }
                          : {})}
                        {...(transferLoading
                          ? {
                            loading: true,
                          }
                          : {})}
                      >
                        Transfer Inventory
                      </s-button>
                    </s-stack>

                    {/* INFO */}

                    <s-banner tone="info">
                      Stock moves immediately: the source location is
                      decremented and the destination location is incremented
                      right away. A destination not yet tracking this item is
                      activated automatically.
                    </s-banner>
                  </s-stack>
                </s-box>
              )}

              {/* CLOSE */}

              <s-button onClick={closeInventoryPanel}>Close</s-button>
            </s-stack>
          </s-section>
        </div>
      )}

      {/* ================================= */}
      {/* EDIT PRODUCT */}
      {/* ================================= */}

      {editingProduct && (
        <div id="edit-product-section">
          <s-section heading="Edit Product">
            <form onSubmit={handleUpdateProduct}>
              <s-stack direction="block" gap="base">
                {/* TITLE */}

                <s-text-field
                  label="Title"
                  value={editingProduct.title}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      title: event.target.value,
                    })
                  }
                />

                {/* DESCRIPTION */}

                <s-text-area
                  label="Description"
                  value={editingProduct.description}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: event.target.value,
                    })
                  }
                />

                {/* VENDOR */}

                <s-text-field
                  label="Vendor"
                  value={editingProduct.vendor}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      vendor: event.target.value,
                    })
                  }
                />

                {/* PRODUCT TYPE */}

                <s-text-field
                  label="Product Type"
                  value={editingProduct.productType}
                  onChange={(event) =>
                    setEditingProduct({
                      ...editingProduct,
                      productType: event.target.value,
                    })
                  }
                />

                {/* BUTTONS */}

                <s-stack direction="inline" gap="base">
                  <s-button
                    type="submit"
                    {...(updating
                      ? {
                        loading: true,
                      }
                      : {})}
                  >
                    Update Product
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
