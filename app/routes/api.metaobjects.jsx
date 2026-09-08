import { authenticate } from "../shopify.server";

import {
  getMetaobjectDefinitionsController,
  createMetaobjectDefinitionController,
  getProductMetaobjectsController,
  createProductMetaobjectController,
  updateProductMetaobjectController,
  deleteProductMetaobjectController,
} from "../controllers/metaobject.controller";


// ============================================================
// GET
// ============================================================
//
// GET /api/metaobjects?definitions=true
//
// GET /api/metaobjects?productId=gid://shopify/Product/123
//
// ============================================================

export async function loader({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const url =
      new URL(request.url);

    const definitions =
      url.searchParams.get(
        "definitions",
      );

    const productId =
      url.searchParams.get(
        "productId",
      );


    // ========================================================
    // GET DEFINITIONS
    // ========================================================

    if (definitions === "true") {
      const data =
        await getMetaobjectDefinitionsController({
          admin,
          shop: session.shop,
        });

      return Response.json({
        success: true,
        data,
        count: data.length,
      });
    }


    // ========================================================
    // GET PRODUCT METAOBJECTS
    // ========================================================

    if (productId) {
      const data =
        await getProductMetaobjectsController({
          admin,
          shop: session.shop,
          productId,
        });

      return Response.json({
        success: true,
        data,
        count: data.length,
      });
    }


    return Response.json(
      {
        success: false,
        message:
          "Provide definitions=true or productId",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "Metaobject GET error:",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to fetch metaobjects",
      },
      {
        status: 500,
      },
    );
  }
}


// ============================================================
// POST / PUT / DELETE
// ============================================================

export async function action({
  request,
}) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const body =
      await request.json();

    const method =
      request.method;


    // ========================================================
    // CREATE
    // ========================================================

    if (method === "POST") {

      // ------------------------------------------------------
      // CREATE DEFINITION
      // ------------------------------------------------------

      if (
        body.action ===
        "create-definition"
      ) {
        const definition =
          await createMetaobjectDefinitionController({
            admin,
            shop: session.shop,
            definitionData:
              body.definition,
          });

        return Response.json({
          success: true,
          message:
            "Metaobject definition created successfully",
          data: definition,
        });
      }


      // ------------------------------------------------------
      // CREATE PRODUCT METAOBJECT
      // ------------------------------------------------------

      if (
        body.action ===
        "create-product-metaobject"
      ) {
        const metaobject =
          await createProductMetaobjectController({
            admin,

            shop:
              session.shop,

            productId:
              body.productId,

            productTitle:
              body.productTitle || "",

            definitionId:
              body.definitionId,

            metaobjectData:
              body.metaobject,
          });

        return Response.json({
          success: true,
          message:
            "Product metaobject created and linked successfully",
          data: metaobject,
        });
      }


      return Response.json(
        {
          success: false,
          message:
            "Invalid POST action",
        },
        {
          status: 400,
        },
      );
    }


    // ========================================================
    // UPDATE
    // ========================================================

    if (method === "PUT") {
      if (
        body.action !==
        "update-product-metaobject"
      ) {
        return Response.json(
          {
            success: false,
            message:
              "Invalid PUT action",
          },
          {
            status: 400,
          },
        );
      }

      if (!body.metaobjectId) {
        return Response.json(
          {
            success: false,
            message:
              "Metaobject ID is required",
          },
          {
            status: 400,
          },
        );
      }

      const metaobject =
        await updateProductMetaobjectController({
          admin,

          shop:
            session.shop,

          productId:
            body.productId,

          metaobjectId:
            body.metaobjectId,

          metaobjectData:
            body.metaobject,
        });

      return Response.json({
        success: true,
        message:
          "Product metaobject updated successfully",
        data: metaobject,
      });
    }


    // ========================================================
    // DELETE
    // ========================================================

    if (method === "DELETE") {
      if (
        body.action !==
        "delete-product-metaobject"
      ) {
        return Response.json(
          {
            success: false,
            message:
              "Invalid DELETE action",
          },
          {
            status: 400,
          },
        );
      }

      if (!body.metaobjectId) {
        return Response.json(
          {
            success: false,
            message:
              "Metaobject ID is required",
          },
          {
            status: 400,
          },
        );
      }

      const result =
        await deleteProductMetaobjectController({
          admin,

          shop:
            session.shop,

          productId:
            body.productId,

          metaobjectId:
            body.metaobjectId,

          namespace:
            body.namespace,

          key:
            body.key,
        });

      return Response.json({
        success: true,
        message:
          "Product metaobject deleted successfully",
        data: result,
      });
    }


    return Response.json(
      {
        success: false,
        message:
          "Method not allowed",
      },
      {
        status: 405,
      },
    );
  } catch (error) {
    console.error(
      "Metaobject API error:",
      error,
    );

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Metaobject request failed",
      },
      {
        status: 500,
      },
    );
  }
}