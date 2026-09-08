import { authenticate } from "../shopify.server";

import {
  syncCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";


// ============================================================
// GET /api/customers
// ============================================================
//
// Without customerId:
//   Sync all customers
//
// With customerId:
//   Get one customer
//
// Example:
//
// /api/customers
//
// /api/customers?customerId=gid://shopify/Customer/123
// ============================================================

export async function loader({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    const url = new URL(request.url);

    const customerId =
      url.searchParams.get("customerId");

    // Get single customer
    if (customerId) {
      return getCustomerById({
        admin,
        session,
        customerId,
      });
    }

    // Sync all customers
    return syncCustomers({
      admin,
      session,
    });
  } catch (error) {
    // React Router Response errors
    if (error instanceof Response) {
      throw error;
    }

    console.error(
      "Get customers error:",
      error
    );

    // ALWAYS return JSON
    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Failed to get customers",
      },
      {
        status: 500,
      }
    );
  }
}


// ============================================================
// POST /api/customers
// ============================================================
//
// Create customer
//
// Body:
//
// {
//   "customer": {
//     "firstName": "Helee",
//     "lastName": "Ramani",
//     "email": "helee@example.com",
//     "phone": "+919876543210",
//     "note": "Demo customer",
//     "tags": ["demo", "test"]
//   }
// }
// ============================================================

export async function action({ request }) {
  try {
    const { admin, session } =
      await authenticate.admin(request);

    // Read request body
    const body = await request.json();

    console.log(
      "CUSTOMER REQUEST BODY:",
      JSON.stringify(body, null, 2)
    );


    // ========================================================
    // CREATE
    // ========================================================

    if (request.method === "POST") {
      return createCustomer({
        admin,
        session,
        customerData: body.customer,
      });
    }


    // ========================================================
    // UPDATE
    // ========================================================

    if (request.method === "PUT") {
      return updateCustomer({
        admin,
        session,
        customerData: body,
      });
    }


    // ========================================================
    // DELETE
    // ========================================================

    if (request.method === "DELETE") {
      return deleteCustomer({
        admin,
        session,
        customerId: body.customerId,
      });
    }


    // ========================================================
    // INVALID METHOD
    // ========================================================

    return Response.json(
      {
        success: false,
        message: "Invalid customer action",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Customer action error:",
      error
    );

    // IMPORTANT:
    // Always return JSON so frontend response.json()
    // does not throw:
    //
    // Unexpected token 'U'
    //

    return Response.json(
      {
        success: false,
        message:
          error?.message ||
          "Customer action failed",
      },
      {
        status: 500,
      }
    );
  }
}