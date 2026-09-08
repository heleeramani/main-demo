export async function getShopDetails(admin) {
  const response = await admin.graphql(`
    #graphql
    query GetShopDetails {
      shop {
        id
        name
        email
        currencyCode
      }
    }
  `);

  const result = await response.json();

  if (result.errors) {
    throw new Error("Failed to fetch shop details from Shopify");
  }

  return result.data.shop;
}