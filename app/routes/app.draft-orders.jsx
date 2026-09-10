import { useEffect, useState } from "react";

export default function DraftOrders() {
    const [draftOrders, setDraftOrders] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);

    const [editingId, setEditingId] = useState("");

    const [selectedProduct, setSelectedProduct] = useState("");

    const [form, setForm] = useState({
        email: "",
        note: "",
        tags: "",
        customerId: "",
        lineItems: [],
        shippingAddress: {
            firstName: "",
            lastName: "",
            address1: "",
            city: "",
            province: "",
            country: "",
            zip: "",
            phone: "",
        },
    });

    // Load Draft Orders
    async function loadDraftOrders() {
        try {
            setLoading(true);

            const response = await fetch(
                "/api/draft-orders"
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load Draft Orders"
                );
            }

            setDraftOrders(data.data || []);
        } catch (error) {
            console.error(
                "Load Draft Orders Error:",
                error
            );

            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    // Load Products
    async function loadProducts() {
        try {
            const response = await fetch(
                "/api/products"
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to load products"
                );
            }

            setProducts(data.data || []);
        } catch (error) {
            console.error(
                "Load Products Error:",
                error
            );
        }
    }

    useEffect(() => {
        loadDraftOrders();
        loadProducts();
    }, []);

    // Form change
    function handleChange(event) {
        const { name, value } =
            event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    // Address change
    function handleAddressChange(
        event
    ) {
        const { name, value } =
            event.target;

        setForm((previous) => ({
            ...previous,

            shippingAddress: {
                ...previous.shippingAddress,
                [name]: value,
            },
        }));
    }

    // Add product
    function addProduct() {
        if (!selectedProduct) {
            alert("Please select a product");
            return;
        }

        const product = products.find(
            (item) =>
                item.shopifyId === selectedProduct
        );

        if (!product) {
            alert("Product not found");
            return;
        }

        const variant =
            product.variants?.[0];

        if (!variant) {
            alert(
                "Selected product has no variant"
            );
            return;
        }

        const existing =
            form.lineItems.find(
                (item) =>
                    item.variantId ===
                    variant.shopifyId
            );

        if (existing) {
            setForm((previous) => ({
                ...previous,

                lineItems:
                    previous.lineItems.map(
                        (item) =>
                            item.variantId ===
                                variant.shopifyId
                                ? {
                                    ...item,
                                    quantity:
                                        item.quantity + 1,
                                }
                                : item
                    ),
            }));
        } else {
            setForm((previous) => ({
                ...previous,

                lineItems: [
                    ...previous.lineItems,
                    {
                        variantId:
                            variant.shopifyId,

                        productId:
                            product.shopifyId,

                        title:
                            product.title,

                        variantTitle:
                            variant.title || "",

                        quantity: 1,

                        originalUnitPrice:
                            variant.price || "0.00",

                        sku:
                            variant.sku || "",
                    },
                ],
            }));
        }

        setSelectedProduct("");
    }

    // Update quantity
    function updateQuantity(
        index,
        quantity
    ) {
        const value = Math.max(
            1,
            Number(quantity) || 1
        );

        setForm((previous) => ({
            ...previous,

            lineItems:
                previous.lineItems.map(
                    (item, itemIndex) =>
                        itemIndex === index
                            ? {
                                ...item,
                                quantity: value,
                            }
                            : item
                ),
        }));
    }

    // Remove product
    function removeLineItem(index) {
        setForm((previous) => ({
            ...previous,

            lineItems:
                previous.lineItems.filter(
                    (_, itemIndex) =>
                        itemIndex !== index
                ),
        }));
    }

    // Reset form
    function resetForm() {
        setEditingId("");

        setForm({
            email: "",
            note: "",
            tags: "",
            customerId: "",
            lineItems: [],
            shippingAddress: {
                firstName: "",
                lastName: "",
                address1: "",
                city: "",
                province: "",
                country: "",
                zip: "",
                phone: "",
            },
        });

        setSelectedProduct("");
    }

    // Open create form
    function openCreateForm() {
        resetForm();
        setShowForm(true);
    }

    // Edit Draft Order
    function openEditForm(
        draftOrder
    ) {
        setEditingId(
            draftOrder.shopifyId
        );

        setForm({
            email:
                draftOrder.email || "",

            note:
                draftOrder.note || "",

            tags:
                draftOrder.tags?.join(", ") || "",

            customerId:
                draftOrder.customer?.id || "",

            lineItems:
                (draftOrder.lineItems || []).map(
                    (item) => ({
                        variantId:
                            item.variantId || "",

                        productId:
                            item.productId || "",

                        title:
                            item.title || "",

                        variantTitle: "",

                        quantity:
                            item.quantity || 1,

                        originalUnitPrice:
                            item.originalUnitPrice ||
                            "0.00",

                        sku:
                            item.sku || "",
                    })
                ),

            shippingAddress: {
                firstName:
                    draftOrder.shippingAddress
                        ?.firstName || "",

                lastName:
                    draftOrder.shippingAddress
                        ?.lastName || "",

                address1:
                    draftOrder.shippingAddress
                        ?.address1 || "",

                city:
                    draftOrder.shippingAddress
                        ?.city || "",

                province:
                    draftOrder.shippingAddress
                        ?.province || "",

                country:
                    draftOrder.shippingAddress
                        ?.country || "",

                zip:
                    draftOrder.shippingAddress
                        ?.zip || "",

                phone:
                    draftOrder.shippingAddress
                        ?.phone || "",
            },
        });

        setShowForm(true);
    }

    // Build Shopify DraftOrderInput
    function buildDraftOrderInput() {
        const input = {
            email:
                form.email.trim() || undefined,

            note:
                form.note.trim() || undefined,

            tags: form.tags
                ? form.tags
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                : [],

            lineItems:
                form.lineItems.map(
                    (item) => ({
                        variantId:
                            item.variantId,

                        quantity:
                            Number(item.quantity),
                    })
                ),
        };

        if (form.customerId) {
            input.customerId =
                form.customerId;
        }

        const address =
            form.shippingAddress;

        const hasAddress = Object.values(
            address
        ).some(
            (value) =>
                String(value || "").trim()
        );

        if (hasAddress) {
            input.shippingAddress = {
                firstName:
                    address.firstName || undefined,

                lastName:
                    address.lastName || undefined,

                address1:
                    address.address1 || undefined,

                city:
                    address.city || undefined,

                province:
                    address.province || undefined,

                country:
                    address.country || undefined,

                zip:
                    address.zip || undefined,

                phone:
                    address.phone || undefined,
            };
        }

        return input;
    }

    // Create / Update
    async function saveDraftOrder() {
        try {
            if (
                form.lineItems.length === 0
            ) {
                alert(
                    "Please add at least one product"
                );

                return;
            }

            setSaving(true);

            const input =
                buildDraftOrderInput();

            let response;

            if (editingId) {
                response = await fetch(
                    "/api/draft-orders",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            id: editingId,

                            draftOrder: input,
                        }),
                    }
                );
            } else {
                response = await fetch(
                    "/api/draft-orders",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            action: "create",

                            draftOrder: input,
                        }),
                    }
                );
            }

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Draft Order operation failed"
                );
            }

            alert(
                editingId
                    ? "Draft Order updated successfully"
                    : "Draft Order created successfully"
            );

            resetForm();
            setShowForm(false);

            await loadDraftOrders();
        } catch (error) {
            console.error(
                "Save Draft Order Error:",
                error
            );

            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    // Complete Draft Order
    async function completeDraftOrder(
        id
    ) {
        const confirmed =
            window.confirm(
                "Complete this Draft Order?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                "/api/draft-orders",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        action: "complete",
                        id,
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
                    "Failed to complete Draft Order"
                );
            }

            alert(
                "Draft Order completed successfully"
            );

            await loadDraftOrders();
        } catch (error) {
            console.error(
                "Complete Draft Order Error:",
                error
            );

            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    // Delete Draft Order
    async function deleteDraftOrder(
        id
    ) {
        const confirmed =
            window.confirm(
                "Delete this Draft Order?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(
                "/api/draft-orders",
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        id,
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
                    "Failed to delete Draft Order"
                );
            }

            alert(
                "Draft Order deleted successfully"
            );

            await loadDraftOrders();
        } catch (error) {
            console.error(
                "Delete Draft Order Error:",
                error
            );

            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <s-page heading="Draft Orders">
            <s-button
                slot="primary-action"
                onClick={openCreateForm}
            >
                Create Draft Order
            </s-button>

            {showForm && (
                <s-section
                    heading={
                        editingId
                            ? "Edit Draft Order"
                            : "Create Draft Order"
                    }
                >
                    <s-stack
                        direction="block"
                        gap="base"
                    >
                        <s-text-field
                            label="Email"
                            name="email"
                            value={form.email}
                            onInput={handleChange}
                            placeholder="customer@example.com"
                        />

                        <s-select
                            label="Add Product"
                            value={selectedProduct}
                            onChange={(event) =>
                                setSelectedProduct(
                                    event.target.value
                                )
                            }
                        >
                            <s-option value="">
                                Select Product
                            </s-option>

                            {products.map(
                                (product) => (
                                    <s-option
                                        key={
                                            product.shopifyId
                                        }
                                        value={
                                            product.shopifyId
                                        }
                                    >
                                        {product.title}
                                    </s-option>
                                )
                            )}
                        </s-select>

                        <s-button
                            onClick={addProduct}
                        >
                            Add Product
                        </s-button>

                        {/* Line Items */}

                        {form.lineItems.length >
                            0 && (
                                <s-section
                                    heading="Line Items"
                                >
                                    <s-stack
                                        direction="block"
                                        gap="base"
                                    >
                                        {form.lineItems.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <s-stack
                                                    key={`${item.variantId}-${index}`}
                                                    direction="inline"
                                                    gap="base"
                                                    align="center"
                                                >
                                                    <s-text>
                                                        {item.title}
                                                    </s-text>

                                                    <s-text-field
                                                        label="Quantity"
                                                        type="number"
                                                        value={String(
                                                            item.quantity
                                                        )}
                                                        onInput={(
                                                            event
                                                        ) =>
                                                            updateQuantity(
                                                                index,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />

                                                    <s-button
                                                        tone="critical"
                                                        onClick={() =>
                                                            removeLineItem(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </s-button>
                                                </s-stack>
                                            )
                                        )}
                                    </s-stack>
                                </s-section>
                            )}

                        {/* Shipping Address */}

                        <s-section
                            heading="Shipping Address"
                        >
                            <s-stack
                                direction="block"
                                gap="base"
                            >
                                <s-text-field
                                    label="First Name"
                                    name="firstName"
                                    value={
                                        form.shippingAddress
                                            .firstName
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="Last Name"
                                    name="lastName"
                                    value={
                                        form.shippingAddress
                                            .lastName
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="Address"
                                    name="address1"
                                    value={
                                        form.shippingAddress
                                            .address1
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="City"
                                    name="city"
                                    value={
                                        form.shippingAddress
                                            .city
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="Province"
                                    name="province"
                                    value={
                                        form.shippingAddress
                                            .province
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="Country"
                                    name="country"
                                    value={
                                        form.shippingAddress
                                            .country
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="ZIP"
                                    name="zip"
                                    value={
                                        form.shippingAddress
                                            .zip
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />

                                <s-text-field
                                    label="Phone"
                                    name="phone"
                                    value={
                                        form.shippingAddress
                                            .phone
                                    }
                                    onInput={
                                        handleAddressChange
                                    }
                                />
                            </s-stack>
                        </s-section>

                        {/* Note */}

                        <s-text-area
                            label="Note"
                            name="note"
                            value={form.note}
                            onInput={handleChange}
                            placeholder="Draft Order note"
                        />

                        {/* Tags */}

                        <s-text-field
                            label="Tags"
                            name="tags"
                            value={form.tags}
                            onInput={handleChange}
                            placeholder="demo, wholesale"
                        />

                        {/* Actions */}

                        <s-stack
                            direction="inline"
                            gap="base"
                        >
                            <s-button
                                variant="primary"
                                loading={saving}
                                onClick={
                                    saveDraftOrder
                                }
                            >
                                {editingId
                                    ? "Update Draft Order"
                                    : "Create Draft Order"}
                            </s-button>

                            <s-button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(false);
                                }}
                            >
                                Cancel
                            </s-button>
                        </s-stack>
                    </s-stack>
                </s-section>
            )}

            <s-section heading="Draft Orders">
                {loading ? (
                    <s-spinner />
                ) : draftOrders.length ===
                    0 ? (
                    <s-text>
                        No Draft Orders found.
                    </s-text>
                ) : (
                    <s-stack
                        direction="block"
                        gap="base"
                    >
                        {draftOrders.map(
                            (draftOrder) => (
                                <s-section
                                    key={
                                        draftOrder.shopifyId
                                    }
                                    heading={
                                        draftOrder.name ||
                                        "Draft Order"
                                    }
                                >
                                    <s-stack
                                        direction="block"
                                        gap="small"
                                    >
                                        <s-text>
                                            Status:{" "}
                                            {draftOrder.status}
                                        </s-text>

                                        <s-text>
                                            Email:{" "}
                                            {draftOrder.email ||
                                                "-"}
                                        </s-text>

                                        <s-text>
                                            Customer:{" "}
                                            {draftOrder
                                                .customer
                                                ?.displayName ||
                                                "-"}
                                        </s-text>

                                        <s-text>
                                            Items:{" "}
                                            {draftOrder
                                                .lineItems
                                                ?.length || 0}
                                        </s-text>

                                        <s-text>
                                            Total:{" "}
                                            {
                                                draftOrder.currencyCode
                                            }{" "}
                                            {
                                                draftOrder.totalPrice
                                            }
                                        </s-text>

                                        <s-text>
                                            Note:{" "}
                                            {draftOrder.note ||
                                                "-"}
                                        </s-text>

                                        {/* Line Items */}

                                        {draftOrder
                                            .lineItems
                                            ?.length > 0 && (
                                                <s-stack
                                                    direction="block"
                                                    gap="small"
                                                >
                                                    <s-text>
                                                        Products:
                                                    </s-text>

                                                    {draftOrder.lineItems.map(
                                                        (
                                                            item
                                                        ) => (
                                                            <s-text
                                                                key={
                                                                    item.shopifyId
                                                                }
                                                            >
                                                                {item.title} ×{" "}
                                                                {
                                                                    item.quantity
                                                                }{" "}
                                                                —{" "}
                                                                {
                                                                    item.originalUnitPrice
                                                                }
                                                            </s-text>
                                                        )
                                                    )}
                                                </s-stack>
                                            )}

                                        {/* Actions */}

                                        <s-stack
                                            direction="inline"
                                            gap="base"
                                        >
                                            {draftOrder.status ===
                                                "OPEN" && (
                                                    <>
                                                        <s-button
                                                            onClick={() =>
                                                                openEditForm(
                                                                    draftOrder
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </s-button>

                                                        <s-button
                                                            variant="primary"
                                                            onClick={() =>
                                                                completeDraftOrder(
                                                                    draftOrder.shopifyId
                                                                )
                                                            }
                                                        >
                                                            Complete
                                                        </s-button>

                                                        <s-button
                                                            tone="critical"
                                                            onClick={() =>
                                                                deleteDraftOrder(
                                                                    draftOrder.shopifyId
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </s-button>
                                                    </>
                                                )}
                                        </s-stack>
                                    </s-stack>
                                </s-section>
                            )
                        )}
                    </s-stack>
                )}
            </s-section>
        </s-page>
    );
}