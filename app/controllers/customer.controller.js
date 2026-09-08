import { connectDB } from "../db.server";

import {
  getCustomers,
  getCustomerById as getCustomerByIdFromShopify,
  createCustomer as createCustomerOnShopify,
  updateCustomer as updateCustomerOnShopify,
  deleteCustomer as deleteCustomerOnShopify,
} from "../services/customer.service";

import Customer from "../models/Customer";


// ============================================================
// MAP SHOPIFY CUSTOMER → MONGODB
// ============================================================

function mapCustomerToMongo(customer, shop) {
  return {
    shop,

    shopifyId:
      customer.id || "",

    firstName:
      customer.firstName || "",

    lastName:
      customer.lastName || "",

    displayName:
      customer.displayName || "",

    email:
      customer.email ||
      customer.defaultEmailAddress?.emailAddress ||
      "",

    phone:
      customer.phone ||
      customer.defaultPhoneNumber?.phoneNumber ||
      "",

    state:
      customer.state || "",

    note:
      customer.note || "",

    tags:
      Array.isArray(customer.tags)
        ? customer.tags
        : [],

    // ----------------------------------------------------------
    // DEFAULT ADDRESS
    // ----------------------------------------------------------

    defaultAddress: {
      id:
        customer.defaultAddress?.id || "",

      firstName:
        customer.defaultAddress?.firstName || "",

      lastName:
        customer.defaultAddress?.lastName || "",

      company:
        customer.defaultAddress?.company || "",

      address1:
        customer.defaultAddress?.address1 || "",

      address2:
        customer.defaultAddress?.address2 || "",

      city:
        customer.defaultAddress?.city || "",

      province:
        customer.defaultAddress?.province || "",

      country:
        customer.defaultAddress?.country || "",

      zip:
        customer.defaultAddress?.zip || "",

      phone:
        customer.defaultAddress?.phone || "",
    },

    // ----------------------------------------------------------
    // EMAIL MARKETING
    // ----------------------------------------------------------

    emailMarketingConsent: {
      state:
        customer.emailMarketingConsent
          ?.marketingState || "",

      marketingOptInLevel:
        customer.emailMarketingConsent
          ?.marketingOptInLevel || "",

      consentUpdatedAt:
        customer.emailMarketingConsent
          ?.consentUpdatedAt
          ? new Date(
              customer.emailMarketingConsent
                .consentUpdatedAt
            )
          : null,
    },

    // ----------------------------------------------------------
    // SMS MARKETING
    // ----------------------------------------------------------

    smsMarketingConsent: {
      marketingState:
        customer.smsMarketingConsent
          ?.marketingState || "",

      consentUpdatedAt:
        customer.smsMarketingConsent
          ?.consentUpdatedAt
          ? new Date(
              customer.smsMarketingConsent
                .consentUpdatedAt
            )
          : null,
    },

    // ----------------------------------------------------------
    // SHOPIFY DATES
    // ----------------------------------------------------------

    shopifyCreatedAt:
      customer.createdAt
        ? new Date(customer.createdAt)
        : null,

    shopifyUpdatedAt:
      customer.updatedAt
        ? new Date(customer.updatedAt)
        : null,
  };
}


// ============================================================
// SYNC CUSTOMERS
// ============================================================

export async function syncCustomers({
  admin,
  session,
}) {
  console.log(
    "========================================"
  );

  console.log(
    "SYNC CUSTOMERS STARTED"
  );

  console.log(
    "Shop:",
    session.shop
  );

  await connectDB();

  console.log(
    "MongoDB connection ready"
  );

  const customers =
    await getCustomers(admin);

  console.log(
    "Customers received from Shopify:",
    customers.length
  );

  const savedCustomers = [];

  for (const customer of customers) {
    console.log(
      "Saving customer:",
      customer.displayName
    );

    const data =
      mapCustomerToMongo(
        customer,
        session.shop
      );

    const savedCustomer =
      await Customer.findOneAndUpdate(
        {
          shop: session.shop,

          shopifyId:
            customer.id,
        },
        data,
        {
          returnDocument: "after",

          upsert: true,

          runValidators: true,
        }
      );

    console.log(
      "MongoDB customer saved:",
      {
        name:
          savedCustomer?.displayName,

        email:
          savedCustomer?.email,
      }
    );

    savedCustomers.push(
      savedCustomer
    );
  }

  console.log(
    "Total customers saved:",
    savedCustomers.length
  );

  console.log(
    "SYNC CUSTOMERS COMPLETED"
  );

  console.log(
    "========================================"
  );

  return Response.json({
    success: true,

    message:
      "Customers synced successfully",

    count:
      savedCustomers.length,

    data:
      savedCustomers,
  });
}


