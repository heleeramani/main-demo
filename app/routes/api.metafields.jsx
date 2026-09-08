import { authenticate } from "../shopify.server";

import {
  getMetafieldsController,
  getDefinitionsController,
  setMetafieldController,
  deleteMetafieldController,
} from "../controllers/metafield.controller";

// ============================================================
// GET
// ============================================================

export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);

    const url = new URL(request.url);

    const ownerId = url.searchParams.get("ownerId");

    const ownerType = url.searchParams.get("ownerType") || "PRODUCT";

    const definitions = url.searchParams.get("definitions");

    // --------------------------------------------------------
    // GET DEFINITIONS
    // --------------------------------------------------------

    if (definitions === "true") {
      return getDefinitionsController({
        admin,
        ownerType,
      });
    }

    // --------------------------------------------------------
    // GET METAFIELDS
    // --------------------------------------------------------

    return getMetafieldsController({
      admin,
      session,
      ownerId,
      ownerType,
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("Metafield GET error:", error);

    return Response.json(
      {
        success: false,
        message: error?.message || "Failed to get metafields",
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function action({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);

    const body = await request.json();

    console.log("========================================");

    console.log("METAFIELD API ACTION");

    console.log("Method:", request.method);

    console.log("Shop:", session.shop);

    console.log("Body:", JSON.stringify(body, null, 2));

    console.log("========================================");

    // --------------------------------------------------------
    // CREATE / UPDATE
    // --------------------------------------------------------

    if (request.method === "POST" || request.method === "PUT") {
      return setMetafieldController({
        admin,
        session,
        metafieldData: body.metafield || body,
      });
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    if (request.method === "DELETE") {
      return deleteMetafieldController({
        admin,
        session,
        ownerId: body.ownerId,
        namespace: body.namespace,
        key: body.key,
      });
    }

    return Response.json(
      {
        success: false,
        message: "Invalid metafield action",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }

    console.error("Metafield action error:", error);

    return Response.json(
      {
        success: false,
        message: error?.message || "Metafield action failed",
      },
      {
        status: 500,
      },
    );
  }
}
