import {
  Outlet,
  useLoaderData,
  useRouteError,
} from "react-router";

import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";


// ============================================================
// APP ROUTE LOADER
// ============================================================
//
// This route is the parent of:
//
// /app
// /app/products
// /app/collections
// /app/inventory
// etc.
//
// AppProvider is placed here so all app.* routes receive
// Shopify's App Provider context.
// ============================================================

export async function loader({
  request,
}) {
  // Authenticate the Shopify admin request.
  await authenticate.admin(request);

  return {
    apiKey:
      process.env.SHOPIFY_API_KEY || "",
  };
}


// ============================================================
// APP LAYOUT
// ============================================================

export default function App() {
  const {
    apiKey,
  } = useLoaderData();

  return (
    <AppProvider
      embedded
      apiKey={apiKey}
    >
      {/* ==================================================
          SHOPIFY APP NAVIGATION
          ================================================== */}

      <s-app-nav>

        <s-link href="/app">
          Home
        </s-link>

        <s-link href="/app/products">
          Products
        </s-link>

        <s-link href="/app/collections">
          Collections
        </s-link>

        <s-link href="/app/inventory">
          Inventory
        </s-link>

        <s-link href="/app/orders">
          Order
        </s-link>

        <s-link href="/app/customers">
          Customers
        </s-link>

        <s-link href="/app/discounts">
          Discounts
        </s-link>

        <s-link href="/app/gift-cards">
          Gift Cards
        </s-link>

        <s-link href="/app/metafields">
          Metafields
        </s-link>

        <s-link href="/app/metaobjects">
          Metaobjects
        </s-link>

        <s-link href="/app/fulfillments">
          Fulfillments
        </s-link>

        <s-link href="/app/draft-orders">
          Draft Orders
        </s-link>

        <s-link href="/app/refunds">
          Refunds
        </s-link>

      </s-app-nav>

      {/* ==================================================
          CHILD ROUTES
          ================================================== */}

      <Outlet />

    </AppProvider>
  );
}


// ============================================================
// ERROR BOUNDARY
// ============================================================
//
// Shopify needs React Router to catch thrown responses so
// Shopify headers can be returned correctly.
// ============================================================

export function ErrorBoundary() {
  return boundary.error(
    useRouteError()
  );
}


// ============================================================
// HEADERS
// ============================================================

export const headers = (
  headersArgs
) => {
  return boundary.headers(
    headersArgs
  );
};