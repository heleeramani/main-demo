import { useEffect, useState } from "react";

export default function Refunds() {
    const [orders, setOrders] = useState([]);
    const [refunds, setRefunds] = useState([]);

    const [selectedOrderId, setSelectedOrderId] =
        useState("");

    const [selectedOrder, setSelectedOrder] =
        useState(null);

    const [loadingOrders, setLoadingOrders] =
        useState(true);

    const [loadingRefunds, setLoadingRefunds] =
        useState(false);

    const [creating, setCreating] =
        useState(false);

    const [selectedItems, setSelectedItems] =
        useState({});

    const [restockType, setRestockType] =
        useState("RETURN");

    const [notifyCustomer, setNotifyCustomer] =
        useState(true);

    const [note, setNote] =
        useState("");

    // -----------------------------------------
    // Load Orders
    // -----------------------------------------

    async function loadOrders() {
        try {
            setLoadingOrders(true);

            const response = await fetch(
                "/api/orders"
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load orders"
                );
            }

            const orderList =
                Array.isArray(data.data)
                    ? data.data
                    : [];

            setOrders(orderList);
        } catch (error) {
            console.error(
                "Load Orders Error:",
                error
            );

            alert(error.message);
        } finally {
            setLoadingOrders(false);
        }
    }

    // -----------------------------------------
    // Load Order
    // -----------------------------------------

    async function loadOrder(orderId) {
        if (!orderId) {
            setSelectedOrder(null);
            setRefunds([]);
            return;
        }

        try {
            setLoadingRefunds(true);

            const response = await fetch(
                `/api/orders?id=${encodeURIComponent(
                    orderId
                )}`
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load order"
                );
            }

            const order =
                data.data || null;

            setSelectedOrder(order);

            await loadRefunds(orderId);
        } catch (error) {
            console.error(
                "Load Order Error:",
                error
            );

            alert(error.message);
        } finally {
            setLoadingRefunds(false);
        }
    }

    // -----------------------------------------
    // Load Refunds
    // -----------------------------------------

    async function loadRefunds(orderId) {
        try {
            const response = await fetch(
                `/api/refunds?orderId=${encodeURIComponent(
                    orderId
                )}`
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load refunds"
                );
            }

            const refundList =
                Array.isArray(
                    data.data?.refunds
                )
                    ? data.data.refunds
                    : [];

            setRefunds(refundList);
        } catch (error) {
            console.error(
                "Load Refunds Error:",
                error
            );

            setRefunds([]);

            alert(error.message);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    // -----------------------------------------
    // Select Order
    // -----------------------------------------

    function handleOrderChange(event) {
        const orderId =
            event.target.value;

        setSelectedOrderId(orderId);

        setSelectedItems({});
        setNote("");

        loadOrder(orderId);
    }

    // -----------------------------------------
    // Toggle Item
    // -----------------------------------------

    function toggleItem(
        lineItemId,
        checked
    ) {
        setSelectedItems((previous) => {
            const updated = {
                ...previous,
            };

            if (checked) {
                updated[lineItemId] = 1;
            } else {
                delete updated[lineItemId];
            }

            return updated;
        });
    }

    // -----------------------------------------
    // Update Quantity
    // -----------------------------------------

    function updateItemQuantity(
        lineItemId,
        quantity,
        maxQuantity
    ) {
        let value =
            Number(quantity) || 1;

        value = Math.max(
            1,
            Math.min(
                value,
                maxQuantity
            )
        );

        setSelectedItems((previous) => ({
            ...previous,
            [lineItemId]: value,
        }));
    }

    // -----------------------------------------
    // Create Refund
    // -----------------------------------------

    async function createRefund() {
        if (!selectedOrderId) {
            alert(
                "Please select an order"
            );

            return;
        }

        const refundLineItems =
            Object.entries(
                selectedItems
            ).map(
                ([lineItemId, quantity]) => ({
                    lineItemId,
                    quantity: Number(quantity),
                    restockType,
                })
            );

        if (
            refundLineItems.length === 0
        ) {
            alert(
                "Please select at least one item"
            );

            return;
        }

        const confirmed =
            window.confirm(
                "Create this refund?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setCreating(true);

            const response = await fetch(
                "/api/refunds",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        refund: {
                            orderId:
                                selectedOrderId,

                            refundLineItems,

                            transactions: [],

                            notify:
                                notifyCustomer,

                            note:
                                note.trim() ||
                                undefined,
                        },
                    }),
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to create refund"
                );
            }

            alert(
                "Refund created successfully"
            );

            setSelectedItems({});
            setNote("");

            await loadRefunds(
                selectedOrderId
            );
        } catch (error) {
            console.error(
                "Create Refund Error:",
                error
            );

            alert(error.message);
        } finally {
            setCreating(false);
        }
    }

    // -----------------------------------------
    // SAFE ARRAYS
    // -----------------------------------------

    const lineItems =
        Array.isArray(
            selectedOrder?.lineItems
        )
            ? selectedOrder.lineItems
            : [];

    const refundList =
        Array.isArray(refunds)
            ? refunds
            : [];

    const selectedCount =
        Object.keys(
            selectedItems
        ).length;

    // -----------------------------------------
    // Render
    // -----------------------------------------

    return (
        <s-page heading="Refunds">

            {/* ---------------------------------- */}
            {/* SELECT ORDER                       */}
            {/* ---------------------------------- */}

            <s-section heading="Select Order">

                {loadingOrders ? (
                    <s-spinner />
                ) : (
                    <s-select
                        label="Order"
                        value={selectedOrderId}
                        onChange={
                            handleOrderChange
                        }
                    >
                        <s-option value="">
                            Select Order
                        </s-option>

                        {orders.map((order) => (
                            <s-option
                                key={
                                    order.shopifyId
                                }
                                value={
                                    order.shopifyId
                                }
                            >
                                {order.name}
                            </s-option>
                        ))}
                    </s-select>
                )}

            </s-section>


            {/* ---------------------------------- */}
            {/* SELECTED ORDER                     */}
            {/* ---------------------------------- */}

            {selectedOrder && (
                <>

                    <s-section
                        heading={`Order ${selectedOrder.name ||
                            ""
                            }`}
                    >
                        <s-stack
                            direction="block"
                            gap="small"
                        >

                            <s-text>
                                Financial Status:{" "}
                                {
                                    selectedOrder.financialStatus ||
                                    "-"
                                }
                            </s-text>

                            <s-text>
                                Fulfillment Status:{" "}
                                {
                                    selectedOrder.fulfillmentStatus ||
                                    "-"
                                }
                            </s-text>

                            <s-text>
                                Total:{" "}
                                {
                                    selectedOrder.currencyCode ||
                                    ""
                                }{" "}
                                {
                                    selectedOrder.totalPrice ||
                                    "0.00"
                                }
                            </s-text>

                        </s-stack>
                    </s-section>


                    {/* -------------------------------- */}
                    {/* REFUND ITEMS                     */}
                    {/* -------------------------------- */}

                    <s-section
                        heading="Refund Items"
                    >

                        {lineItems.length ===
                            0 ? (
                            <s-text>
                                No line items found for
                                this order.
                            </s-text>
                        ) : (
                            <s-stack
                                direction="block"
                                gap="base"
                            >

                                {lineItems.map(
                                    (item) => {
                                        const lineItemId =
                                            item.shopifyId ||
                                            item.id;

                                        const maxQuantity =
                                            Number(
                                                item.quantity ||
                                                0
                                            );

                                        const isSelected =
                                            selectedItems[
                                            lineItemId
                                            ] !== undefined;

                                        return (
                                            <s-section
                                                key={
                                                    lineItemId
                                                }
                                            >

                                                <s-stack
                                                    direction="inline"
                                                    gap="base"
                                                    align="center"
                                                >

                                                    <s-checkbox
                                                        checked={
                                                            isSelected
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            toggleItem(
                                                                lineItemId,
                                                                event
                                                                    .target
                                                                    .checked
                                                            )
                                                        }
                                                    />

                                                    <s-stack
                                                        direction="block"
                                                        gap="small"
                                                    >

                                                        <s-text>
                                                            {
                                                                item.title ||
                                                                item.name ||
                                                                "Untitled"
                                                            }
                                                        </s-text>

                                                        <s-text>
                                                            SKU:{" "}
                                                            {
                                                                item.sku ||
                                                                "-"
                                                            }
                                                        </s-text>

                                                        <s-text>
                                                            Ordered:{" "}
                                                            {
                                                                item.quantity ||
                                                                0
                                                            }
                                                        </s-text>

                                                    </s-stack>


                                                    {isSelected && (
                                                        <s-text-field
                                                            label="Refund Quantity"
                                                            type="number"
                                                            value={String(
                                                                selectedItems[
                                                                lineItemId
                                                                ]
                                                            )}
                                                            onInput={(
                                                                event
                                                            ) =>
                                                                updateItemQuantity(
                                                                    lineItemId,
                                                                    event
                                                                        .target
                                                                        .value,
                                                                    maxQuantity
                                                                )
                                                            }
                                                        />
                                                    )}

                                                </s-stack>

                                            </s-section>
                                        );
                                    }
                                )}

                            </s-stack>
                        )}

                    </s-section>


                    {/* -------------------------------- */}
                    {/* REFUND OPTIONS                   */}
                    {/* -------------------------------- */}

                    {selectedCount > 0 && (
                        <s-section
                            heading="Refund Options"
                        >

                            <s-stack
                                direction="block"
                                gap="base"
                            >

                                <s-select
                                    label="Restock Items"
                                    value={
                                        restockType
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setRestockType(
                                            event.target
                                                .value
                                        )
                                    }
                                >

                                    <s-option value="RETURN">
                                        Return to inventory
                                    </s-option>

                                    <s-option value="NO_RESTOCK">
                                        Do not restock
                                    </s-option>

                                    <s-option value="CANCEL">
                                        Cancel
                                    </s-option>

                                </s-select>


                                <s-checkbox
                                    checked={
                                        notifyCustomer
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNotifyCustomer(
                                            event.target
                                                .checked
                                        )
                                    }
                                >
                                    Notify customer
                                </s-checkbox>


                                <s-text-field
                                    label="Refund Note"
                                    value={note}
                                    onInput={(event) =>
                                        setNote(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Reason for refund"
                                />


                                <s-button
                                    variant="primary"
                                    loading={creating}
                                    onClick={
                                        createRefund
                                    }
                                >
                                    Create Refund
                                </s-button>

                            </s-stack>

                        </s-section>
                    )}


                    {/* -------------------------------- */}
                    {/* REFUND HISTORY                   */}
                    {/* -------------------------------- */}

                    <s-section
                        heading="Refund History"
                    >

                        {loadingRefunds ? (
                            <s-spinner />
                        ) : refundList.length ===
                            0 ? (
                            <s-text>
                                No refunds found for
                                this order.
                            </s-text>
                        ) : (
                            <s-stack
                                direction="block"
                                gap="base"
                            >

                                {refundList.map(
                                    (refund) => (
                                        <s-section
                                            key={
                                                refund.shopifyId ||
                                                refund.id
                                            }
                                            heading={
                                                `Refund ${refund.shopifyId ||
                                                refund.id ||
                                                ""
                                                }`
                                            }
                                        >

                                            <s-stack
                                                direction="block"
                                                gap="small"
                                            >

                                                <s-text>
                                                    Amount:{" "}
                                                    {
                                                        refund.currencyCode ||
                                                        ""
                                                    }{" "}
                                                    {
                                                        refund.totalRefunded ||
                                                        "0.00"
                                                    }
                                                </s-text>

                                                <s-text>
                                                    Note:{" "}
                                                    {
                                                        refund.note ||
                                                        "-"
                                                    }
                                                </s-text>

                                                <s-text>
                                                    Items:{" "}
                                                    {
                                                        Array.isArray(
                                                            refund.refundLineItems
                                                        )
                                                            ? refund
                                                                .refundLineItems
                                                                .length
                                                            : 0
                                                    }
                                                </s-text>

                                                <s-text>
                                                    Processed:{" "}
                                                    {refund.processedAt
                                                        ? new Date(
                                                            refund.processedAt
                                                        ).toLocaleString()
                                                        : "-"}

                                                </s-text>

                                            </s-stack>

                                        </s-section>
                                    )
                                )}

                            </s-stack>
                        )}

                    </s-section>

                </>
            )}

        </s-page>
    );
}