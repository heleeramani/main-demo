import { authenticate } from "../shopify.server";

import {
    getReturnableFulfillmentsController,
    getOrderReturnsController,
    getReturnByIdController,
    createReturnController,
    processReturnController,
} from "../controllers/return.controller";

/**
 * GET /api/returns
 *
 * Supported:
 *
 * /api/returns?orderId=...
 * /api/returns?returnId=...
 * /api/returns?orderId=...&type=returnable
 */
export async function loader({ request }) {
    try {
        const { admin, session } =
            await authenticate.admin(request);

        const url = new URL(request.url);

        const orderId =
            url.searchParams.get("orderId");

        const returnId =
            url.searchParams.get("returnId");

        const type =
            url.searchParams.get("type");

        /**
         * Get returnable fulfillment items.
         */
        if (
            type === "returnable" &&
            orderId
        ) {
            const data =
                await getReturnableFulfillmentsController({
                    admin,
                    orderId,
                });

            return Response.json({
                success: true,
                data,
            });
        }

        /**
         * Get single return.
         */
        if (returnId) {
            const data =
                await getReturnByIdController({
                    admin,
                    session,
                    returnId,
                });

            return Response.json({
                success: true,
                data,
            });
        }

        /**
         * Get all returns for an order.
         */
        if (orderId) {
            const data =
                await getOrderReturnsController({
                    admin,
                    session,
                    orderId,
                });

            return Response.json({
                success: true,
                data,
            });
        }

        return Response.json(
            {
                success: false,
                message:
                    "orderId or returnId is required",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "GET /api/returns error:",
            error
        );

        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "Failed to fetch returns",
            },
            {
                status: 500,
            }
        );
    }
}

/**
 * POST /api/returns
 *
 * Create or process a return.
 *
 * Body:
 *
 * {
 *   action: "create",
 *   orderId: "...",
 *   returnLineItems: [...]
 * }
 *
 * OR
 *
 * {
 *   action: "process",
 *   returnId: "...",
 *   ...
 * }
 */
export async function action({ request }) {
    try {
        const { admin, session } =
            await authenticate.admin(request);

        const body = await request.json();

        const actionType =
            body.action || "create";

        /**
         * CREATE RETURN
         */
        if (actionType === "create") {
            const {
                orderId,
                returnLineItems,
                requestedAt,
                returnShippingFee,
                exchangeLineItems,
            } = body;

            const data =
                await createReturnController({
                    admin,
                    session,

                    returnData: {
                        orderId,
                        returnLineItems,
                        requestedAt,
                        returnShippingFee,
                        exchangeLineItems,
                    },
                });

            return Response.json({
                success: true,
                message: "Return created successfully",
                data,
            });
        }

        /**
         * PROCESS RETURN
         */
        if (actionType === "process") {
            const {
                returnId,
                returnLineItems,
                refund,
                exchangeLineItems,
                reverseFulfillmentOrder,
            } = body;

            const data =
                await processReturnController({
                    admin,
                    session,

                    processInput: {
                        returnId,
                        returnLineItems,
                        refund,
                        exchangeLineItems,
                        reverseFulfillmentOrder,
                    },
                });

            return Response.json({
                success: true,
                message:
                    "Return processed successfully",
                data,
            });
        }

        return Response.json(
            {
                success: false,
                message:
                    "Invalid action. Use 'create' or 'process'.",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "POST /api/returns error:",
            error
        );

        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "Failed to process return",
            },
            {
                status: 500,
            }
        );
    }
}