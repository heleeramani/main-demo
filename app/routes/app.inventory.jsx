import {
    useEffect,
    useMemo,
    useState,
} from "react";


// ============================================================
// INVENTORY PAGE
// ============================================================
//
// Features:
//
// 1. Sync inventory
// 2. Load locations
// 3. Increase inventory
// 4. Decrease inventory
// 5. Transfer inventory
// 6. Inventory table
//
// Uses Shopify Polaris Web Components.
//
// No @shopify/polaris React package is required.
// ============================================================

export default function InventoryPage() {

    // ==========================================================
    // INVENTORY
    // ==========================================================

    const [
        inventory,
        setInventory,
    ] = useState([]);


    // ==========================================================
    // LOCATIONS
    // ==========================================================

    const [
        locations,
        setLocations,
    ] = useState([]);


    // ==========================================================
    // LOADING
    // ==========================================================

    const [
        loading,
        setLoading,
    ] = useState(false);


    // ==========================================================
    // MESSAGES
    // ==========================================================

    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState("");


    // ==========================================================
    // ADJUST INVENTORY
    // ==========================================================

    const [
        selectedInventoryItemId,
        setSelectedInventoryItemId,
    ] = useState("");


    const [
        selectedLocationId,
        setSelectedLocationId,
    ] = useState("");


    const [
        quantity,
        setQuantity,
    ] = useState("");


    const [
        adjustLoading,
        setAdjustLoading,
    ] = useState(false);


    // ==========================================================
    // TRANSFER INVENTORY
    // ==========================================================

    const [
        transferInventoryItemId,
        setTransferInventoryItemId,
    ] = useState("");


    const [
        transferOriginLocationId,
        setTransferOriginLocationId,
    ] = useState("");


    const [
        transferDestinationLocationId,
        setTransferDestinationLocationId,
    ] = useState("");


    const [
        transferQuantity,
        setTransferQuantity,
    ] = useState("");


    const [
        transferNote,
        setTransferNote,
    ] = useState("");


    const [
        transferLoading,
        setTransferLoading,
    ] = useState(false);


    // ==========================================================
    // CLEAR MESSAGES
    // ==========================================================

    function clearMessages() {
        setError("");
        setSuccess("");
    }


    // ==========================================================
    // SAFE JSON RESPONSE
    // ==========================================================

    async function getJsonResponse(
        response
    ) {
        const text =
            await response.text();


        let result;

        try {
            result =
                JSON.parse(text);
        } catch {
            throw new Error(
                text ||
                "Invalid response received from server"
            );
        }


        if (!response.ok) {
            throw new Error(
                result.message ||
                "Request failed"
            );
        }


        return result;
    }


    // ==========================================================
    // LOAD INVENTORY
    // ==========================================================

    async function loadInventory() {
        try {

            setLoading(true);

            setError("");


            const response =
                await fetch(
                    "/api/inventory"
                );


            const result =
                await getJsonResponse(
                    response
                );


            setInventory(
                result.data || []
            );

        } catch (error) {

            console.error(
                "Load inventory error:",
                error
            );


            setError(
                error.message
            );

        } finally {

            setLoading(false);
        }
    }


    // ==========================================================
    // LOAD LOCATIONS
    // ==========================================================

    async function loadLocations() {
        try {

            setError("");


            const response =
                await fetch(
                    "/api/inventory?type=locations"
                );


            const result =
                await getJsonResponse(
                    response
                );


            setLocations(
                result.data || []
            );

        } catch (error) {

            console.error(
                "Load locations error:",
                error
            );


            setError(
                error.message
            );
        }
    }


    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {

        loadLocations();

        loadInventory();

    }, []);


    // ==========================================================
    // UNIQUE INVENTORY ITEMS
    // ==========================================================

    const inventoryItemOptions =
        useMemo(() => {

            const uniqueItems =
                new Map();


            for (
                const item
                of inventory
            ) {

                if (
                    !item.inventoryItemId
                ) {
                    continue;
                }


                if (
                    uniqueItems.has(
                        item.inventoryItemId
                    )
                ) {
                    continue;
                }


                uniqueItems.set(
                    item.inventoryItemId,
                    item
                );
            }


            return Array.from(
                uniqueItems.values()
            ).map(
                (item) => ({
                    label:
                        item.sku
                            ? `SKU: ${item.sku}`
                            : `Variant: ${item.variantId}`,

                    value:
                        item.inventoryItemId,
                })
            );

        }, [inventory]);


    // ==========================================================
    // LOCATION OPTIONS
    // ==========================================================

    const locationOptions =
        useMemo(() => {

            return locations.map(
                (location) => ({
                    label:
                        location.name,

                    value:
                        location.id,
                })
            );

        }, [locations]);


    // ==========================================================
    // TRANSFER LOCATION OPTIONS
    // ==========================================================
    //
    // A location can't transfer to itself, so each dropdown
    // excludes whatever is already selected in the other one.
    // ==========================================================

    const transferOriginOptions =
        useMemo(() => {

            return locationOptions.filter(
                (option) =>
                    option.value !==
                    transferDestinationLocationId
            );

        }, [
            locationOptions,
            transferDestinationLocationId,
        ]);


    const transferDestinationOptions =
        useMemo(() => {

            return locationOptions.filter(
                (option) =>
                    option.value !==
                    transferOriginLocationId
            );

        }, [
            locationOptions,
            transferOriginLocationId,
        ]);


    // ==========================================================
    // AVAILABLE QUANTITY AT A LOCATION
    // ==========================================================
    //
    // Looks up how much of the currently selected transfer
    // inventory item is available at a given location, so the
    // dropdown can show "(X available)" next to each option.
    // ==========================================================

    function getAvailableAtLocation(
        locationId
    ) {

        const match =
            inventory.find(
                (item) =>
                    item.inventoryItemId ===
                        transferInventoryItemId &&
                    item.locationId ===
                        locationId
            );


        return (
            match?.available ?? 0
        );
    }


    // ==========================================================
    // INCREASE INVENTORY
    // ==========================================================

    async function handleIncrease() {

        try {

            clearMessages();


            if (
                !selectedInventoryItemId
            ) {
                throw new Error(
                    "Please select an inventory item"
                );
            }


            if (
                !selectedLocationId
            ) {
                throw new Error(
                    "Please select a location"
                );
            }


            const numericQuantity =
                Number(quantity);


            if (
                !Number.isInteger(
                    numericQuantity
                ) ||
                numericQuantity <= 0
            ) {
                throw new Error(
                    "Quantity must be a positive integer"
                );
            }


            setAdjustLoading(true);


            const response =
                await fetch(
                    "/api/inventory",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "increase",

                                inventoryItemId:
                                    selectedInventoryItemId,

                                locationId:
                                    selectedLocationId,

                                quantity:
                                    numericQuantity,
                            }),
                    }
                );


            const result =
                await getJsonResponse(
                    response
                );


            setSuccess(
                result.message ||
                "Inventory increased successfully"
            );


            setQuantity("");


            await loadInventory();

        } catch (error) {

            console.error(
                "Increase inventory error:",
                error
            );


            setError(
                error.message
            );

        } finally {

            setAdjustLoading(false);
        }
    }


    // ==========================================================
    // DECREASE INVENTORY
    // ==========================================================

    async function handleDecrease() {

        try {

            clearMessages();


            if (
                !selectedInventoryItemId
            ) {
                throw new Error(
                    "Please select an inventory item"
                );
            }


            if (
                !selectedLocationId
            ) {
                throw new Error(
                    "Please select a location"
                );
            }


            const numericQuantity =
                Number(quantity);


            if (
                !Number.isInteger(
                    numericQuantity
                ) ||
                numericQuantity <= 0
            ) {
                throw new Error(
                    "Quantity must be a positive integer"
                );
            }


            setAdjustLoading(true);


            const response =
                await fetch(
                    "/api/inventory",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "decrease",

                                inventoryItemId:
                                    selectedInventoryItemId,

                                locationId:
                                    selectedLocationId,

                                quantity:
                                    numericQuantity,
                            }),
                    }
                );


            const result =
                await getJsonResponse(
                    response
                );


            setSuccess(
                result.message ||
                "Inventory decreased successfully"
            );


            setQuantity("");


            await loadInventory();

        } catch (error) {

            console.error(
                "Decrease inventory error:",
                error
            );


            setError(
                error.message
            );

        } finally {

            setAdjustLoading(false);
        }
    }


    // ==========================================================
    // TRANSFER INVENTORY
    // ==========================================================

    async function handleTransfer() {

        try {

            clearMessages();


            if (
                !transferInventoryItemId
            ) {
                throw new Error(
                    "Please select an inventory item"
                );
            }


            if (
                !transferOriginLocationId
            ) {
                throw new Error(
                    "Please select the origin location"
                );
            }


            if (
                !transferDestinationLocationId
            ) {
                throw new Error(
                    "Please select the destination location"
                );
            }


            if (
                transferOriginLocationId ===
                transferDestinationLocationId
            ) {
                throw new Error(
                    "Origin and destination locations must be different"
                );
            }


            const numericQuantity =
                Number(
                    transferQuantity
                );


            if (
                !Number.isInteger(
                    numericQuantity
                ) ||
                numericQuantity <= 0
            ) {
                throw new Error(
                    "Transfer quantity must be a positive integer"
                );
            }


            setTransferLoading(
                true
            );


            const response =
                await fetch(
                    "/api/inventory",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                action:
                                    "transfer",

                                originLocationId:
                                    transferOriginLocationId,

                                destinationLocationId:
                                    transferDestinationLocationId,

                                inventoryItemId:
                                    transferInventoryItemId,

                                quantity:
                                    numericQuantity,

                                note:
                                    transferNote || "",

                                referenceName:
                                    `DEMO-TRANSFER-${Date.now()}`,
                            }),
                    }
                );


            const result =
                await getJsonResponse(
                    response
                );


            setSuccess(
                result.message ||
                "Inventory transfer created successfully"
            );


            setTransferQuantity("");

            setTransferNote("");


            await loadInventory();

        } catch (error) {

            console.error(
                "Transfer inventory error:",
                error
            );


            setError(
                error.message
            );

        } finally {

            setTransferLoading(
                false
            );
        }
    }


    // ==========================================================
    // CLEAR ADJUST FORM
    // ==========================================================

    function clearAdjustForm() {

        setSelectedInventoryItemId(
            ""
        );

        setSelectedLocationId(
            ""
        );

        setQuantity("");
    }


    // ==========================================================
    // CLEAR TRANSFER FORM
    // ==========================================================

    function clearTransferForm() {

        setTransferInventoryItemId(
            ""
        );

        setTransferOriginLocationId(
            ""
        );

        setTransferDestinationLocationId(
            ""
        );

        setTransferQuantity(
            ""
        );

        setTransferNote(
            ""
        );
    }


    // ==========================================================
    // PAGE
    // ==========================================================

    return (
        <s-page heading="Inventory">

            {/* ====================================================
          PAGE HEADER
          ==================================================== */}

            <s-button
                slot="primary-action"
                onClick={
                    loadInventory
                }
                {...(
                    loading
                        ? { loading: true }
                        : {}
                )}
            >
                Sync Inventory
            </s-button>


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

            {success && (
                <s-banner
                    tone="success"
                    heading="Success"
                >
                    {success}
                </s-banner>
            )}


            {/* ====================================================
          LOCATIONS
          ==================================================== */}

            <s-section heading="Locations">

                <s-stack
                    direction="inline"
                    gap="base"
                    wrap
                >

                    {locations.length === 0 ? (

                        <s-paragraph>
                            No locations found.
                        </s-paragraph>

                    ) : (

                        locations.map(
                            (location) => (

                                <s-box
                                    key={
                                        location.id
                                    }

                                    border="base"

                                    borderRadius="base"

                                    padding="base"
                                >

                                    <s-stack
                                        gap="small"
                                    >

                                        <s-text>
                                            {
                                                location.name
                                            }
                                        </s-text>

                                        <s-badge tone="success">
                                            Active
                                        </s-badge>

                                    </s-stack>

                                </s-box>

                            )
                        )

                    )}

                </s-stack>

            </s-section>


            {/* ====================================================
          ADJUST INVENTORY
          ==================================================== */}

            <s-section
                heading="Adjust Inventory"
            >

                <s-stack gap="base">

                    <s-select
                        label="Inventory Item"
                        placeholder="Select inventory item"
                        value={
                            selectedInventoryItemId
                        }

                        onChange={(event) =>
                            setSelectedInventoryItemId(
                                event.currentTarget
                                    .value
                            )
                        }
                    >

                        {inventoryItemOptions.map(
                            (option) => (

                                <s-option
                                    key={
                                        option.value
                                    }

                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </s-option>

                            )
                        )}

                    </s-select>


                    <s-select
                        label="Location"
                        placeholder="Select location"
                        value={
                            selectedLocationId
                        }

                        onChange={(event) =>
                            setSelectedLocationId(
                                event.currentTarget
                                    .value
                            )
                        }
                    >

                        {locationOptions.map(
                            (option) => (

                                <s-option
                                    key={
                                        option.value
                                    }

                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </s-option>

                            )
                        )}

                    </s-select>


                    <s-number-field
                        label="Quantity"
                        value={
                            quantity
                        }

                        min="1"

                        onInput={(event) =>
                            setQuantity(
                                event.currentTarget
                                    .value
                            )
                        }
                    />


                    <s-stack
                        direction="inline"
                        gap="base"
                    >

                        <s-button
                            variant="primary"
                            onClick={
                                handleIncrease
                            }

                            {...(
                                adjustLoading
                                    ? { loading: true }
                                    : {}
                            )}
                        >
                            Increase
                        </s-button>


                        <s-button
                            onClick={
                                handleDecrease
                            }

                            {...(
                                adjustLoading
                                    ? { loading: true }
                                    : {}
                            )}
                        >
                            Decrease
                        </s-button>


                        <s-button
                            onClick={
                                clearAdjustForm
                            }
                        >
                            Cancel
                        </s-button>

                    </s-stack>

                </s-stack>

            </s-section>


            {/* ====================================================
          TRANSFER INVENTORY
          ==================================================== */}

            <s-section
                heading="Transfer Inventory"
            >

                <s-stack gap="base">

                    <s-paragraph>
                        Move inventory from one Shopify
                        location to another location.
                    </s-paragraph>

                    {locations.length < 2 && (
                        <s-banner tone="warning">
                            You need at least 2 active
                            locations to transfer inventory.
                            Add another location in Shopify
                            admin under Settings &gt; Locations.
                        </s-banner>
                    )}


                    {/* ==================================================
              INVENTORY ITEM
              ================================================== */}

                    <s-select
                        label="Inventory Item"
                        placeholder="Select inventory item"
                        value={
                            transferInventoryItemId
                        }

                        onChange={(event) =>
                            setTransferInventoryItemId(
                                event.currentTarget
                                    .value
                            )
                        }
                    >

                        {inventoryItemOptions.map(
                            (option) => (

                                <s-option
                                    key={
                                        option.value
                                    }

                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </s-option>

                            )
                        )}

                    </s-select>


                    {/* ==================================================
              FROM LOCATION
              ================================================== */}

                    <s-select
                        label="From Location"
                        placeholder="Select origin location"
                        value={
                            transferOriginLocationId
                        }

                        onChange={(event) => {

                            const value =
                                event.currentTarget
                                    .value;

                            setTransferOriginLocationId(
                                value
                            );

                            if (
                                value &&
                                value ===
                                    transferDestinationLocationId
                            ) {
                                setTransferDestinationLocationId(
                                    ""
                                );
                            }
                        }}
                    >

                        {transferOriginOptions.map(
                            (option) => (

                                <s-option
                                    key={
                                        option.value
                                    }

                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        transferInventoryItemId
                                            ? `${option.label} (${getAvailableAtLocation(option.value)} available)`
                                            : option.label
                                    }
                                </s-option>

                            )
                        )}

                    </s-select>


                    {/* ==================================================
              TO LOCATION
              ================================================== */}

                    <s-select
                        label="To Location"
                        placeholder="Select destination location"
                        value={
                            transferDestinationLocationId
                        }

                        onChange={(event) => {

                            const value =
                                event.currentTarget
                                    .value;

                            setTransferDestinationLocationId(
                                value
                            );

                            if (
                                value &&
                                value ===
                                    transferOriginLocationId
                            ) {
                                setTransferOriginLocationId(
                                    ""
                                );
                            }
                        }}
                    >

                        {transferDestinationOptions.map(
                            (option) => (

                                <s-option
                                    key={
                                        option.value
                                    }

                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        transferInventoryItemId
                                            ? `${option.label} (${getAvailableAtLocation(option.value)} available)`
                                            : option.label
                                    }
                                </s-option>

                            )
                        )}

                    </s-select>


                    {/* ==================================================
              QUANTITY
              ================================================== */}

                    <s-number-field
                        label="Quantity"
                        value={
                            transferQuantity
                        }

                        min="1"

                        onInput={(event) =>
                            setTransferQuantity(
                                event.currentTarget
                                    .value
                            )
                        }
                    />


                    {/* ==================================================
              NOTE
              ================================================== */}

                    <s-text-area
                        label="Note"
                        value={
                            transferNote
                        }

                        onInput={(event) =>
                            setTransferNote(
                                event.currentTarget
                                    .value
                            )
                        }
                    />


                    {/* ==================================================
              BUTTONS
              ================================================== */}

                    <s-stack
                        direction="inline"
                        gap="base"
                    >

                        <s-button
                            variant="primary"
                            onClick={
                                handleTransfer
                            }

                            {...(
                                locations.length < 2
                                    ? { disabled: true }
                                    : {}
                            )}

                            {...(
                                transferLoading
                                    ? { loading: true }
                                    : {}
                            )}
                        >
                            Transfer Inventory
                        </s-button>


                        <s-button
                            onClick={
                                clearTransferForm
                            }
                        >
                            Cancel
                        </s-button>

                    </s-stack>


                    {/* ==================================================
              INFORMATION
              ================================================== */}

                    <s-banner tone="info">

                        Stock moves immediately: the origin
                        location is decremented and the
                        destination location is incremented
                        right away. A destination not yet
                        tracking this item is activated
                        automatically.

                    </s-banner>

                </s-stack>

            </s-section>


            {/* ====================================================
          INVENTORY TABLE
          ==================================================== */}

            <s-section
                heading="Inventory List"
            >

                {inventory.length === 0 ? (

                    <s-paragraph>
                        No inventory found.
                        Click "Sync Inventory".
                    </s-paragraph>

                ) : (

                    <s-table
                        paginate
                        hasZebraStriping
                    >

                        <s-table-header-row>

                            <s-table-header>
                                Product
                            </s-table-header>

                            <s-table-header>
                                Variant
                            </s-table-header>

                            <s-table-header>
                                SKU
                            </s-table-header>

                            <s-table-header>
                                Location
                            </s-table-header>

                            <s-table-header>
                                Available
                            </s-table-header>

                            <s-table-header>
                                On Hand
                            </s-table-header>

                        </s-table-header-row>


                        <s-table-body>

                            {inventory.map(
                                (item) => (

                                    <s-table-row
                                        key={
                                            `${item.inventoryItemId}-${item.locationId}`
                                        }
                                    >

                                        <s-table-cell>
                                            {
                                                item.productId ||
                                                "N/A"
                                            }
                                        </s-table-cell>


                                        <s-table-cell>
                                            {
                                                item.variantId ||
                                                "N/A"
                                            }
                                        </s-table-cell>


                                        <s-table-cell>
                                            {
                                                item.sku ||
                                                "N/A"
                                            }
                                        </s-table-cell>


                                        <s-table-cell>
                                            {
                                                item.locationName ||
                                                "N/A"
                                            }
                                        </s-table-cell>


                                        <s-table-cell>
                                            {
                                                item.available ??
                                                0
                                            }
                                        </s-table-cell>


                                        <s-table-cell>
                                            {
                                                item.onHand ??
                                                0
                                            }
                                        </s-table-cell>

                                    </s-table-row>

                                )
                            )}

                        </s-table-body>

                    </s-table>

                )}

            </s-section>


            {/* ====================================================
          SUMMARY
          ==================================================== */}

            <s-section heading="Summary">

                <s-stack
                    direction="inline"
                    gap="large"
                >

                    <s-box
                        border="base"
                        borderRadius="base"
                        padding="base"
                    >

                        <s-stack gap="small">

                            <s-text>
                                Locations
                            </s-text>

                            <s-heading>
                                {
                                    locations.length
                                }
                            </s-heading>

                        </s-stack>

                    </s-box>


                    <s-box
                        border="base"
                        borderRadius="base"
                        padding="base"
                    >

                        <s-stack gap="small">

                            <s-text>
                                Inventory Records
                            </s-text>

                            <s-heading>
                                {
                                    inventory.length
                                }
                            </s-heading>

                        </s-stack>

                    </s-box>

                </s-stack>

            </s-section>

        </s-page>
    );
}