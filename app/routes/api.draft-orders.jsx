import { authenticate } from "../shopify.server";

import {
    getDraftOrdersController,
    getDraftOrderByIdController,
    createDraftOrderController,
    updateDraftOrderController,
    completeDraftOrderController,
    deleteDraftOrderController,
} from "../controllers/draftOrder.controller";


// GET /api/draft-orders
// GET /api/draft-orders?id=gid://shopify/DraftOrder/...
// If id is provided → get single Draft Order
// Otherwise → get all Draft Orders
export async function loader({ request }) {
    try {
        const { admin, session } =
            await authenticate.admin(request);

        const url = new URL(request.url);

        const draftOrderId =
            url.searchParams.get("id");

        if (draftOrderId) {
            const draftOrder =
                await getDraftOrderByIdController(
                    admin,
                    session.shop,
                    draftOrderId
                );

            return Response.json({
                success: true,
                data: draftOrder,
            });
        }

        const draftOrders =
            await getDraftOrdersController(
                admin,
                session.shop
            );

        return Response.json({
            success: true,
            data: draftOrders,
        });
    } catch (error) {
        console.error(
            "GET DRAFT ORDERS ERROR:",
            error
        );

        return Response.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Failed to fetch Draft Orders",
            },
            {
                status: 500,
            }
        );
    }
}


// POST
// Create Draft Order
// body:
// {
//   "action": "create",
//   "draftOrder": { ... }
// }
//
// Complete Draft Order
//
// body:
// {
//   "action": "complete",
//   "id": "gid://shopify/DraftOrder/..."
// }
export async function action({ request }) {
    try {
        const { admin, session } =
            await authenticate.admin(request);

        const method =
            request.method.toUpperCase();

        const body =
            await request.json();

        // CREATE
        if (
            method === "POST" &&
            (!body.action ||
                body.action === "create")
        ) {
            const draftOrderData =
                body.draftOrder || body;

            const draftOrder =
                await createDraftOrderController(
                    admin,
                    session.shop,
                    draftOrderData
                );

            return Response.json({
                success: true,
                message:
                    "Draft Order created successfully",
                data: draftOrder,
            });
        }


        // COMPLETE
        if (
            method === "POST" &&
            body.action === "complete"
        ) {
            if (!body.id) {
                return Response.json(
                    {
                        success: false,
                        message:
                            "Draft Order ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const draftOrder =
                await completeDraftOrderController(
                    admin,
                    session.shop,
                    body.id
                );

            return Response.json({
                success: true,
                message:
                    "Draft Order completed successfully",
                data: draftOrder,
            });
        }


        // UPDATE

        if (method === "PUT") {
            const draftOrderId =
                body.id ||
                body.draftOrderId;

            if (!draftOrderId) {
                return Response.json(
                    {
                        success: false,
                        message:
                            "Draft Order ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const draftOrderData =
                body.draftOrder || body.input || body;

            const draftOrder =
                await updateDraftOrderController(
                    admin,
                    session.shop,
                    draftOrderId,
                    draftOrderData
                );

            return Response.json({
                success: true,
                message:
                    "Draft Order updated successfully",
                data: draftOrder,
            });
        }


        // DELETE

        if (method === "DELETE") {
            const draftOrderId =
                body.id ||
                body.draftOrderId;

            if (!draftOrderId) {
                return Response.json(
                    {
                        success: false,
                        message:
                            "Draft Order ID is required",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const result =
                await deleteDraftOrderController(
                    admin,
                    session.shop,
                    draftOrderId
                );

            return Response.json({
                success: true,
                message:
                    "Draft Order deleted successfully",
                data: result,
            });
        }


        // Unsupported method/action
        return Response.json(
            {
                success: false,
                message:
                    "Unsupported Draft Order action",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "DRAFT ORDER API ERROR:",
            error
        );

        return Response.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Draft Order operation failed",
            },
            {
                status: 500,
            }
        );
    }
}