import {
    useEffect,
    useState,
} from "react";


// ============================================================
// FULFILLMENTS
// ============================================================

export default function Fulfillments() {
    // ----------------------------------------------------------
    // ORDERS
    // ----------------------------------------------------------

    const [orders, setOrders] =
        useState([]);

    const [selectedOrderId, setSelectedOrderId] =
        useState("");


    // ----------------------------------------------------------
    // FULFILLMENT ORDERS
    // ----------------------------------------------------------

    const [
        fulfillmentOrders,
        setFulfillmentOrders,
    ] = useState([]);

    const [
        selectedFulfillmentOrderId,
        setSelectedFulfillmentOrderId,
    ] = useState("");

    const [
        selectedLineItems,
        setSelectedLineItems,
    ] = useState({});


    // ----------------------------------------------------------
    // TRACKING
    // ----------------------------------------------------------

    const [trackingCompany, setTrackingCompany] =
        useState("");

    const [trackingNumber, setTrackingNumber] =
        useState("");

    const [trackingUrl, setTrackingUrl] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [notifyCustomer, setNotifyCustomer] =
        useState(false);


    // ----------------------------------------------------------
    // FULFILLMENTS LIST
    // ----------------------------------------------------------

    const [fulfillments, setFulfillments] =
        useState([]);

    const [
        editingFulfillmentId,
        setEditingFulfillmentId,
    ] = useState("");

    const [editTrackingCompany, setEditTrackingCompany] =
        useState("");

    const [editTrackingNumber, setEditTrackingNumber] =
        useState("");

    const [editTrackingUrl, setEditTrackingUrl] =
        useState("");

    const [editNotifyCustomer, setEditNotifyCustomer] =
        useState(false);

    const [savingTrackingId, setSavingTrackingId] =
        useState("");

    const [cancelingId, setCancelingId] =
        useState("");


    // ----------------------------------------------------------
    // STATES
    // ----------------------------------------------------------

    const [loadingOrders, setLoadingOrders] =
        useState(false);

    const [
        loadingFulfillmentOrders,
        setLoadingFulfillmentOrders,
    ] = useState(false);

    const [
        loadingFulfillments,
        setLoadingFulfillments,
    ] = useState(false);

    const [creating, setCreating] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ==========================================================
    // LOAD ORDERS
    // ==========================================================

    async function loadOrders() {
        try {
            setLoadingOrders(true);
            setError("");

            const response =
                await fetch(
                    "/api/orders",
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to load orders",
                );
            }

            setOrders(
                data.data || [],
            );
        } catch (error) {
            console.error(
                "Load orders error:",
                error,
            );

            setError(
                error.message,
            );
        } finally {
            setLoadingOrders(false);
        }
    }


    // ==========================================================
    // LOAD FULFILLMENT ORDERS
    // ==========================================================

    async function loadFulfillmentOrders(
        orderId,
    ) {
        if (!orderId) {
            setFulfillmentOrders([]);
            return;
        }

        try {
            setLoadingFulfillmentOrders(
                true,
            );

            setError("");

            const response =
                await fetch(
                    `/api/fulfillments?orderId=${encodeURIComponent(
                        orderId,
                    )}`,
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to load fulfillment orders",
                );
            }

            const list =
                data.data
                    ?.fulfillmentOrders ||
                [];

            setFulfillmentOrders(
                list,
            );

            if (list.length > 0) {
                setSelectedFulfillmentOrderId(
                    list[0].id,
                );
            }
        } catch (error) {
            console.error(
                "Load fulfillment orders error:",
                error,
            );

            setError(
                error.message,
            );
        } finally {
            setLoadingFulfillmentOrders(
                false,
            );
        }
    }


    // ==========================================================
    // LOAD FULFILLMENTS LIST
    // ==========================================================

    async function loadFulfillmentsList() {
        try {
            setLoadingFulfillments(true);
            setError("");

            const response =
                await fetch(
                    "/api/fulfillments",
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to load fulfillments",
                );
            }

            setFulfillments(
                data.data || [],
            );
        } catch (error) {
            console.error(
                "Load fulfillments error:",
                error,
            );

            setError(
                error.message,
            );
        } finally {
            setLoadingFulfillments(false);
        }
    }


    // ==========================================================
    // EDIT TRACKING
    // ==========================================================

    function startEditingTracking(
        fulfillment,
    ) {
        const tracking =
            fulfillment.trackingInfo?.[0] ||
            {};

        setEditingFulfillmentId(
            fulfillment.shopifyId,
        );

        setEditTrackingCompany(
            tracking.company || "",
        );

        setEditTrackingNumber(
            tracking.number || "",
        );

        setEditTrackingUrl(
            tracking.url || "",
        );

        setEditNotifyCustomer(false);
    }

    function cancelEditingTracking() {
        setEditingFulfillmentId("");

        setEditTrackingCompany("");
        setEditTrackingNumber("");
        setEditTrackingUrl("");
        setEditNotifyCustomer(false);
    }


    // ==========================================================
    // UPDATE TRACKING
    // ==========================================================

    async function handleUpdateTracking(
        fulfillmentId,
    ) {
        try {
            setError("");
            setSuccess("");

            setSavingTrackingId(
                fulfillmentId,
            );

            const response =
                await fetch(
                    "/api/fulfillments",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "update-tracking",

                                fulfillmentId,

                                tracking: {
                                    company:
                                        editTrackingCompany.trim(),

                                    number:
                                        editTrackingNumber.trim(),

                                    url:
                                        editTrackingUrl.trim(),

                                    notifyCustomer:
                                        editNotifyCustomer,
                                },
                            }),
                    },
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to update tracking",
                );
            }

            setSuccess(
                "Tracking updated successfully",
            );

            cancelEditingTracking();

            await loadFulfillmentsList();
        } catch (error) {
            console.error(
                "Update tracking error:",
                error,
            );

            setError(
                error.message,
            );
        } finally {
            setSavingTrackingId("");
        }
    }


    // ==========================================================
    // CANCEL FULFILLMENT
    // ==========================================================

    async function handleCancelFulfillment(
        fulfillmentId,
    ) {
        try {
            setError("");
            setSuccess("");

            setCancelingId(
                fulfillmentId,
            );

            const response =
                await fetch(
                    "/api/fulfillments",
                    {
                        method: "DELETE",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "cancel-fulfillment",

                                fulfillmentId,
                            }),
                    },
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to cancel fulfillment",
                );
            }

            setSuccess(
                "Fulfillment cancelled successfully",
            );

            await loadFulfillmentsList();
        } catch (error) {
            console.error(
                "Cancel fulfillment error:",
                error,
            );

            setError(
                error.message,
            );
        } finally {
            setCancelingId("");
        }
    }


    // ==========================================================
    // LOAD INITIAL DATA
    // ==========================================================

    useEffect(() => {
        loadOrders();
        loadFulfillmentsList();
    }, []);


    // ==========================================================
    // ORDER CHANGE
    // ==========================================================

    useEffect(() => {
        setSelectedFulfillmentOrderId(
            "",
        );

        setSelectedLineItems({});

        setFulfillmentOrders([]);

        if (selectedOrderId) {
            loadFulfillmentOrders(
                selectedOrderId,
            );
        }
    }, [
        selectedOrderId,
    ]);


    // ==========================================================
    // SELECTED FULFILLMENT ORDER
    // ==========================================================

    const selectedFulfillmentOrder =
        fulfillmentOrders.find(
            (item) =>
                item.id ===
                selectedFulfillmentOrderId,
        );


    // ==========================================================
    // TOGGLE LINE ITEM
    // ==========================================================

    function toggleLineItem(
        lineItem,
    ) {
        const id =
            lineItem.id;

        setSelectedLineItems(
            (current) => {
                const next = {
                    ...current,
                };

                if (next[id]) {
                    delete next[id];
                } else {
                    next[id] = {
                        id,

                        quantity:
                            lineItem.remainingQuantity,
                    };
                }

                return next;
            },
        );
    }


    // ==========================================================
    // CHANGE QUANTITY
    // ==========================================================

    function changeQuantity(
        lineItem,
        quantity,
    ) {
        const max =
            lineItem.remainingQuantity;

        let value =
            Number(quantity);

        if (Number.isNaN(value)) {
            value = 1;
        }

        value =
            Math.max(
                1,
                Math.min(
                    value,
                    max,
                ),
            );

        setSelectedLineItems(
            (current) => ({
                ...current,

                [lineItem.id]: {
                    id:
                        lineItem.id,

                    quantity:
                        value,
                },
            }),
        );
    }


    // ==========================================================
    // CREATE FULFILLMENT
    // ==========================================================

    async function handleCreateFulfillment() {
        try {
            setError("");
            setSuccess("");

            if (!selectedOrderId) {
                throw new Error(
                    "Please select an order",
                );
            }

            if (
                !selectedFulfillmentOrderId
            ) {
                throw new Error(
                    "Please select a fulfillment order",
                );
            }

            const selectedItems =
                Object.values(
                    selectedLineItems,
                );

            setCreating(true);

            const response =
                await fetch(
                    "/api/fulfillments",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "create-fulfillment",

                                fulfillment: {
                                    fulfillmentOrderId:
                                        selectedFulfillmentOrderId,

                                    lineItems:
                                        selectedItems,

                                    notifyCustomer,

                                    trackingCompany:
                                        trackingCompany.trim(),

                                    trackingNumber:
                                        trackingNumber.trim(),

                                    trackingUrl:
                                        trackingUrl.trim(),

                                    message:
                                        message.trim(),
                                },
                            }),
                    },
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to create fulfillment",
                );
            }

            setSuccess(
                "Fulfillment created successfully",
            );

            setSelectedLineItems({});

            setTrackingCompany("");
            setTrackingNumber("");
            setTrackingUrl("");
            setMessage("");
            setNotifyCustomer(false);

            await loadFulfillmentOrders(
                selectedOrderId,
            );

            await loadFulfillmentsList();
        } catch (error) {
            console.error(
                "Create fulfillment error:",
                error,
            );

            setError(
                error.message,
            );
        } finally {
            setCreating(false);
        }
    }


    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <s-page heading="Fulfillments">

            {/* ======================================================
          MESSAGES
      ====================================================== */}

            {success && (
                <s-banner tone="success">
                    {success}
                </s-banner>
            )}

            {error && (
                <s-banner tone="critical">
                    {error}
                </s-banner>
            )}


            {/* ======================================================
          ORDER
      ====================================================== */}

            <s-section heading="Order">

                <s-select
                    label="Select Order"
                    value={
                        selectedOrderId
                    }
                    onChange={(event) =>
                        setSelectedOrderId(
                            event.currentTarget.value,
                        )
                    }
                >
                    <s-option value="">
                        Select Order
                    </s-option>

                    {orders.map(
                        (order) => {
                            const id =
                                order.shopifyId ||
                                order.id;

                            return (
                                <s-option
                                    key={id}
                                    value={id}
                                >
                                    {order.name ||
                                        order.orderNumber ||
                                        id}
                                </s-option>
                            );
                        },
                    )}
                </s-select>

                {loadingOrders && (
                    <s-text>
                        Loading orders...
                    </s-text>
                )}

            </s-section>


            {/* ======================================================
          FULFILLMENT ORDERS
      ====================================================== */}

            {selectedOrderId && (
                <s-section
                    heading="Fulfillment Orders"
                >

                    {loadingFulfillmentOrders ? (
                        <s-text>
                            Loading fulfillment orders...
                        </s-text>
                    ) : fulfillmentOrders.length ===
                        0 ? (
                        <s-banner tone="info">
                            No fulfillment orders are available
                            for this order. Make sure the order
                            contains a shippable item and your app
                            has merchant-managed fulfillment-order
                            access.
                        </s-banner>
                    ) : (
                        <s-stack
                            direction="block"
                            gap="base"
                        >

                            <s-select
                                label="Select Fulfillment Order"
                                value={
                                    selectedFulfillmentOrderId
                                }
                                onChange={(event) =>
                                    setSelectedFulfillmentOrderId(
                                        event.currentTarget
                                            .value,
                                    )
                                }
                            >
                                <s-option value="">
                                    Select Fulfillment Order
                                </s-option>

                                {fulfillmentOrders.map(
                                    (
                                        fulfillmentOrder,
                                    ) => (
                                        <s-option
                                            key={
                                                fulfillmentOrder.id
                                            }
                                            value={
                                                fulfillmentOrder.id
                                            }
                                        >
                                            {fulfillmentOrder.id}
                                            {" - "}
                                            {
                                                fulfillmentOrder.status
                                            }
                                            {" - "}
                                            {
                                                fulfillmentOrder
                                                    .assignedLocation
                                                    ?.location
                                                    ?.name ||
                                                "No location"
                                            }
                                        </s-option>
                                    ),
                                )}
                            </s-select>


                            {/* ==================================================
                  FULFILLMENT ORDER DETAILS
              ================================================== */}

                            {selectedFulfillmentOrder && (
                                <s-box
                                    padding="base"
                                    border="base"
                                    borderRadius="base"
                                >

                                    <s-stack
                                        direction="block"
                                        gap="base"
                                    >

                                        <s-heading>
                                            Fulfillment Order Details
                                        </s-heading>

                                        <s-text>
                                            Status:
                                            {" "}
                                            {
                                                selectedFulfillmentOrder
                                                    .status
                                            }
                                        </s-text>

                                        <s-text>
                                            Request Status:
                                            {" "}
                                            {
                                                selectedFulfillmentOrder
                                                    .requestStatus ||
                                                "-"
                                            }
                                        </s-text>

                                        <s-text>
                                            Location:
                                            {" "}
                                            {
                                                selectedFulfillmentOrder
                                                    .assignedLocation
                                                    ?.location
                                                    ?.name ||
                                                "-"
                                            }
                                        </s-text>


                                        {/* ==========================================
                        LINE ITEMS
                    ========================================== */}

                                        <s-heading>
                                            Items
                                        </s-heading>

                                        {(
                                            selectedFulfillmentOrder
                                                .lineItems
                                                ?.nodes || []
                                        ).map(
                                            (lineItem) => {
                                                const selected =
                                                    Boolean(
                                                        selectedLineItems[
                                                        lineItem.id
                                                        ],
                                                    );

                                                return (
                                                    <s-box
                                                        key={
                                                            lineItem.id
                                                        }
                                                        padding="base"
                                                        border="base"
                                                        borderRadius="base"
                                                    >

                                                        <s-stack
                                                            direction="inline"
                                                            gap="base"
                                                        >

                                                            <s-checkbox
                                                                checked={
                                                                    selected
                                                                }
                                                                label={
                                                                    lineItem
                                                                        .productTitle ||
                                                                    lineItem
                                                                        .lineItem
                                                                        ?.title ||
                                                                    "Product"
                                                                }
                                                                onChange={() =>
                                                                    toggleLineItem(
                                                                        lineItem,
                                                                    )
                                                                }
                                                            />

                                                            <s-text>
                                                                SKU:
                                                                {" "}
                                                                {
                                                                    lineItem.sku ||
                                                                    lineItem
                                                                        .variant
                                                                        ?.sku ||
                                                                    "-"
                                                                }
                                                            </s-text>

                                                            <s-text>
                                                                Remaining:
                                                                {" "}
                                                                {
                                                                    lineItem
                                                                        .remainingQuantity
                                                                }
                                                            </s-text>

                                                            {selected && (
                                                                <s-number-field
                                                                    label="Quantity"
                                                                    min="1"
                                                                    max={String(
                                                                        lineItem
                                                                            .remainingQuantity,
                                                                    )}
                                                                    value={String(
                                                                        selectedLineItems[
                                                                            lineItem.id
                                                                        ]
                                                                            ?.quantity ||
                                                                        1,
                                                                    )}
                                                                    onInput={(
                                                                        event,
                                                                    ) =>
                                                                        changeQuantity(
                                                                            lineItem,
                                                                            event
                                                                                .currentTarget
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            )}

                                                        </s-stack>

                                                    </s-box>
                                                );
                                            },
                                        )}

                                    </s-stack>

                                </s-box>
                            )}

                        </s-stack>
                    )}

                </s-section>
            )}


            {/* ======================================================
          CREATE FULFILLMENT
      ====================================================== */}

            {selectedFulfillmentOrder && (
                <s-section
                    heading="Create Fulfillment"
                >

                    <s-stack
                        direction="block"
                        gap="base"
                    >

                        <s-text-field
                            label="Tracking Company"
                            value={
                                trackingCompany
                            }
                            onInput={(event) =>
                                setTrackingCompany(
                                    event.currentTarget
                                        .value,
                                )
                            }
                        />

                        <s-text-field
                            label="Tracking Number"
                            value={
                                trackingNumber
                            }
                            onInput={(event) =>
                                setTrackingNumber(
                                    event.currentTarget
                                        .value,
                                )
                            }
                        />

                        <s-text-field
                            label="Tracking URL"
                            value={
                                trackingUrl
                            }
                            onInput={(event) =>
                                setTrackingUrl(
                                    event.currentTarget
                                        .value,
                                )
                            }
                        />

                        <s-text-field
                            label="Message"
                            value={message}
                            onInput={(event) =>
                                setMessage(
                                    event.currentTarget
                                        .value,
                                )
                            }
                        />

                        <s-checkbox
                            label="Notify customer"
                            checked={
                                notifyCustomer
                            }
                            onChange={(event) =>
                                setNotifyCustomer(
                                    event.currentTarget
                                        .checked,
                                )
                            }
                        />

                        <s-button
                            variant="primary"
                            loading={creating}
                            onClick={
                                handleCreateFulfillment
                            }
                        >
                            Create Fulfillment
                        </s-button>

                    </s-stack>

                </s-section>
            )}


            {/* ======================================================
          ALL FULFILLMENTS
      ====================================================== */}

            <s-section heading="All Fulfillments">

                {loadingFulfillments ? (
                    <s-text>
                        Loading fulfillments...
                    </s-text>
                ) : fulfillments.length === 0 ? (
                    <s-banner tone="info">
                        No fulfillments yet. Create one above.
                    </s-banner>
                ) : (
                    <s-stack
                        direction="block"
                        gap="base"
                    >

                        {fulfillments.map(
                            (fulfillment) => {
                                const isEditing =
                                    editingFulfillmentId ===
                                    fulfillment.shopifyId;

                                const isCancelled =
                                    fulfillment.status ===
                                    "CANCELLED";

                                return (
                                    <s-box
                                        key={
                                            fulfillment.shopifyId
                                        }
                                        padding="base"
                                        border="base"
                                        borderRadius="base"
                                    >

                                        <s-stack
                                            direction="block"
                                            gap="base"
                                        >

                                            <s-text>
                                                Order:
                                                {" "}
                                                {
                                                    fulfillment.orderName ||
                                                    "-"
                                                }
                                            </s-text>

                                            <s-text>
                                                Status:
                                                {" "}
                                                {
                                                    fulfillment.displayStatus ||
                                                    fulfillment.status ||
                                                    "-"
                                                }
                                            </s-text>

                                            <s-text>
                                                Location:
                                                {" "}
                                                {
                                                    fulfillment.locationName ||
                                                    "-"
                                                }
                                            </s-text>

                                            <s-text>
                                                Tracking:
                                                {" "}
                                                {
                                                    fulfillment.trackingInfo
                                                        ?.length
                                                        ? fulfillment.trackingInfo
                                                            .map(
                                                                (tracking) =>
                                                                    [
                                                                        tracking.company,
                                                                        tracking.number,
                                                                    ]
                                                                        .filter(
                                                                            Boolean,
                                                                        )
                                                                        .join(
                                                                            " · ",
                                                                        ) ||
                                                                    "-",
                                                            )
                                                            .join(
                                                                ", ",
                                                            )
                                                        : "-"
                                                }
                                            </s-text>

                                            <s-text>
                                                Items:
                                                {" "}
                                                {
                                                    fulfillment.lineItems
                                                        ?.length || 0
                                                }
                                            </s-text>


                                            {/* ==================================
                                UPDATE TRACKING FORM
                            ================================== */}

                                            {isEditing && (
                                                <s-stack
                                                    direction="block"
                                                    gap="base"
                                                >

                                                    <s-text-field
                                                        label="Tracking Company"
                                                        value={
                                                            editTrackingCompany
                                                        }
                                                        onInput={(event) =>
                                                            setEditTrackingCompany(
                                                                event
                                                                    .currentTarget
                                                                    .value,
                                                            )
                                                        }
                                                    />

                                                    <s-text-field
                                                        label="Tracking Number"
                                                        value={
                                                            editTrackingNumber
                                                        }
                                                        onInput={(event) =>
                                                            setEditTrackingNumber(
                                                                event
                                                                    .currentTarget
                                                                    .value,
                                                            )
                                                        }
                                                    />

                                                    <s-text-field
                                                        label="Tracking URL"
                                                        value={
                                                            editTrackingUrl
                                                        }
                                                        onInput={(event) =>
                                                            setEditTrackingUrl(
                                                                event
                                                                    .currentTarget
                                                                    .value,
                                                            )
                                                        }
                                                    />

                                                    <s-checkbox
                                                        label="Notify customer"
                                                        checked={
                                                            editNotifyCustomer
                                                        }
                                                        onChange={(event) =>
                                                            setEditNotifyCustomer(
                                                                event
                                                                    .currentTarget
                                                                    .checked,
                                                            )
                                                        }
                                                    />

                                                    <s-stack
                                                        direction="inline"
                                                        gap="base"
                                                    >

                                                        <s-button
                                                            variant="primary"
                                                            loading={
                                                                savingTrackingId ===
                                                                fulfillment.shopifyId
                                                            }
                                                            onClick={() =>
                                                                handleUpdateTracking(
                                                                    fulfillment.shopifyId,
                                                                )
                                                            }
                                                        >
                                                            Save Tracking
                                                        </s-button>

                                                        <s-button
                                                            onClick={
                                                                cancelEditingTracking
                                                            }
                                                        >
                                                            Cancel
                                                        </s-button>

                                                    </s-stack>

                                                </s-stack>
                                            )}


                                            {/* ==================================
                                ROW ACTIONS
                            ================================== */}

                                            {!isEditing && (
                                                <s-stack
                                                    direction="inline"
                                                    gap="base"
                                                >

                                                    <s-button
                                                        disabled={
                                                            isCancelled
                                                        }
                                                        onClick={() =>
                                                            startEditingTracking(
                                                                fulfillment,
                                                            )
                                                        }
                                                    >
                                                        Update Tracking
                                                    </s-button>

                                                    <s-button
                                                        tone="critical"
                                                        disabled={
                                                            isCancelled
                                                        }
                                                        loading={
                                                            cancelingId ===
                                                            fulfillment.shopifyId
                                                        }
                                                        onClick={() =>
                                                            handleCancelFulfillment(
                                                                fulfillment.shopifyId,
                                                            )
                                                        }
                                                    >
                                                        Cancel Fulfillment
                                                    </s-button>

                                                </s-stack>
                                            )}

                                        </s-stack>

                                    </s-box>
                                );
                            },
                        )}

                    </s-stack>
                )}

            </s-section>

        </s-page>
    );
}