import { useEffect, useState } from "react";

export default function Returns() {
    const [orders, setOrders] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState("");

    const [returnableFulfillments, setReturnableFulfillments] =
        useState([]);

    const [selectedItems, setSelectedItems] = useState({});

    const [returnReason, setReturnReason] =
        useState("OTHER");

    const [returnReasonNote, setReturnReasonNote] =
        useState("");

    const [returns, setReturns] = useState([]);

    const [loadingOrders, setLoadingOrders] =
        useState(true);

    const [loadingItems, setLoadingItems] =
        useState(false);

    const [loadingReturns, setLoadingReturns] =
        useState(false);

    const [creating, setCreating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    useEffect(() => {
        loadOrders();
    }, []);

    async function getJsonResponse(response) {
        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(
                data.message || "Request failed"
            );
        }

        return data;
    }

    async function loadOrders() {
        try {
            setLoadingOrders(true);
            setError("");

            const response = await fetch(
                "/api/orders"
            );

            const data =
                await getJsonResponse(response);

            const orderList =
                data.data || data.orders || [];

            setOrders(orderList);

            if (orderList.length > 0) {
                setSelectedOrderId(
                    orderList[0].shopifyId ||
                    orderList[0].id
                );
            }
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoadingOrders(false);
        }
    }

    useEffect(() => {
        if (!selectedOrderId) {
            setReturnableFulfillments([]);
            setReturns([]);
            return;
        }

        loadReturnableItems();
        loadReturns();
    }, [selectedOrderId]);

    async function loadReturnableItems() {
        try {
            setLoadingItems(true);
            setError("");
            setSelectedItems({});

            const response = await fetch(
                `/api/returns?orderId=${encodeURIComponent(
                    selectedOrderId
                )}&type=returnable`
            );

            const data =
                await getJsonResponse(response);

            setReturnableFulfillments(
                Array.isArray(data.data)
                    ? data.data
                    : []
            );
        } catch (error) {
            console.error(error);
            setError(error.message);
            setReturnableFulfillments([]);
        } finally {
            setLoadingItems(false);
        }
    }

    async function loadReturns() {
        try {
            setLoadingReturns(true);

            const response = await fetch(
                `/api/returns?orderId=${encodeURIComponent(
                    selectedOrderId
                )}`
            );

            const data =
                await getJsonResponse(response);

            setReturns(
                Array.isArray(data.data?.returns)
                    ? data.data.returns
                    : []
            );
        } catch (error) {
            console.error(error);
            setReturns([]);
        } finally {
            setLoadingReturns(false);
        }
    }

    function getAllLineItems() {
        return returnableFulfillments;
    }

    function toggleItem(item) {
        const id = item.fulfillmentLineItemId;

        setSelectedItems((previous) => {
            const updated = { ...previous };

            if (updated[id]) {
                delete updated[id];
            } else {
                updated[id] = {
                    fulfillmentLineItemId: id,
                    quantity: 1,
                    maxQuantity: item.quantity || 1,
                };
            }

            return updated;
        });
    }

    function updateQuantity(
        fulfillmentLineItemId,
        quantity
    ) {
        setSelectedItems((previous) => ({
            ...previous,
            [fulfillmentLineItemId]: {
                ...previous[fulfillmentLineItemId],
                quantity: Math.max(
                    1,
                    Number(quantity) || 1
                ),
            },
        }));
    }

    async function handleCreateReturn() {
        try {
            setCreating(true);
            setError("");
            setSuccess("");

            const selectedLineItems =
                Object.values(selectedItems);

            if (selectedLineItems.length === 0) {
                throw new Error(
                    "Select at least one item to return"
                );
            }

            for (const item of selectedLineItems) {
                if (
                    item.quantity < 1 ||
                    item.quantity > item.maxQuantity
                ) {
                    throw new Error(
                        "Return quantity is invalid"
                    );
                }
            }

            const payload = {
                action: "create",

                orderId: selectedOrderId,

                returnLineItems:
                    selectedLineItems.map((item) => ({
                        fulfillmentLineItemId:
                            item.fulfillmentLineItemId,

                        quantity: Number(item.quantity),

                        returnReason,

                        ...(returnReasonNote.trim()
                            ? {
                                returnReasonNote:
                                    returnReasonNote.trim(),
                            }
                            : {}),
                    })),
            };

            const response = await fetch(
                "/api/returns",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),
                }
            );

            const data =
                await getJsonResponse(response);

            setSuccess(
                `Return ${data.data?.name || ""
                } created successfully`
            );

            setSelectedItems({});

            setReturnReason("OTHER");
            setReturnReasonNote("");

            await loadReturnableItems();
            await loadReturns();
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setCreating(false);
        }
    }

    const selectedOrder =
        orders.find(
            (order) =>
                (order.shopifyId || order.id) ===
                selectedOrderId
        );

    const lineItems =
        getAllLineItems();

    return (
        <s-page heading="Returns">
            <s-section heading="Create Return">
                {error && (
                    <s-banner tone="critical">
                        {error}
                    </s-banner>
                )}

                {success && (
                    <s-banner tone="success">
                        {success}
                    </s-banner>
                )}

                <s-stack gap="base">
                    <s-select
                        label="Select Order"
                        value={selectedOrderId}
                        onChange={(event) =>
                            setSelectedOrderId(
                                event.currentTarget.value
                            )
                        }
                    >
                        <s-option value="">
                            Select an order
                        </s-option>

                        {orders.map((order) => {
                            const id =
                                order.shopifyId ||
                                order.id;

                            return (
                                <s-option
                                    key={id}
                                    value={id}
                                >
                                    {order.name ||
                                        `Order ${id}`}
                                </s-option>
                            );
                        })}
                    </s-select>

                    {loadingOrders && (
                        <s-text>
                            Loading orders...
                        </s-text>
                    )}

                    {selectedOrder && (
                        <s-section heading="Order Details">
                            <s-stack gap="small">
                                <s-text>
                                    Order:{" "}
                                    <strong>
                                        {selectedOrder.name ||
                                            "-"}
                                    </strong>
                                </s-text>

                                <s-text>
                                    Financial Status:{" "}
                                    {selectedOrder.financialStatus ||
                                        "-"}
                                </s-text>

                                <s-text>
                                    Fulfillment Status:{" "}
                                    {selectedOrder.fulfillmentStatus ||
                                        "-"}
                                </s-text>
                            </s-stack>
                        </s-section>
                    )}

                    <s-section heading="Returnable Items">
                        {loadingItems && (
                            <s-text>
                                Loading returnable items...
                            </s-text>
                        )}

                        {!loadingItems &&
                            lineItems.length === 0 && (
                                <s-banner tone="warning">
                                    No returnable fulfilled items
                                    found for this order.
                                </s-banner>
                            )}

                        {!loadingItems &&
                            lineItems.length > 0 && (
                                <s-stack gap="base">
                                    {lineItems.map((item) => {
                                        const id =
                                            item.fulfillmentLineItemId;

                                        const selected =
                                            Boolean(
                                                selectedItems[id]
                                            );

                                        return (
                                            <s-section
                                                key={id}
                                            >
                                                <s-stack gap="small">
                                                    <s-checkbox
                                                        checked={selected}
                                                        onChange={() =>
                                                            toggleItem(item)
                                                        }
                                                    >
                                                        {item.title ||
                                                            "Product"}
                                                    </s-checkbox>

                                                    <s-text>
                                                        SKU:{" "}
                                                        {item.sku || "-"}
                                                    </s-text>

                                                    <s-text>
                                                        Variant:{" "}
                                                        {item.variantTitle ||
                                                            "-"}
                                                    </s-text>

                                                    <s-text>
                                                        Fulfilled Quantity:{" "}
                                                        {item.quantity}
                                                    </s-text>

                                                    {item.locationName && (
                                                        <s-text>
                                                            Fulfillment Location:{" "}
                                                            {item.locationName}
                                                        </s-text>
                                                    )}

                                                    {selected && (
                                                        <s-number-field
                                                            label="Return Quantity"
                                                            value={String(
                                                                selectedItems[
                                                                    id
                                                                ].quantity
                                                            )}
                                                            min="1"
                                                            max={String(
                                                                item.quantity
                                                            )}
                                                            onChange={(event) =>
                                                                updateQuantity(
                                                                    id,
                                                                    event
                                                                        .currentTarget
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </s-stack>
                                            </s-section>
                                        );
                                    })}
                                </s-stack>
                            )}
                    </s-section>

                    <s-select
                        label="Return Reason"
                        value={returnReason}
                        onChange={(event) =>
                            setReturnReason(
                                event.currentTarget.value
                            )
                        }
                    >
                        <s-option value="DEFECTIVE">
                            Damaged
                        </s-option>

                        <s-option value="WRONG_ITEM">
                            Wrong Item
                        </s-option>

                        <s-option value="NOT_AS_DESCRIBED">
                            Not as Described
                        </s-option>

                        <s-option value="UNWANTED">
                            Changed Mind
                        </s-option>

                        <s-option value="SIZE_TOO_SMALL">
                            Too Small
                        </s-option>

                        <s-option value="SIZE_TOO_LARGE">
                            Too Large
                        </s-option>

                        <s-option value="OTHER">
                            Other
                        </s-option>
                    </s-select>

                    <s-text-field
                        label="Return Reason Note"
                        value={returnReasonNote}
                        onChange={(event) =>
                            setReturnReasonNote(
                                event.currentTarget.value
                            )
                        }
                    />

                    <s-button
                        variant="primary"
                        loading={creating}
                        onClick={handleCreateReturn}
                        disabled={
                            creating ||
                            Object.keys(selectedItems)
                                .length === 0
                        }
                    >
                        Create Return
                    </s-button>
                </s-stack>
            </s-section>

            <s-section heading="Return History">
                {loadingReturns && (
                    <s-text>
                        Loading returns...
                    </s-text>
                )}

                {!loadingReturns &&
                    returns.length === 0 && (
                        <s-text>
                            No returns found.
                        </s-text>
                    )}

                {!loadingReturns &&
                    returns.length > 0 && (
                        <s-stack gap="base">
                            {returns.map((returnItem) => (
                                <s-section
                                    key={
                                        returnItem.id ||
                                        returnItem.shopifyId
                                    }
                                >
                                    <s-stack gap="small">
                                        <s-text>
                                            <strong>
                                                {returnItem.name ||
                                                    "-"}
                                            </strong>
                                        </s-text>

                                        <s-text>
                                            Status:{" "}
                                            {returnItem.status ||
                                                "-"}
                                        </s-text>

                                        <s-text>
                                            Quantity:{" "}
                                            {returnItem.totalQuantity ||
                                                0}
                                        </s-text>

                                        <s-text>
                                            Created:{" "}
                                            {returnItem.createdAt
                                                ? new Date(
                                                    returnItem.createdAt
                                                ).toLocaleString()
                                                : "-"}
                                        </s-text>
                                    </s-stack>
                                </s-section>
                            ))}
                        </s-stack>
                    )}
            </s-section>
        </s-page>
    );
}