// ============================================================
// GET SINGLE CUSTOMER
// ============================================================

export async function getCustomerById({
  admin,
  session,
  customerId,
}) {
  await connectDB();

  if (!customerId) {
    throw new Error(
      "Customer ID is required"
    );
  }

  const customer =
    await getCustomerByIdFromShopify(
      admin,
      customerId
    );

  const data =
    mapCustomerToMongo(
      customer,
      session.shop
    );

  const savedCustomer =
    await Customer.findOneAndUpdate(
      {
        shop:
          session.shop,

        shopifyId:
          customer.id,
      },
      data,
      {
        returnDocument: "after",

        upsert: true,

        runValidators: true,
      }
    );

  return Response.json({
    success: true,

    data:
      savedCustomer,
  });
}


// ============================================================
// CREATE CUSTOMER
// ============================================================

export async function createCustomer({
  admin,
  session,
  customerData,
}) {
  await connectDB();

  if (!customerData) {
    throw new Error(
      "Customer data is required"
    );
  }

  const createdCustomer =
    await createCustomerOnShopify(
      admin,
      customerData
    );

  // Get complete customer data
  const shopifyCustomer =
    await getCustomerByIdFromShopify(
      admin,
      createdCustomer.id
    );

  const data =
    mapCustomerToMongo(
      shopifyCustomer,
      session.shop
    );

  const savedCustomer =
    await Customer.findOneAndUpdate(
      {
        shop:
          session.shop,

        shopifyId:
          createdCustomer.id,
      },
      data,
      {
        returnDocument: "after",

        upsert: true,

        runValidators: true,
      }
    );

  return Response.json({
    success: true,

    message:
      "Customer created successfully",

    data:
      savedCustomer,
  });
}


// ============================================================
// UPDATE CUSTOMER
// ============================================================

export async function updateCustomer({
  admin,
  session,
  customerData,
}) {
  await connectDB();

  if (!customerData?.id) {
    throw new Error(
      "Customer ID is required"
    );
  }

  console.log(
    "Updating Shopify customer:",
    {
      id:
        customerData.id,

      firstName:
        customerData.firstName,

      lastName:
        customerData.lastName,

      email:
        customerData.email,

      phone:
        customerData.phone,

      note:
        customerData.note,

      tags:
        customerData.tags,
    }
  );

  const updatedCustomer =
    await updateCustomerOnShopify(
      admin,
      customerData
    );

  console.log(
    "Shopify customer updated:",
    {
      id:
        updatedCustomer.id,

      displayName:
        updatedCustomer.displayName,
    }
  );

  // Get complete customer
  const shopifyCustomer =
    await getCustomerByIdFromShopify(
      admin,
      updatedCustomer.id
    );

  const data =
    mapCustomerToMongo(
      shopifyCustomer,
      session.shop
    );

  const savedCustomer =
    await Customer.findOneAndUpdate(
      {
        shop:
          session.shop,

        shopifyId:
          updatedCustomer.id,
      },
      data,
      {
        returnDocument: "after",

        upsert: true,

        runValidators: true,
      }
    );

  console.log(
    "MongoDB customer after update:",
    {
      displayName:
        savedCustomer?.displayName,

      email:
        savedCustomer?.email,

      note:
        savedCustomer?.note,

      tags:
        savedCustomer?.tags,
    }
  );

  return Response.json({
    success: true,

    message:
      "Customer updated successfully",

    data:
      savedCustomer,
  });
}


// ============================================================
// DELETE CUSTOMER
// ============================================================

export async function deleteCustomer({
  admin,
  session,
  customerId,
}) {
  await connectDB();

  if (!customerId) {
    throw new Error(
      "Customer ID is required"
    );
  }

  const result =
    await deleteCustomerOnShopify(
      admin,
      customerId
    );

  await Customer.findOneAndDelete({
    shop:
      session.shop,

    shopifyId:
      customerId,
  });

  return Response.json({
    success: true,

    message:
      "Customer deleted successfully",

    deletedCustomerId:
      result.deletedCustomerId,
  });
}