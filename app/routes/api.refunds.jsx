import { authenticate } from "../shopify.server";

import {
    getOrderRefundsController,
    getRefundByIdController,
    createRefundController,
} from "../controllers/refund.controller";


// ---------------------------------------------
// GET
// ---------------------------------------------
// GET /api/refunds?orderId=...
// GET /api/refunds?refundId=...
// ---------------------------------------------
export async function loader({ request }) {
    try {
        const { admin, session } =
            await authenticate.admin(request);

        const url = new URL(request.url);

        const orderId =
            url.searchParams.get("orderId");

        const refundId =
            url.searchParams.get("refundId");

        // Get single refund
        if (refundId) {
            const refund =
                await getRefundByIdController(
                    admin,
                    session.shop,
                    refundId
                );

            return Response.json({
                success: true,
                data: refund,
            });
        }


        // Get refunds for order
        if (orderId) {
            const result =
                await getOrderRefundsController(
                    admin,
                    session.shop,
                    orderId
                );

            return Response.json({
                success: true,
                data: result,
            });
        }


        return Response.json(
            {
                success: false,
                message:
                    "Order ID or Refund ID is required",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "GET REFUNDS ERROR:",
            error
        );

        return Response.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Failed to fetch refunds",
            },
            {
                status: 500,
            }
        );
    }
}


// Create Refund
//
// {
//   "orderId": "gid://shopify/Order/123",
//   "refundLineItems": [...],
//   "transactions": [...],
//   "notify": true,
//   "note": "Customer requested refund"
// }
export async function action({
    request,
}) {
    try {
        const { admin, session } =
            await authenticate.admin(request);

        const method =
            request.method.toUpperCase();

        if (method !== "POST") {
            return Response.json(
                {
                    success: false,
                    message:
                        "Only POST method is supported",
                },
                {
                    status: 405,
                }
            );
        }

        const body =
            await request.json();

        const refundData =
            body.refund || body;


        if (!refundData.orderId) {
            return Response.json(
                {
                    success: false,
                    message:
                        "Order ID is required",
                },
                {
                    status: 400,
                }
            );
        }


        const refund =
            await createRefundController(
                admin,
                session.shop,
                refundData
            );


        return Response.json({
            success: true,
            message:
                "Refund created successfully",
            data: refund,
        });
    } catch (error) {
        console.error(
            "REFUND API ERROR:",
            error
        );

        return Response.json(
            {
                success: false,
                message:
                    error?.message ||
                    "Refund operation failed",
            },
            {
                status: 500,
            }
        );
    }
}