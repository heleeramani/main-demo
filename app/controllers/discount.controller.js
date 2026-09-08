import Discount from "../models/Discount";

import {
  getDiscounts,
  getDiscountById as getDiscountByIdFromShopify,
  createDiscount as createDiscountOnShopify,
  updateDiscount as updateDiscountOnShopify,
  deleteDiscount as deleteDiscountOnShopify,
} from "../services/discount.service";

import { connectDB } from "../db.server";


// ============================================================
// MAP SHOPIFY DISCOUNT → MONGODB
// ============================================================

function mapDiscountToMongo(
  discount,
  shop
) {
  const code =
    discount?.codes?.nodes?.[0]
      ?.code || "";

  const value =
    discount?.customerGets?.value;


  let discountType = "";

  let percentage = null;

  let fixedAmount = null;


  if (
    value?.percentage !==
    undefined &&
    value?.percentage !== null
  ) {
    discountType =
      "PERCENTAGE";

    percentage =
      Number(value.percentage) * 100;
  }


  if (value?.amount?.amount) {
    discountType =
      "FIXED_AMOUNT";

    fixedAmount =
      value.amount.amount;
  }


  return {
    shop,

    shopifyId:
      discount.id,

    code,

    title:
      discount.title || "",

    status:
      discount.status || "",

    startsAt:
      discount.startsAt
        ? new Date(
            discount.startsAt
          )
        : null,

    endsAt:
      discount.endsAt
        ? new Date(
            discount.endsAt
          )
        : null,

    usageLimit:
      discount.usageLimit ??
      null,

    usageCount:
      Number(
        discount.asyncUsageCount
      ) || 0,

    discountType,

    percentage,

    fixedAmount,

    minimumRequirement: "",

    customerSelection:
      "ALL",

    appliesOncePerCustomer:
      Boolean(
        discount.appliesOncePerCustomer
      ),

    combinesWith: {
      orderDiscounts:
        Boolean(
          discount.combinesWith
            ?.orderDiscounts
        ),

      productDiscounts:
        Boolean(
          discount.combinesWith
            ?.productDiscounts
        ),

      shippingDiscounts:
        Boolean(
          discount.combinesWith
            ?.shippingDiscounts
        ),
    },

    shopifyCreatedAt:
      discount.createdAt
        ? new Date(
            discount.createdAt
          )
        : null,

    shopifyUpdatedAt:
      discount.updatedAt
        ? new Date(
            discount.updatedAt
          )
        : null,
  };
}


// ============================================================
// SYNC DISCOUNTS
// ============================================================

export async function syncDiscounts({
  admin,
  session,
}) {
  await connectDB();


  console.log(
    "========================================"
  );

  console.log(
    "SYNC DISCOUNTS STARTED"
  );

  console.log(
    "Shop:",
    session.shop
  );


  const discounts =
    await getDiscounts(admin);


  console.log(
    "Shopify discounts received:",
    discounts.length
  );


  let savedCount = 0;


  for (const discount of discounts) {
    const discountData =
      mapDiscountToMongo(
        discount,
        session.shop
      );


    if (!discountData.shopifyId) {
      console.log(
        "Skipping discount without ID"
      );

      continue;
    }


    await Discount.findOneAndUpdate(
      {
        shop:
          session.shop,

        shopifyId:
          discountData.shopifyId,
      },

      {
        $set:
          discountData,
      },

      {
        upsert: true,

        returnDocument:
          "after",

        setDefaultsOnInsert:
          true,
      }
    );


    savedCount++;
  }


  console.log(
    "Total discounts saved:",
    savedCount
  );

  console.log(
    "SYNC DISCOUNTS COMPLETED"
  );

  console.log(
    "========================================"
  );


  return Response.json({
    success: true,

    message:
      "Discounts synced successfully",

    discounts,
  });
}


// ============================================================
// GET SINGLE DISCOUNT
// ============================================================

export async function getDiscountById({
  admin,
  session,
  discountId,
}) {
  if (!discountId) {
    return Response.json(
      {
        success: false,
        message:
          "Discount ID is required",
      },
      {
        status: 400,
      }
    );
  }


  const discount =
    await getDiscountByIdFromShopify(
      admin,
      discountId
    );


  return Response.json({
    success: true,

    discount,
  });
}


// ============================================================
// CREATE DISCOUNT
// ============================================================

export async function createDiscount({
  admin,
  session,
  discountData,
}) {
  if (!discountData) {
    return Response.json(
      {
        success: false,
        message:
          "Discount data is required",
      },
      {
        status: 400,
      }
    );
  }


  const discount =
    await createDiscountOnShopify(
      admin,
      discountData
    );


  // Save immediately to MongoDB
  await connectDB();


  const mongoData =
    mapDiscountToMongo(
      discount,
      session.shop
    );


  await Discount.findOneAndUpdate(
    {
      shop:
        session.shop,

      shopifyId:
        mongoData.shopifyId,
    },

    {
      $set:
        mongoData,
    },

    {
      upsert: true,

      returnDocument:
        "after",

      setDefaultsOnInsert:
        true,
    }
  );


  return Response.json({
    success: true,

    message:
      "Discount created successfully",

    discount,
  });
}


// ============================================================
// UPDATE DISCOUNT
// ============================================================

export async function updateDiscount({
  admin,
  session,
  discountData,
}) {
  if (!discountData?.id) {
    return Response.json(
      {
        success: false,
        message:
          "Discount ID is required",
      },
      {
        status: 400,
      }
    );
  }


  const discount =
    await updateDiscountOnShopify(
      admin,
      discountData
    );


  await connectDB();


  const mongoData =
    mapDiscountToMongo(
      discount,
      session.shop
    );


  await Discount.findOneAndUpdate(
    {
      shop:
        session.shop,

      shopifyId:
        mongoData.shopifyId,
    },

    {
      $set:
        mongoData,
    },

    {
      upsert: true,

      returnDocument:
        "after",

      setDefaultsOnInsert:
        true,
    }
  );


  return Response.json({
    success: true,

    message:
      "Discount updated successfully",

    discount,
  });
}


// ============================================================
// DELETE DISCOUNT
// ============================================================

export async function deleteDiscount({
  admin,
  session,
  discountId,
}) {
  if (!discountId) {
    return Response.json(
      {
        success: false,
        message:
          "Discount ID is required",
      },
      {
        status: 400,
      }
    );
  }


  const result =
    await deleteDiscountOnShopify(
      admin,
      discountId
    );


  await connectDB();


  await Discount.findOneAndDelete({
    shop:
      session.shop,

    shopifyId:
      discountId,
  });


  return Response.json({
    success: true,

    message:
      "Discount deleted successfully",

    deletedId:
      result.deletedId,
  });
}   