import { authenticate } from "../shopify.server";

import {
  listProducts,
  syncProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  startBulkProductSync,
  checkBulkProductStatus,
  syncBulkProductResults,
} from "../controllers/product.controller";

/**
 * GET /api/products
 *
 * /api/products                 - sync all products (existing)
 * /api/products?source=db       - list every synced product straight from MongoDB (no cap, no Shopify call)
 * /api/products?bulk=start      - start a bulk product query
 * /api/products?bulk=status     - check the current bulk operation
 * /api/products?bulk=sync       - download + sync a completed bulk operation
 */
export async function loader({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const url = new URL(request.url);

    const source =
      url.searchParams.get("source");

    if (source === "db") {
      return listProducts({
        session,
      });
    }

    const bulk =
      url.searchParams.get("bulk");

    if (bulk === "start") {
      return startBulkProductSync({
        admin,
      });
    }

    if (bulk === "status") {
      return checkBulkProductStatus({
        admin,
      });
    }

    if (bulk === "sync") {
      return syncBulkProductResults({
        admin,
        session,
      });
    }

    return syncProducts({
      admin,
      session,
    });
  } catch (error) {
    console.error("Products GET error:", error);

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

export async function action({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const productData = await request.json();

    if (request.method === "POST") {
      return createProduct({
        admin,
        session,
        productData,
      });
    }

    if (request.method === "PUT") {
      return updateProduct({
        admin,
        session,
        productData,
      });
    }

    if (request.method === "DELETE") {
      return deleteProduct({
        admin,
        session,
        productId: productData.id,
      });
    }

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
    console.error("Product API error:", error);

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
