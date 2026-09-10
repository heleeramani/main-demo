import { authenticate } from "../shopify.server";

import {
    listFulfillmentsController,
    getOrderFulfillmentOrdersController,
    getFulfillmentOrderController,
    getFulfillmentController,
    createFulfillmentController,
    updateFulfillmentTrackingController,
    cancelFulfillmentController,
} from "../controllers/fulfillment.controller";


// ============================================================
// GET
// ============================================================

export async function loader({
    request,
}) {
    try {
        const {
            admin,
            session,
        } = await authenticate.admin(
            request,
        );

        const url =
            new URL(request.url);

        const orderId =
            url.searchParams.get(
                "orderId",
            );

        const fulfillmentOrderId =
            url.searchParams.get(
                "fulfillmentOrderId",
            );

        const fulfillmentId =
            url.searchParams.get(
                "fulfillmentId",
            );


        // --------------------------------------------------------
        // SINGLE FULFILLMENT
        // --------------------------------------------------------

        if (fulfillmentId) {
            const fulfillment =
                await getFulfillmentController({
                    admin,

                    shop:
                        session.shop,

                    fulfillmentId,
                });

            return Response.json({
                success: true,

                data: fulfillment,
            });
        }


        // --------------------------------------------------------
        // SINGLE FULFILLMENT ORDER
        // --------------------------------------------------------

        if (fulfillmentOrderId) {
            const fulfillmentOrder =
                await getFulfillmentOrderController({
                    admin,

                    fulfillmentOrderId,
                });

            return Response.json({
                success: true,

                data: fulfillmentOrder,
            });
        }


        // --------------------------------------------------------
        // ORDER FULFILLMENT ORDERS
        // --------------------------------------------------------

        if (orderId) {
            const data =
                await getOrderFulfillmentOrdersController({
                    admin,

                    orderId,
                });

            return Response.json({
                success: true,

                data,
            });
        }


        // --------------------------------------------------------
        // LIST ALL FULFILLMENTS
        // --------------------------------------------------------

        const fulfillments =
            await listFulfillmentsController({
                shop:
                    session.shop,
            });

        return Response.json({
            success: true,

            data: fulfillments,
        });
    } catch (error) {
        console.error(
            "Fulfillment loader error:",
            error,
        );

        return Response.json(
            {
                success: false,

                message:
                    error?.message ||
                    "Failed to fetch fulfillment data",
            },

            {
                status: 500,
            },
        );
    }
}


// ============================================================
// ACTION
// ============================================================

export async function action({
    request,
}) {
    try {
        const {
            admin,
            session,
        } = await authenticate.admin(
            request,
        );

        const body =
            await request.json();

        const action =
            body.action;


        // ========================================================
        // CREATE
        // ========================================================

        if (
            request.method === "POST" &&
            action ===
            "create-fulfillment"
        ) {
            const fulfillment =
                await createFulfillmentController({
                    admin,

                    shop:
                        session.shop,

                    fulfillmentData:
                        body.fulfillment,
                });

            return Response.json({
                success: true,

                message:
                    "Fulfillment created successfully",

                data: fulfillment,
            });
        }


        // ========================================================
        // UPDATE TRACKING
        // ========================================================

        if (
            request.method === "PUT" &&
            action ===
            "update-tracking"
        ) {
            const fulfillment =
                await updateFulfillmentTrackingController({
                    admin,

                    shop:
                        session.shop,

                    fulfillmentId:
                        body.fulfillmentId,

                    trackingData:
                        body.tracking || {},
                });

            return Response.json({
                success: true,

                message:
                    "Tracking updated successfully",

                data: fulfillment,
            });
        }


        // ========================================================
        // CANCEL
        // ========================================================

        if (
            request.method === "DELETE" &&
            action ===
            "cancel-fulfillment"
        ) {
            const fulfillment =
                await cancelFulfillmentController({
                    admin,

                    shop:
                        session.shop,

                    fulfillmentId:
                        body.fulfillmentId,
                });

            return Response.json({
                success: true,

                message:
                    "Fulfillment cancelled successfully",

                data: fulfillment,
            });
        }


        return Response.json(
            {
                success: false,

                message:
                    "Invalid fulfillment action",
            },

            {
                status: 400,
            },
        );
    } catch (error) {
        console.error(
            "Fulfillment action error:",
            error,
        );

        return Response.json(
            {
                success: false,

                message:
                    error?.message ||
                    "Fulfillment operation failed",
            },

            {
                status: 500,
            },
        );
    }
}