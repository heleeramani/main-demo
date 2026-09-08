import { authenticate } from "../shopify.server";

import {
  syncDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discount.controller";


// ============================================================
// GET /api/discounts
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


    const discountId =
      url.searchParams.get(
        "discountId"
      );


    // Get single discount
    if (discountId) {
      return getDiscountById({
        admin,
        session,
        discountId,
      });
    }


    // Sync all discounts
    return syncDiscounts({
      admin,
      session,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }


    console.error(
      "Get discounts error:",
      error
    );


    return Response.json(
      {
        success: false,

        message:
          error?.message ||
          "Failed to get discounts",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// POST /api/discounts
// CREATE DISCOUNT
// ============================================================
//
// {
//   "action": "create",
//   "discount": {
//     ...
//   }
// }
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


    console.log(
      "DISCOUNT REQUEST:",
      JSON.stringify(
        body,
        null,
        2
      )
    );


    // ========================================================
    // CREATE
    // ========================================================

    if (
      request.method === "POST" &&
      body.action === "create"
    ) {
      return createDiscount({
        admin,
        session,

        discountData:
          body.discount,
      });
    }


    // ========================================================
    // UPDATE
    // ========================================================

    if (
      request.method === "PUT"
    ) {
      return updateDiscount({
        admin,
        session,

        discountData:
          body,
      });
    }


    // ========================================================
    // DELETE
    // ========================================================

    if (
      request.method === "DELETE"
    ) {
      return deleteDiscount({
        admin,
        session,

        discountId:
          body.discountId,
      });
    }


    return Response.json(
      {
        success: false,

        message:
          "Invalid discount action",
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
      "Discount action error:",
      error
    );


    // Always return JSON.
    // This prevents:
    //
    // Unexpected token 'U'
    // ========================================================

    return Response.json(
      {
        success: false,

        message:
          error?.message ||
          "Discount action failed",
      },
      {
        status: 500,
      }
    );
  }
}