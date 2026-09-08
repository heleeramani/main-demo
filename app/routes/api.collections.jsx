// ============================================================
// COLLECTION API ROUTE
// ============================================================
// Handles all Collection API requests.
//
// GET
//    → Sync collections
//
// POST
//    → Create custom collection
//    → Create automated collection
//    → Add products to custom collection
//    → Remove products from custom collection
//
// PUT
//    → Update collection
//
// DELETE
//    → Delete collection
//
// Route:
// /api/collections
// ============================================================

import { authenticate } from "../shopify.server";

import {
  syncCollections,
  createCollection,
  updateCollection,
  addProductsToCollection,
  removeProductsFromCollection,
  deleteCollection,
} from "../controllers/collection.controller";

// ============================================================
// GET /api/collections
// ============================================================
// Shopify → MongoDB
// ============================================================

export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);

    return await syncCollections({
      admin,
      session,
    });
  } catch (error) {
    console.error("Sync collections error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================
// POST /api/collections
// ============================================================
//
// Supported actions:
//
// create
// add-products
// remove-products
// ============================================================

export async function action({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);

    const data = await request.json();

    // ========================================================
    // POST
    // ========================================================

    if (request.method === "POST") {
      // ------------------------------------------------------
      // ACTION
      // ------------------------------------------------------
      // If action is not provided, default to create.
      // ------------------------------------------------------

      const actionType = data.action || "create";

      // ======================================================
      // CREATE COLLECTION
      // ======================================================

      if (actionType === "create") {
        if (!data.title?.trim()) {
          return Response.json(
            {
              success: false,
              message: "Collection title is required",
            },
            {
              status: 400,
            },
          );
        }

        // ----------------------------------------------------
        // Validate collection type
        // ----------------------------------------------------

        const collectionType = data.collectionType || "CUSTOM";

        if (!["CUSTOM", "AUTOMATED"].includes(collectionType)) {
          return Response.json(
            {
              success: false,
              message: "Collection type must be CUSTOM or AUTOMATED",
            },
            {
              status: 400,
            },
          );
        }

        // ----------------------------------------------------
        // Automated collection validation
        // ----------------------------------------------------

        if (
          collectionType === "AUTOMATED" &&
          (!Array.isArray(data.conditions) || data.conditions.length === 0)
        ) {
          return Response.json(
            {
              success: false,
              message:
                "At least one condition is required for an automated collection",
            },
            {
              status: 400,
            },
          );
        }

        // ----------------------------------------------------
        // Create collection
        // ----------------------------------------------------

        return await createCollection({
          admin,
          session,

          collectionData: {
            title: data.title,

            descriptionHtml: data.descriptionHtml || data.description || "",

            handle: data.handle || "",

            collectionType: collectionType,

            productIds: data.productIds || [],

            conditions: data.conditions || [],

            matchType: data.matchType || "ALL",
          },
        });
      }

      // ======================================================
      // ADD PRODUCTS
      // ======================================================

      if (actionType === "add-products") {
        if (!data.collectionId) {
          return Response.json(
            {
              success: false,
              message: "Collection ID is required",
            },
            {
              status: 400,
            },
          );
        }

        if (!Array.isArray(data.productIds) || data.productIds.length === 0) {
          return Response.json(
            {
              success: false,
              message: "At least one product ID is required",
            },
            {
              status: 400,
            },
          );
        }

        return await addProductsToCollection({
          admin,
          session,

          collectionId: data.collectionId,

          productIds: data.productIds,
        });
      }

      // ======================================================
      // REMOVE PRODUCTS
      // ======================================================

      if (actionType === "remove-products") {
        if (!data.collectionId) {
          return Response.json(
            {
              success: false,
              message: "Collection ID is required",
            },
            {
              status: 400,
            },
          );
        }

        if (!Array.isArray(data.productIds) || data.productIds.length === 0) {
          return Response.json(
            {
              success: false,
              message: "At least one product ID is required",
            },
            {
              status: 400,
            },
          );
        }

        return await removeProductsFromCollection({
          admin,
          session,

          collectionId: data.collectionId,

          productIds: data.productIds,
        });
      }

      // ======================================================
      // UNKNOWN POST ACTION
      // ======================================================

      return Response.json(
        {
          success: false,
          message: "Invalid collection action",
        },
        {
          status: 400,
        },
      );
    }

    // ========================================================
    // PUT /api/collections
    // ========================================================
    // Update collection basic information.
    // ========================================================

    if (request.method === "PUT") {
      if (!data.id) {
        return Response.json(
          {
            success: false,
            message: "Collection ID is required",
          },
          {
            status: 400,
          },
        );
      }

      if (!data.title?.trim()) {
        return Response.json(
          {
            success: false,
            message: "Collection title is required",
          },
          {
            status: 400,
          },
        );
      }

      return await updateCollection({
        admin,
        session,

        collectionData: {
          id: data.id,

          title: data.title,

          descriptionHtml: data.descriptionHtml || data.description || "",

          handle: data.handle || "",
        },
      });
    }

    // ========================================================
    // DELETE /api/collections
    // ========================================================

    if (request.method === "DELETE") {
      if (!data.id) {
        return Response.json(
          {
            success: false,
            message: "Collection ID is required",
          },
          {
            status: 400,
          },
        );
      }

      return await deleteCollection({
        admin,
        session,

        collectionId: data.id,
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
      },
    );
  } catch (error) {
    console.error("Collection API error:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
