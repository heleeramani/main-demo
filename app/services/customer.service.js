// ============================================================
// CUSTOMER SERVICE
// ============================================================
// This file contains all Shopify Customer GraphQL operations.
//
// Routes → Controllers → Services
//
// Route:
// app/routes/api.customers.jsx
//
// Controller:
// app/controllers/customer.controller.js
//
// Service:
// app/services/customer.service.js
// ============================================================


// ============================================================
// GET CUSTOMERS
// ============================================================

export async function getCustomers(admin) {
  const response = await admin.graphql(`
    #graphql
    query GetCustomers {
      customers(first: 50) {
        nodes {
          id
          firstName
          lastName
          displayName
          email
          phone
          state
          note
          tags

          defaultEmailAddress {
            emailAddress
          }

          defaultPhoneNumber {
            phoneNumber
          }

          defaultAddress {
            id
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
            phone
          }

          emailMarketingConsent {
            marketingState
            marketingOptInLevel
            consentUpdatedAt
          }

          smsMarketingConsent {
            marketingState
            consentUpdatedAt
          }

          createdAt
          updatedAt
        }
      }
    }
  `);

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  return result.data?.customers?.nodes || [];
}


// ============================================================
// GET CUSTOMER BY ID
// ============================================================

export async function getCustomerById(admin, customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const response = await admin.graphql(
    `
      #graphql
      query GetCustomer($id: ID!) {
        customer(id: $id) {
          id
          firstName
          lastName
          displayName
          email
          phone
          state
          note
          tags

          defaultEmailAddress {
            emailAddress
          }

          defaultPhoneNumber {
            phoneNumber
          }

          defaultAddress {
            id
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
            phone
          }

          emailMarketingConsent {
            marketingState
            marketingOptInLevel
            consentUpdatedAt
          }

          smsMarketingConsent {
            marketingState
            consentUpdatedAt
          }

          createdAt
          updatedAt
        }
      }
    `,
    {
      variables: {
        id: customerId,
      },
    }
  );

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  const customer = result.data?.customer;

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}


// ============================================================
// CLEAN CUSTOMER DATA
// ============================================================
// Shopify does not need empty optional fields.
//
// Example:
//
// phone: ""
//
// will be removed before sending to Shopify.
//
// This prevents:
// "Phone is invalid"
// ============================================================

function cleanCustomerData(customerData = {}) {
  const cleanedData = {
    ...customerData,
  };

  // Remove empty phone
  if (
    cleanedData.phone === "" ||
    cleanedData.phone === null ||
    cleanedData.phone === undefined
  ) {
    delete cleanedData.phone;
  }

  // Remove empty email
  if (
    cleanedData.email === "" ||
    cleanedData.email === null ||
    cleanedData.email === undefined
  ) {
    delete cleanedData.email;
  }

  // Remove empty first name
  if (
    cleanedData.firstName === "" ||
    cleanedData.firstName === null ||
    cleanedData.firstName === undefined
  ) {
    delete cleanedData.firstName;
  }

  // Remove empty last name
  if (
    cleanedData.lastName === "" ||
    cleanedData.lastName === null ||
    cleanedData.lastName === undefined
  ) {
    delete cleanedData.lastName;
  }

  // Remove empty note
  if (
    cleanedData.note === "" ||
    cleanedData.note === null ||
    cleanedData.note === undefined
  ) {
    delete cleanedData.note;
  }

  // Remove empty tags
  if (
    Array.isArray(cleanedData.tags) &&
    cleanedData.tags.length === 0
  ) {
    delete cleanedData.tags;
  }

  return cleanedData;
}


// ============================================================
// CREATE CUSTOMER
// ============================================================

export async function createCustomer(admin, customerData) {
  if (!customerData) {
    throw new Error("Customer data is required");
  }

  // Clean optional empty values
  const cleanedCustomerData =
    cleanCustomerData(customerData);

  console.log(
    "SHOPIFY CREATE CUSTOMER DATA:",
    JSON.stringify(cleanedCustomerData, null, 2)
  );

  const response = await admin.graphql(
    `
      #graphql
      mutation CreateCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            firstName
            lastName
            displayName
            email
            phone
            state
            note
            tags
            createdAt
            updatedAt
          }

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: cleanedCustomerData,
      },
    }
  );

  const result = await response.json();

  console.log(
    "SHOPIFY CREATE CUSTOMER RESPONSE:",
    JSON.stringify(result, null, 2)
  );

  // GraphQL errors
  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  // Shopify user errors
  const userErrors =
    result.data?.customerCreate?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const customer =
    result.data?.customerCreate?.customer;

  if (!customer) {
    throw new Error(
      "Shopify did not return the created customer"
    );
  }

  return customer;
}


// ============================================================
// UPDATE CUSTOMER
// ============================================================

export async function updateCustomer(admin, customerData) {
  if (!customerData?.id) {
    throw new Error("Customer ID is required");
  }

  // Copy customer data
  const cleanedCustomerData = {
    ...customerData,
  };

  // Remove ID from CustomerInput
  delete cleanedCustomerData.id;

  // Clean optional values
  const cleanedData =
    cleanCustomerData(cleanedCustomerData);

  console.log(
    "SHOPIFY UPDATE CUSTOMER ID:",
    customerData.id
  );

  console.log(
    "SHOPIFY UPDATE CUSTOMER DATA:",
    JSON.stringify(cleanedData, null, 2)
  );

  const response = await admin.graphql(
    `
      #graphql
      mutation UpdateCustomer(
        $input: CustomerInput!
      ) {
        customerUpdate(input: $input) {
          customer {
            id
            firstName
            lastName
            displayName
            email
            phone
            state
            note
            tags
            updatedAt
          }

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          id: customerData.id,
          ...cleanedData,
        },
      },
    }
  );

  const result = await response.json();

  console.log(
    "SHOPIFY UPDATE CUSTOMER RESPONSE:",
    JSON.stringify(result, null, 2)
  );

  // GraphQL errors
  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  // Shopify user errors
  const userErrors =
    result.data?.customerUpdate?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const customer =
    result.data?.customerUpdate?.customer;

  if (!customer) {
    throw new Error(
      "Shopify did not return the updated customer"
    );
  }

  return customer;
}


// ============================================================
// DELETE CUSTOMER
// ============================================================

export async function deleteCustomer(admin, customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  console.log(
    "SHOPIFY DELETE CUSTOMER:",
    customerId
  );

  const response = await admin.graphql(
    `
      #graphql
      mutation DeleteCustomer(
        $input: CustomerDeleteInput!
      ) {
        customerDelete(input: $input) {
          deletedCustomerId

          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          id: customerId,
        },
      },
    }
  );

  const result = await response.json();

  console.log(
    "SHOPIFY DELETE CUSTOMER RESPONSE:",
    JSON.stringify(result, null, 2)
  );

  // GraphQL errors
  if (result.errors) {
    throw new Error(
      result.errors.map((error) => error.message).join(", ")
    );
  }

  // Shopify user errors
  const userErrors =
    result.data?.customerDelete?.userErrors || [];

  if (userErrors.length > 0) {
    throw new Error(
      userErrors
        .map((error) => error.message)
        .join(", ")
    );
  }

  const deletedCustomerId =
    result.data?.customerDelete?.deletedCustomerId;

  if (!deletedCustomerId) {
    throw new Error(
      "Shopify did not return the deleted customer ID"
    );
  }

  return {
    deletedCustomerId,
  };
}