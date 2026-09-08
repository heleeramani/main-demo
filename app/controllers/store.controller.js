import { connectDB } from "../db.server";
import { getShopDetails } from "../services/shopify.service";
import Store from "../models/Store";

export async function syncStore({ admin, session }) {
  // Connect MongoDB first
  await connectDB();

  // Get store details from Shopify
  const shopDetails = await getShopDetails(admin);

  // Save/update store in MongoDB
  const store = await Store.findOneAndUpdate(
    { shop: session.shop },
    {
      shop: session.shop,
      shopifyId: shopDetails.id,
      name: shopDetails.name,
      email: shopDetails.email,
      currencyCode: shopDetails.currencyCode,
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Store synced successfully",
    data: store,
  });
}