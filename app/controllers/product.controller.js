import { connectDB } from "../db.server";

import {
  getProducts,
  createProduct as createProductOnShopify,
  updateProduct as updateProductOnShopify,
  deleteProduct as deleteProductOnShopify,
} from "../services/product.service";

import Product from "../models/Product";

export async function syncProducts({ admin, session }) {
  await connectDB();

  const products = await getProducts(admin);

  const savedProducts = [];

  for (const product of products) {
    const savedProduct = await Product.findOneAndUpdate(
      {
        shopifyId: product.id,
        shop: session.shop,
      },
      {
        shop: session.shop,
        shopifyId: product.id,
        title: product.title,
        description: product.description,
        vendor: product.vendor,
        productType: product.productType,
        handle: product.handle,
        status: product.status,

        images: product.media.nodes.map((media) => ({
          id: media.id,
          url: media.image?.url || "",
          altText: media.image?.altText || "",
        })),

        variants: product.variants.nodes.map((variant) => ({
          shopifyId: variant.id,
          title: variant.title,
          price: variant.price,
          sku: variant.sku || "",
        })),
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
      }
    );

    savedProducts.push(savedProduct);
  }

  return Response.json({
    success: true,
    message: "Products synced successfully",
    count: savedProducts.length,
    data: savedProducts,
  });
}

export async function createProduct({ admin, session, productData }) {
  await connectDB();

  const product = await createProductOnShopify(admin, {
  title: productData.title,
  descriptionHtml: productData.description || "",
  vendor: productData.vendor || "",
  productType: productData.productType || "",
});

  const savedProduct = await Product.findOneAndUpdate(
    {
      shopifyId: product.id,
      shop: session.shop,
    },
    {
      shop: session.shop,
      shopifyId: product.id,
      title: product.title,
      description: product.description || "",
      vendor: product.vendor || "",
      productType: product.productType || "",
      handle: product.handle || "",
      status: product.status || "",
      images: [],
      variants: [],
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Product created successfully",
    data: savedProduct,
  });
}

export async function updateProduct({
  admin,
  session,
  productData,
}) {
  await connectDB();

  const product = await updateProductOnShopify(
    admin,
    productData
  );

  const savedProduct = await Product.findOneAndUpdate(
    {
      shopifyId: product.id,
      shop: session.shop,
    },
    {
      title: product.title,
      description: product.description || "",
      vendor: product.vendor || "",
      productType: product.productType || "",
      handle: product.handle || "",
      status: product.status || "",
    },
    {
      returnDocument: "after",
      runValidators: true,
    }
  );

  return Response.json({
    success: true,
    message: "Product updated successfully",
    data: savedProduct,
  });
}

export async function deleteProduct({
  admin,
  session,
  productId,
}) {
  await connectDB();

  const result = await deleteProductOnShopify(
    admin,
    productId
  );

  if (!result.deletedProductId) {
    throw new Error(
      "Product was not deleted from Shopify"
    );
  }

  await Product.findOneAndDelete({
    shopifyId: result.deletedProductId,
    shop: session.shop,
  });

  return Response.json({
    success: true,
    message: "Product deleted successfully",
    deletedProductId: result.deletedProductId,
  });
}

