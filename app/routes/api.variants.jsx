import { authenticate } from "../shopify.server";

import {
  syncProductVariants,
  createProductVariants,
  updateProductVariants,
  deleteProductVariants,
} from "../controllers/variant.controller";


// ============================================================
// GET /api/variants
// ============================================================
// Sync variants of a product from Shopify → MongoDB
//
// Example:
// /api/variants?productId=gid://shopify/Product/123
// ============================================================

export async function loader({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const url = new URL(request.url);

    const productId =
      url.searchParams.get("productId");

    if (!productId) {
      return Response.json(
        {
          success: false,
          message: "productId is required",
        },
        {
          status: 400,
        }
      );
    }

    return await syncProductVariants({
      admin,
      session,
      productId,
    });
  } catch (error) {
    console.error(
      "Sync variants error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// POST / PUT / DELETE /api/variants
// ============================================================

export async function action({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const data = await request.json();

    // ========================================================
    // CREATE
    // ========================================================

    if (request.method === "POST") {
      if (!data.productId) {
        return Response.json(
          {
            success: false,
            message: "productId is required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Array.isArray(data.variants) ||
        data.variants.length === 0
      ) {
        return Response.json(
          {
            success: false,
            message: "variants are required",
          },
          {
            status: 400,
          }
        );
      }

      return await createProductVariants({
        admin,
        session,
        productId: data.productId,
        variants: data.variants,
      });
    }


    // ========================================================
    // UPDATE
    // ========================================================

    if (request.method === "PUT") {
      if (!data.productId) {
        return Response.json(
          {
            success: false,
            message: "productId is required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Array.isArray(data.variants) ||
        data.variants.length === 0
      ) {
        return Response.json(
          {
            success: false,
            message: "variants are required",
          },
          {
            status: 400,
          }
        );
      }

      return await updateProductVariants({
        admin,
        session,
        productId: data.productId,
        variants: data.variants,
      });
    }


    // ========================================================
    // DELETE
    // ========================================================

    if (request.method === "DELETE") {
      if (!data.productId) {
        return Response.json(
          {
            success: false,
            message: "productId is required",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Array.isArray(data.variantsIds) ||
        data.variantsIds.length === 0
      ) {
        return Response.json(
          {
            success: false,
            message: "variantsIds are required",
          },
          {
            status: 400,
          }
        );
      }

      return await deleteProductVariants({
        admin,
        session,
        productId: data.productId,
        variantsIds: data.variantsIds,
      });
    }


    // ========================================================
    // METHOD NOT ALLOWED
    // ========================================================

    return Response.json(
      {
        success: false,
        message: "Method not allowed",
      },
      {
        status: 405,
      }
    );

  } catch (error) {
    console.error(
      "Variant API error:",
      error
    );

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}