import { authenticate } from "../shopify.server";

import {
  syncProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";

export async function loader({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    return syncProducts({
      admin,
      session,
    });
  } catch (error) {
    console.error("Sync products error:", error);

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
