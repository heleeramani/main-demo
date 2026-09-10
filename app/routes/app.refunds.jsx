import { useEffect, useState } from "react";

export default function Refunds() {
    const [orders, setOrders] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [locations, setLocations] = useState([]);

    const [selectedOrderId, setSelectedOrderId] =
        useState("");

    const [selectedOrder, setSelectedOrder] =
        useState(null);

    const [selectedLocationId, setSelectedLocationId] =
        useState("");

    const [loadingOrders, setLoadingOrders] =
        useState(true);

    const [loadingOrder, setLoadingOrder] =
        useState(false);

    const [loadingRefunds, setLoadingRefunds] =
        useState(false);

    const [loadingLocations, setLoadingLocations] =
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


    // ==========================================================
    // LOAD ORDERS
    // ==========================================================

    async function loadOrders() {
        try {
            setLoadingOrders(true);

            const response = await fetch(
                "/api/orders"
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
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
                "LOAD ORDERS ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to load orders"
            );

        } finally {

            setLoadingOrders(false);

        }
    }


    // ==========================================================
    // LOAD LOCATIONS
    // ==========================================================

    async function loadLocations() {
        try {

            setLoadingLocations(true);

            const response = await fetch(
                "/api/inventory?type=locations"
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Failed to load locations"
                );
            }

            /*
             * Support the common response shapes:
             *
             * data.data
             * data.locations
             */

            const locationList =
                Array.isArray(data.data)
                    ? data.data
                    : Array.isArray(
                        data.locations
                    )
                        ? data.locations
                        : [];

            setLocations(
                locationList
            );

            // Automatically select first location
            if (
                locationList.length > 0
            ) {

                setSelectedLocationId(
                    locationList[0].id ||
                    locationList[0].shopifyId ||
                    ""
                );

            }

        } catch (error) {

            console.error(
                "LOAD LOCATIONS ERROR:",
                error
            );

            setLocations([]);

            alert(
                error.message ||
                "Failed to load locations"
            );

        } finally {

            setLoadingLocations(false);

        }
    }


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {

        loadOrders();

        loadLocations();

    }, []);


    // ==========================================================
    // LOAD SINGLE ORDER
    // ==========================================================

    async function loadOrder(orderId) {

        if (!orderId) {

            setSelectedOrder(null);
            setRefunds([]);

            return;
        }

        try {

            setLoadingOrder(true);

            const response = await fetch(
                `/api/orders?orderId=${encodeURIComponent(
                    orderId
                )}`
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Failed to load order"
                );

            }

            const order =
                data.data || null;

            setSelectedOrder(order);

            await loadRefunds(
                orderId
            );

        } catch (error) {

            console.error(
                "LOAD ORDER ERROR:",
                error
            );

            setSelectedOrder(null);
            setRefunds([]);

            alert(
                error.message ||
                "Failed to load order"
            );

        } finally {

            setLoadingOrder(false);

        }
    }


    // ==========================================================
    // LOAD REFUNDS
    // ==========================================================

    async function loadRefunds(orderId) {

        if (!orderId) {

            setRefunds([]);

            return;
        }

        try {

            setLoadingRefunds(true);

            const response = await fetch(
                `/api/refunds?orderId=${encodeURIComponent(
                    orderId
                )}`
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

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

            setRefunds(
                refundList
            );

        } catch (error) {

            console.error(
                "LOAD REFUNDS ERROR:",
                error
            );

            setRefunds([]);

            alert(
                error.message ||
                "Failed to load refunds"
            );

        } finally {

            setLoadingRefunds(false);

        }
    }


    // ==========================================================
    // ORDER CHANGE
    // ==========================================================

    function handleOrderChange(
        event
    ) {

        const orderId =
            event.target.value;

        setSelectedOrderId(
            orderId
        );

        setSelectedItems({});

        setNote("");

        loadOrder(
            orderId
        );
    }


    // ==========================================================
    // SELECT / UNSELECT ITEM
    // ==========================================================

    function toggleItem(
        lineItemId,
        checked
    ) {

        setSelectedItems(
            (previous) => {

                const updated = {
                    ...previous,
                };

                if (checked) {

                    updated[lineItemId] = 1;

                } else {

                    delete updated[
                        lineItemId
                    ];

                }

                return updated;
            }
        );
    }


    // ==========================================================
    // UPDATE QUANTITY
    // ==========================================================

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

        setSelectedItems(
            (previous) => ({
                ...previous,

                [lineItemId]:
                    value,
            })
        );
    }


    // ==========================================================
    // CREATE REFUND
    // ==========================================================

    async function createRefund() {

        if (!selectedOrderId) {

            alert(
                "Please select an order"
            );

            return;
        }


        // ------------------------------------------
        // Location required only for restocking
        // ------------------------------------------

        if (
            restockType !==
            "NO_RESTOCK" &&
            !selectedLocationId
        ) {

            alert(
                "Please select a location to restock items"
            );

            return;
        }


        const refundLineItems =
            Object.entries(
                selectedItems
            ).map(
                (
                    [
                        lineItemId,
                        quantity,
                    ]
                ) => {

                    const item = {
                        lineItemId,

                        quantity:
                            Number(quantity),

                        restockType,
                    };


                    // Shopify requires locationId
                    // when restockType is RETURN.

                    if (
                        restockType !==
                        "NO_RESTOCK"
                    ) {

                        item.locationId =
                            selectedLocationId;

                    }


                    return item;
                }
            );


        if (
            refundLineItems.length ===
            0
        ) {

            alert(
                "Please select at least one item"
            );

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to create this refund?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setCreating(true);

            console.log(
                "Creating refund:",
                {
                    orderId:
                        selectedOrderId,

                    refundLineItems,

                    notify:
                        notifyCustomer,

                    note:
                        note.trim() ||
                        undefined,
                }
            );


            const response =
                await fetch(
                    "/api/refunds",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
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


            // Reset form

            setSelectedItems({});

            setNote("");


            // Reload order + refunds

            await loadOrder(
                selectedOrderId
            );

        } catch (error) {

            console.error(
                "CREATE REFUND ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to create refund"
            );

        } finally {

            setCreating(false);

        }
    }


    // ==========================================================
    // SAFE ARRAYS
    // ==========================================================

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


    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <s-page heading="Refunds">


            {/* ==================================================== */}
            {/* SELECT ORDER                                        */}
            {/* ==================================================== */}

            <s-section
                heading="Select Order"
            >

                {loadingOrders ? (

                    <s-spinner />

                ) : (

                    <s-select
                        label="Order"
                        value={
                            selectedOrderId
                        }
                        onChange={
                            handleOrderChange
                        }
                    >

                        <s-option value="">
                            Select Order
                        </s-option>


                        {orders.map(
                            (order) => (

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

                            )
                        )}

                    </s-select>

                )}

            </s-section>


            {/* ==================================================== */}
            {/* LOADING ORDER                                       */}
            {/* ==================================================== */}

            {loadingOrder && (

                <s-section>

                    <s-spinner />

                </s-section>

            )}


            {/* ==================================================== */}
            {/* ORDER DETAILS                                       */}
            {/* ==================================================== */}

            {selectedOrder &&
                !loadingOrder && (

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
                                    Currency:{" "}
                                    {
                                        selectedOrder.currencyCode ||
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


                        {/* ================================================= */}
                        {/* REFUND ITEMS                                     */}
                        {/* ================================================= */}

                        <s-section
                            heading="Refund Items"
                        >

                            {lineItems.length ===
                                0 ? (

                                <s-text>
                                    No line items found
                                    for this order.
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
                                                item.id ||
                                                "";

                                            const maxQuantity =
                                                Number(
                                                    item.quantity ||
                                                    0
                                                );

                                            const isSelected =
                                                selectedItems[
                                                lineItemId
                                                ] !==
                                                undefined;


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
                                                                    "Untitled Product"
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
                                                                Quantity:{" "}
                                                                {
                                                                    item.quantity ||
                                                                    0
                                                                }
                                                            </s-text>


                                                            {item.variantTitle && (

                                                                <s-text>
                                                                    Variant:{" "}
                                                                    {
                                                                        item.variantTitle
                                                                    }
                                                                </s-text>

                                                            )}

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


                        {/* ================================================= */}
                        {/* REFUND OPTIONS                                   */}
                        {/* ================================================= */}

                        {selectedCount >
                            0 && (

                                <s-section
                                    heading="Refund Options"
                                >

                                    <s-stack
                                        direction="block"
                                        gap="base"
                                    >


                                        {/* ----------------------------------------- */}
                                        {/* RESTOCK TYPE                              */}
                                        {/* ----------------------------------------- */}

                                        <s-select
                                            label="Restock Items"
                                            value={
                                                restockType
                                            }
                                            onChange={(
                                                event
                                            ) => {

                                                const value =
                                                    event.target
                                                        .value;

                                                setRestockType(
                                                    value
                                                );

                                            }}
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


                                        {/* ----------------------------------------- */}
                                        {/* LOCATION                                  */}
                                        {/* ----------------------------------------- */}

                                        {restockType !==
                                            "NO_RESTOCK" && (

                                                <s-select
                                                    label="Restock Location"
                                                    value={
                                                        selectedLocationId
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        setSelectedLocationId(
                                                            event.target
                                                                .value
                                                        )
                                                    }
                                                >

                                                    <s-option value="">
                                                        Select location
                                                    </s-option>


                                                    {locations.map(
                                                        (location) => {

                                                            const locationId =
                                                                location.id ||
                                                                location.shopifyId ||
                                                                "";

                                                            const locationName =
                                                                location.name ||
                                                                location.title ||
                                                                "Location";


                                                            return (

                                                                <s-option
                                                                    key={
                                                                        locationId
                                                                    }
                                                                    value={
                                                                        locationId
                                                                    }
                                                                >
                                                                    {
                                                                        locationName
                                                                    }
                                                                </s-option>

                                                            );
                                                        }
                                                    )}

                                                </s-select>

                                            )}


                                        {loadingLocations && (

                                            <s-spinner />

                                        )}


                                        {/* ----------------------------------------- */}
                                        {/* NOTIFY CUSTOMER                           */}
                                        {/* ----------------------------------------- */}

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


                                        {/* ----------------------------------------- */}
                                        {/* NOTE                                      */}
                                        {/* ----------------------------------------- */}

                                        <s-text-field
                                            label="Refund Note"
                                            value={note}
                                            onInput={(
                                                event
                                            ) =>
                                                setNote(
                                                    event.target
                                                        .value
                                                )
                                            }
                                            placeholder="Reason for refund"
                                        />


                                        {/* ----------------------------------------- */}
                                        {/* CREATE REFUND                             */}
                                        {/* ----------------------------------------- */}

                                        <s-button
                                            variant="primary"
                                            loading={
                                                creating
                                            }
                                            onClick={
                                                createRefund
                                            }
                                        >
                                            Create Refund
                                        </s-button>

                                    </s-stack>

                                </s-section>

                            )}


                        {/* ================================================= */}
                        {/* REFUND HISTORY                                  */}
                        {/* ================================================= */}

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
                                        (refund) => {

                                            const refundId =
                                                refund.shopifyId ||
                                                refund.id ||
                                                "";

                                            const refundItems =
                                                Array.isArray(
                                                    refund.refundLineItems
                                                )
                                                    ? refund.refundLineItems
                                                    : [];


                                            return (

                                                <s-section
                                                    key={
                                                        refundId
                                                    }
                                                    heading={
                                                        `Refund ${refundId
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
                                                                refundItems.length
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


                                                        <s-text>
                                                            Created:{" "}
                                                            {refund.createdAt
                                                                ? new Date(
                                                                    refund.createdAt
                                                                ).toLocaleString()
                                                                : "-"}
                                                        </s-text>

                                                    </s-stack>

                                                </s-section>

                                            );
                                        }
                                    )}

                                </s-stack>

                            )}

                        </s-section>

                    </>

                )}

        </s-page>
    );
}