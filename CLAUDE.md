# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `shopify app dev` — start local development (tunnel, env vars, config sync)
- `npm run build` — production build (`react-router build`)
- `npm run start` — serve the production build (`react-router-serve`)
- `npm run lint` — ESLint over the repo
- `npm run typecheck` — regenerate React Router types, then `tsc --noEmit`
- `npm run setup` — `prisma generate && prisma migrate deploy`; run this if you hit `The table main.Session does not exist`
- `npm run graphql-codegen` — regenerate Admin GraphQL types into `app/types` from queries under `app/`
- `npm run deploy` — `shopify app deploy`; pushes `shopify.app.toml` (scopes, webhooks, metaobject/metafield defs) and extensions to Shopify
- `shopify app generate` — scaffold a new extension under `extensions/`

There is no test suite in this repo yet.

## Architecture

A Shopify embedded admin app on React Router v7, using file-based "flat routes" (`@react-router/fs-routes`) — route filenames map to URLs, e.g. `app.products.jsx` → `/app/products`, `api.products.jsx` → `/api/products`, `webhooks.products.jsx` → `/webhooks/products`. `app/shopify.server.js` is the single place the Shopify app instance (auth, scopes, API version, webhook registration) is configured; `app/routes.js` just wires up the flat-file router.

**Two separate databases**, both set up in `app/db.server.js`:
- **Prisma + SQLite** (`prisma/schema.prisma`) — exclusively Shopify session storage via `PrismaSessionStorage`. Its only model is `Session`; don't add app data here.
- **MongoDB via Mongoose** (`app/models/*.js`) — all application data (products, orders, customers, discounts, gift cards, inventory, metafields, metaobjects, etc). Call `connectDB()` (from `app/db.server.js`) before touching any Mongoose model. Every document carries `shop` (indexed) and `shopifyId` (unique) so records stay scoped per store and can be upserted idempotently.

**Routes are thin — logic lives in a route → controller → service/model pipeline**, repeated per domain (product, order, customer, collection, discount, gift-card, inventory, metafield, metaobject, variant, store, webhook):
- `app/routes/` — three families of routes: `app.*.jsx` (embedded admin UI pages, rendered under the `app/routes/app.jsx` layout which wraps children in Shopify's `<AppProvider>` and requires `authenticate.admin`), `api.*.jsx` (JSON endpoints for the embedded UI, also `authenticate.admin`), and `webhooks.*.jsx` (webhook receivers using `authenticate.webhook`). Webhook topics are subscribed in `shopify.app.toml` under `[[webhooks.subscriptions]]`, not in route code.
- `app/controllers/` — orchestrates one request: calls the matching service to hit Shopify's Admin GraphQL API, upserts the result into the matching Mongoose model, and returns a `Response.json({ success, message, data })` envelope.
- `app/services/` — raw Shopify Admin GraphQL query/mutation strings and `admin.graphql(...)` calls, including `userErrors`/`errors` unwrapping. No database access here.
- `app/models/` — Mongoose schemas for the app's local copy of Shopify data.

Use the `product` trio as the reference implementation when adding a new domain: `app/routes/api.products.jsx`, `app/controllers/product.controller.js`, `app/services/product.service.js`, `app/models/Product.js`.

Access scopes, webhook topic subscriptions, and metafield/metaobject definitions are declared in `shopify.app.toml`, not in code — edit that file and run `npm run deploy` to change them.

Env vars used: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`, `SHOPIFY_APP_URL`, `SHOP_CUSTOM_DOMAIN` (optional), `DATABASE_URL` (Prisma/SQLite), `MONGODB_URI` (Mongoose).

### Embedded-app gotchas (from README)

Because the app runs inside an iframe and must preserve the Shopify session across navigation:
- Use `Link` from `react-router` or Polaris, never a plain `<a>`.
- Use the `redirect` returned from `authenticate.admin`, not `redirect` from `react-router`.
- Use `useSubmit` from `react-router` for form submissions.
