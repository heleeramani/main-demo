import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [syncing, setSyncing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [deleting, setDeleting] =
    useState("");

  const [cancelling, setCancelling] =
    useState("");

  // ============================================================
  // UPDATE STATE
  // ============================================================

  const [editingOrder, setEditingOrder] =
    useState(null);

  const [updating, setUpdating] =
    useState(false);


  // ============================================================
  // LOAD ORDERS
  // ============================================================

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch("/api/orders");

      const text =
        await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Server returned an invalid response"
        );
      }

      console.log(
        "Orders API response:",
        result
      );

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to load orders"
        );
      }

      setOrders(
        result.data || []
      );
    } catch (error) {
      console.error(
        "Load orders error:",
        error
      );

      setError(
        error?.message ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }


  // ============================================================
  // SYNC ORDERS
  // ============================================================

  async function syncOrders() {
    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const response =
        await fetch("/api/orders");

      const text =
        await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Invalid server response"
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to sync orders"
        );
      }

      setOrders(
        result.data || []
      );

      setMessage(
        `${result.count || 0} orders synced successfully`
      );
    } catch (error) {
      console.error(
        "Sync orders error:",
        error
      );

      setError(
        error?.message ||
          "Failed to sync orders"
      );
    } finally {
      setSyncing(false);
    }
  }


  // ============================================================
  // CREATE ORDER
  // ============================================================

  async function handleCreateOrder(
    event
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setMessage("");

      const formData =
        new FormData(
          event.currentTarget
        );

      const title =
        formData.get("title");

      const quantity =
        Number(
          formData.get("quantity")
        );

      const price =
        Number(
          formData.get("price")
        );

      if (!title) {
        throw new Error(
          "Product title is required"
        );
      }

      if (
        !quantity ||
        quantity < 1
      ) {
        throw new Error(
          "Quantity must be at least 1"
        );
      }

      if (
        Number.isNaN(price) ||
        price < 0
      ) {
        throw new Error(
          "Price must be a valid number"
        );
      }

      const orderData = {
        lineItems: [
          {
            title,
            quantity,
            price,
          },
        ],
      };

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action: "create",

              order:
                orderData,
            }),
          }
        );

      const text =
        await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Invalid server response"
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to create order"
        );
      }

      console.log(
        "Created order:",
        result
      );

      if (result.data) {
        setOrders(
          (currentOrders) => [
            result.data,
            ...currentOrders,
          ]
        );
      }

      setMessage(
        result.message ||
          "Order created successfully"
      );

      setShowCreateForm(false);

      event.currentTarget.reset();

    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      setError(
        error?.message ||
          "Failed to create order"
      );
    } finally {
      setCreating(false);
    }
  }


  // ============================================================
  // GET SINGLE ORDER
  // ============================================================

  async function viewOrder(
    orderId
  ) {
    try {
      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/orders?orderId=${encodeURIComponent(
            orderId
          )}`
        );

      const text =
        await response.text();

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Invalid server response"
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to get order"
        );
      }

      setSelectedOrder(
        result.data
      );
    } catch (error) {
      console.error(
        "Get order error:",
        error
      );

      setError(
        error?.message ||
          "Failed to get order"
      );
    }
  }


  // ============================================================
  // START EDITING ORDER
  // ============================================================

  function startEditOrder(order) {
    setError("");
    setMessage("");

    setEditingOrder({
      id: order.shopifyId,

      note: order.note || "",

      tags:
        Array.isArray(order.tags)
          ? order.tags.join(", ")
          : "",
    });
  }


  // ============================================================
  // UPDATE ORDER
  // ============================================================

  async function handleUpdateOrder(
    event
  ) {
    event.preventDefault();

    if (!editingOrder?.id) {
      setError(
        "Order ID is required"
      );

      return;
    }

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      const formData =
        new FormData(
          event.currentTarget
        );

      const note =
        formData.get("note") || "";

      const tagsText =
        formData.get("tags") || "";

      const tags =
        tagsText
          .split(",")
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean);

      // --------------------------------------------------------
      // Shopify OrderInput
      // --------------------------------------------------------

      const orderData = {
        id:
          editingOrder.id,

        note,

        tags,
      };

      const response =
        await fetch(
          "/api/orders",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                orderData
              ),
          }
        );

      const text =
        await response.text();

      let result;

      try {
        result =
          JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Invalid server response"
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to update order"
        );
      }

      console.log(
        "Updated order:",
        result
      );

      setMessage(
        result.message ||
          "Order updated successfully"
      );

      setEditingOrder(null);

      // --------------------------------------------------------
      // Reload latest Shopify data
      // --------------------------------------------------------

      await loadOrders();

    } catch (error) {
      console.error(
        "Update order error:",
        error
      );

      setError(
        error?.message ||
          "Failed to update order"
      );
    } finally {
      setUpdating(false);
    }
  }


  // ============================================================
  // CANCEL ORDER
  // ============================================================

  async function handleCancelOrder(
    order
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to cancel ${order.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(
        order.shopifyId
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action:
                "cancel",

              orderId:
                order.shopifyId,

              reason:
                "OTHER",

              restock:
                true,
            }),
          }
        );

      const text =
        await response.text();

      let result;

      try {
        result =
          JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Invalid server response"
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to cancel order"
        );
      }

      setMessage(
        result.message ||
          "Order cancellation requested"
      );

      await loadOrders();

    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      setError(
        error?.message ||
          "Failed to cancel order"
      );
    } finally {
      setCancelling("");
    }
  }


  // ============================================================
  // DELETE ORDER
  // ============================================================

  async function handleDeleteOrder(
    order
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${order.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(
        order.shopifyId
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action:
                "delete",

              orderId:
                order.shopifyId,
            }),
          }
        );

      const text =
        await response.text();

      let result;

      try {
        result =
          JSON.parse(text);
      } catch {
        throw new Error(
          text ||
            "Invalid server response"
        );
      }

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to delete order"
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.filter(
            (item) =>
              item.shopifyId !==
              order.shopifyId
          )
      );

      setMessage(
        result.message ||
          "Order deleted successfully"
      );

    } catch (error) {
      console.error(
        "Delete order error:",
        error
      );

      setError(
        error?.message ||
          "Failed to delete order"
      );
    } finally {
      setDeleting("");
    }
  }


  // ============================================================
  // LOAD ORDERS WHEN PAGE OPENS
  // ============================================================

  useEffect(() => {
    loadOrders();
  }, []);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <s-page heading="Orders">
        <s-section>
          <s-paragraph>
            Loading orders...
          </s-paragraph>
        </s-section>
      </s-page>
    );
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <s-page heading="Orders">

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <s-banner tone="critical">
          {error}
        </s-banner>
      )}


      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {message && (
        <s-banner tone="success">
          {message}
        </s-banner>
      )}


      {/* ======================================================
          ORDER MANAGEMENT
      ====================================================== */}

      <s-section heading="Order Management">

        <s-stack
          direction="inline"
          gap="base"
        >

          <s-button
            onClick={() =>
              setShowCreateForm(
                !showCreateForm
              )
            }
          >
            {showCreateForm
              ? "Close"
              : "Create Order"}
          </s-button>


          <s-button
            onClick={syncOrders}
            loading={syncing}
          >
            {syncing
              ? "Syncing..."
              : "Sync Orders"}
          </s-button>


          <s-button
            onClick={loadOrders}
          >
            Refresh
          </s-button>

        </s-stack>

      </s-section>


      {/* ======================================================
          CREATE ORDER
      ====================================================== */}

      {showCreateForm && (
        <s-section
          heading="Create Order"
        >

          <form
            onSubmit={
              handleCreateOrder
            }
          >

            <s-stack gap="base">

              <s-text-field
                label="Product Title"
                name="title"
                placeholder="Demo Product"
                required
              />

              <s-text-field
                label="Quantity"
                name="quantity"
                type="number"
                value="1"
                min="1"
                required
              />

              <s-text-field
                label="Price"
                name="price"
                type="number"
                placeholder="10.00"
                min="0"
                step="0.01"
                required
              />

              <s-button
                type="submit"
                loading={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create Order"}
              </s-button>

            </s-stack>

          </form>

        </s-section>
      )}


      {/* ======================================================
          EDIT ORDER
      ====================================================== */}

      {editingOrder && (
        <s-section
          heading="Edit Order"
        >

          <form
            onSubmit={
              handleUpdateOrder
            }
          >

            <s-stack gap="base">

              {/* Order ID */}

              <s-text-field
                label="Order ID"
                value={
                  editingOrder.id
                }
                disabled
              />


              {/* Note */}

              <s-text-field
                label="Note"
                name="note"
                placeholder="Order note"
                value={
                  editingOrder.note
                }
              />


              {/* Tags */}

              <s-text-field
                label="Tags"
                name="tags"
                placeholder="tag1, tag2"
                value={
                  editingOrder.tags
                }
              />


              {/* Buttons */}

              <s-stack
                direction="inline"
                gap="base"
              >

                <s-button
                  type="submit"
                  loading={updating}
                >
                  {updating
                    ? "Updating..."
                    : "Update Order"}
                </s-button>


                <s-button
                  type="button"
                  onClick={() =>
                    setEditingOrder(
                      null
                    )
                  }
                >
                  Cancel
                </s-button>

              </s-stack>

            </s-stack>

          </form>

        </s-section>
      )}


      {/* ======================================================
          TOTAL ORDERS
      ====================================================== */}

      <s-section>

        <s-paragraph>
          Total Orders:{" "}
          {orders.length}
        </s-paragraph>

      </s-section>


      {/* ======================================================
          ORDERS TABLE
      ====================================================== */}

      <s-section heading="Orders">

        {orders.length === 0 ? (
          <s-paragraph>
            No orders found.
          </s-paragraph>
        ) : (

          <s-table>

            {/* ------------------------------------------------
                HEADER
            ------------------------------------------------ */}

            <s-table-header-row>

              <s-table-header>
                Order
              </s-table-header>

              <s-table-header>
                Customer
              </s-table-header>

              <s-table-header>
                Financial Status
              </s-table-header>

              <s-table-header>
                Fulfillment
              </s-table-header>

              <s-table-header>
                Items
              </s-table-header>

              <s-table-header>
                Total
              </s-table-header>

              <s-table-header>
                Actions
              </s-table-header>

            </s-table-header-row>


            {/* ------------------------------------------------
                BODY
            ------------------------------------------------ */}

            <s-table-body>

              {orders.map(
                (order) => (

                  <s-table-row
                    key={
                      order.shopifyId
                    }
                  >

                    {/* Order */}

                    <s-table-cell>

                      <s-text>
                        {order.name ||
                          "-"}
                      </s-text>

                      <s-paragraph>
                        #
                        {order.orderNumber ||
                          "-"}
                      </s-paragraph>

                    </s-table-cell>


                    {/* Customer */}

                    <s-table-cell>

                      {order.customer
                        ?.displayName ||
                        "Guest"}

                    </s-table-cell>


                    {/* Financial Status */}

                    <s-table-cell>

                      {order.financialStatus ||
                        "-"}

                    </s-table-cell>


                    {/* Fulfillment */}

                    <s-table-cell>

                      {order.fulfillmentStatus ||
                        "-"}

                    </s-table-cell>


                    {/* Items */}

                    <s-table-cell>

                      {order.lineItems
                        ?.reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            (item.quantity ||
                              0),
                          0
                        ) || 0}

                    </s-table-cell>


                    {/* Total */}

                    <s-table-cell>

                      {order.currencyCode ||
                        ""}

                      {" "}

                      {order.totalPrice ||
                        "0.00"}

                    </s-table-cell>


                    {/* Actions */}

                    <s-table-cell>

                      <s-stack
                        direction="inline"
                        gap="small"
                      >

                        {/* View */}

                        <s-button
                          onClick={() =>
                            viewOrder(
                              order.shopifyId
                            )
                          }
                        >
                          View
                        </s-button>


                        {/* Edit */}

                        <s-button
                          onClick={() =>
                            startEditOrder(
                              order
                            )
                          }
                        >
                          Edit
                        </s-button>


                        {/* Cancel */}

                        <s-button
                          onClick={() =>
                            handleCancelOrder(
                              order
                            )
                          }
                          loading={
                            cancelling ===
                            order.shopifyId
                          }
                        >
                          Cancel
                        </s-button>


                        {/* Delete */}

                        <s-button
                          onClick={() =>
                            handleDeleteOrder(
                              order
                            )
                          }
                          loading={
                            deleting ===
                            order.shopifyId
                          }
                        >
                          Delete
                        </s-button>

                      </s-stack>

                    </s-table-cell>

                  </s-table-row>

                )
              )}

            </s-table-body>

          </s-table>

        )}

      </s-section>


      {/* ======================================================
          ORDER DETAILS
      ====================================================== */}

      {selectedOrder && (
        <s-section
          heading="Order Details"
        >

          <s-stack gap="base">

            <s-paragraph>
              <strong>
                Order:
              </strong>{" "}
              {selectedOrder.name}
            </s-paragraph>

            <s-paragraph>
              <strong>
                Customer:
              </strong>{" "}
              {selectedOrder.customer
                ?.displayName ||
                "Guest"}
            </s-paragraph>

            <s-paragraph>
              <strong>
                Email:
              </strong>{" "}
              {selectedOrder.customer
                ?.email ||
                "-"}
            </s-paragraph>

            <s-paragraph>
              <strong>
                Financial Status:
              </strong>{" "}
              {selectedOrder.financialStatus ||
                "-"}
            </s-paragraph>

            <s-paragraph>
              <strong>
                Fulfillment:
              </strong>{" "}
              {selectedOrder.fulfillmentStatus ||
                "-"}
            </s-paragraph>

            <s-paragraph>
              <strong>
                Total:
              </strong>{" "}
              {selectedOrder.currencyCode}{" "}
              {selectedOrder.totalPrice}
            </s-paragraph>


            {/* Line Items */}

            <s-section
              heading="Line Items"
            >

              {selectedOrder.lineItems
                ?.map(
                  (item) => (
                    <s-paragraph
                      key={
                        item.shopifyId
                      }
                    >
                      {item.title} ×{" "}
                      {item.quantity}
                    </s-paragraph>
                  )
                )}

            </s-section>


            <s-button
              onClick={() =>
                setSelectedOrder(
                  null
                )
              }
            >
              Close Details
            </s-button>

          </s-stack>

        </s-section>
      )}

    </s-page>
  );
}