import { authenticate } from "../shopify.server";

import {
  syncOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  deleteOrder,
} from "../controllers/order.controller";


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
      request
    );

    const url =
      new URL(request.url);

    const orderId =
      url.searchParams.get(
        "orderId"
      );

    // ----------------------------------------------------------
    // GET SINGLE ORDER
    // ----------------------------------------------------------

    if (orderId) {
      return getOrderById({
        admin,
        session,
        orderId,
      });
    }

    // ----------------------------------------------------------
    // GET / SYNC ALL ORDERS
    // ----------------------------------------------------------

    return syncOrders({
      admin,
      session,
    });

  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error(
      "Orders GET error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to get orders",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// ACTION
// POST / PUT / DELETE
// ============================================================

export async function action({
  request,
}) {
  try {
    const {
      admin,
      session,
    } = await authenticate.admin(
      request
    );

    const body =
      await request.json();

    // ========================================================
    // CREATE ORDER
    // POST /api/orders
    // ========================================================

    if (
      request.method === "POST" &&
      body.action === "create"
    ) {
      return createOrder({
        admin,
        session,

        orderData:
          body.order,
      });
    }


    // ========================================================
    // CANCEL ORDER
    // POST /api/orders
    // ========================================================

    if (
      request.method === "POST" &&
      body.action === "cancel"
    ) {
      return cancelOrder({
        admin,
        session,

        orderId:
          body.orderId,

        reason:
          body.reason ||
          "OTHER",

        restock:
          body.restock ??
          true,
      });
    }


    // ========================================================
    // DELETE ORDER
    // POST /api/orders
    // ========================================================

    if (
      request.method === "POST" &&
      body.action === "delete"
    ) {
      return deleteOrder({
        admin,
        session,

        orderId:
          body.orderId,
      });
    }


    // ========================================================
    // UPDATE ORDER
    // PUT /api/orders
    // ========================================================

    if (
      request.method === "PUT"
    ) {
      return updateOrder({
        admin,
        session,

        orderData:
          body,
      });
    }


    // ========================================================
    // INVALID ACTION
    // ========================================================

    return Response.json(
      {
        success: false,

        message:
          "Invalid order action",
      },
      {
        status: 400,
      }
    );

  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error(
      "Orders action error:",
      error
    );

    return Response.json(
      {
        success: false,

        message:
          error?.message ||
          "Order action failed",
      },
      {
        status: 500,
      }
    );
  }
}