// app/services/gift-card.service.js

// ============================================================
// GET ALL GIFT CARDS
// ============================================================

export async function getGiftCards(admin) {
  const response = await admin.graphql(
    `#graphql
      query GetGiftCards {
        giftCards(first: 50) {
          nodes {
            id

            initialValue {
              amount
              currencyCode
            }

            balance {
              amount
              currencyCode
            }

            enabled

            customer {
              id
              displayName
              email
            }

            note
            expiresOn
            createdAt
            updatedAt
          }
        }
      }
    `,
  );

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  return result.data?.giftCards?.nodes || [];
}

// ============================================================
// GET GIFT CARD BY ID
// ============================================================

export async function getGiftCardById(admin, giftCardId) {
  if (!giftCardId) {
    throw new Error("Gift Card ID is required");
  }

  const response = await admin.graphql(
    `#graphql
      query GetGiftCard($id: ID!) {
        giftCard(id: $id) {
          id

          initialValue {
            amount
            currencyCode
          }

          balance {
            amount
            currencyCode
          }

          enabled

          customer {
            id
            displayName
            email
          }

          note
          expiresOn
          createdAt
          updatedAt
        }
      }
    `,
    {
      variables: {
        id: giftCardId,
      },
    },
  );

  const result = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const giftCard = result.data?.giftCard;

  if (!giftCard) {
    throw new Error("Gift card not found");
  }

  return giftCard;
}

// ============================================================
// CREATE GIFT CARD
// ============================================================

export async function createGiftCard(admin, giftCardData) {
  if (!giftCardData) {
    throw new Error("Gift Card data is required");
  }

  const { initialValue, customerId, note, expiresOn } = giftCardData;

  if (
    initialValue === undefined ||
    initialValue === null ||
    initialValue === ""
  ) {
    throw new Error("Initial value is required");
  }

  const numericInitialValue = Number(initialValue);

  if (Number.isNaN(numericInitialValue) || numericInitialValue <= 0) {
    throw new Error("Initial value must be greater than 0");
  }

  const input = {
    initialValue: numericInitialValue.toFixed(2),
  };

  // Customer is optional.
  if (customerId && customerId.trim()) {
    input.customerId = customerId.trim();
  }

  // Note is optional.
  if (note !== undefined && note !== "") {
    input.note = note;
  }

  // Expiration is optional.
  if (expiresOn) {
    input.expiresOn = expiresOn;
  }

  console.log("CREATE GIFT CARD INPUT:", JSON.stringify(input, null, 2));

  const response = await admin.graphql(
    `#graphql
      mutation GiftCardCreate(
        $input: GiftCardCreateInput!
      ) {
        giftCardCreate(input: $input) {
          giftCard {
            id

            initialValue {
              amount
              currencyCode
            }

            balance {
              amount
              currencyCode
            }

            enabled

            customer {
              id
              displayName
              email
            }

            note
            expiresOn
            createdAt
            updatedAt
          }

          giftCardCode

          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      variables: {
        input,
      },
    },
  );

  const result = await response.json();

  console.log("GIFT CARD CREATE RESPONSE:", JSON.stringify(result, null, 2));

  // GraphQL errors
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const payload = result.data?.giftCardCreate;

  if (!payload) {
    throw new Error("Shopify did not return gift card creation data");
  }

  // Shopify user errors
  if (payload.userErrors?.length) {
    throw new Error(
      payload.userErrors
        .map((error) => {
          const field = error.field?.length
            ? ` (${error.field.join(".")})`
            : "";

          const code = error.code ? ` [${error.code}]` : "";

          return `${error.message}${field}${code}`;
        })
        .join(", "),
    );
  }

  if (!payload.giftCard) {
    throw new Error("Shopify did not return the created gift card");
  }

  console.log("GIFT CARD CREATED:", payload.giftCard.id);

  console.log("GIFT CARD CODE:", payload.giftCardCode);

  return {
    ...payload.giftCard,

    giftCardCode: payload.giftCardCode || "",
  };
}

// ============================================================
// UPDATE GIFT CARD
// ============================================================

export async function updateGiftCard(admin, giftCardData) {
  const { giftCardId, customerId, note, expiresOn } = giftCardData || {};

  if (!giftCardId) {
    throw new Error("Gift Card ID is required");
  }

  const input = {};

  // Customer is optional.
  if (customerId && customerId.trim()) {
    input.customerId = customerId.trim();
  }

  // Note can be updated to an empty string.
  if (note !== undefined) {
    input.note = note;
  }

  // Expiration can be removed using null.
  if (expiresOn !== undefined) {
    input.expiresOn = expiresOn || null;
  }

  console.log("========================================");

  console.log("UPDATING GIFT CARD");

  console.log("Gift Card ID:", giftCardId);

  console.log("Input:", JSON.stringify(input, null, 2));

  console.log("========================================");

  const response = await admin.graphql(
    `#graphql
      mutation GiftCardUpdate(
        $id: ID!
        $input: GiftCardUpdateInput!
      ) {
        giftCardUpdate(
          id: $id
          input: $input
        ) {
          giftCard {
            id

            initialValue {
              amount
              currencyCode
            }

            balance {
              amount
              currencyCode
            }

            enabled

            customer {
              id
              displayName
              email
            }

            note
            expiresOn
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
        id: giftCardId,
        input,
      },
    },
  );

  const result = await response.json();

  console.log("GIFT CARD UPDATE RESPONSE:", JSON.stringify(result, null, 2));

  // GraphQL errors
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const payload = result.data?.giftCardUpdate;

  if (!payload) {
    throw new Error("Shopify did not return gift card update data");
  }

  // IMPORTANT:
  // giftCardUpdate userErrors is UserError.
  // Do NOT request/read "code".
  if (payload.userErrors?.length) {
    throw new Error(
      payload.userErrors
        .map((error) => {
          const field = error.field?.length
            ? ` (${error.field.join(".")})`
            : "";

          return `${error.message}${field}`;
        })
        .join(", "),
    );
  }

  if (!payload.giftCard) {
    throw new Error("Shopify did not return the updated gift card");
  }

  console.log("GIFT CARD UPDATED:", payload.giftCard.id);

  return payload.giftCard;
}

// ============================================================
// DEACTIVATE GIFT CARD
// ============================================================

export async function deactivateGiftCard(admin, giftCardId) {
  if (!giftCardId) {
    throw new Error("Gift Card ID is required");
  }

  console.log("========================================");

  console.log("DEACTIVATING GIFT CARD");

  console.log("Gift Card ID:", giftCardId);

  console.log("========================================");

  const response = await admin.graphql(
    `#graphql
      mutation GiftCardDeactivate(
        $id: ID!
      ) {
        giftCardDeactivate(id: $id) {
          giftCard {
            id
            enabled
            deactivatedAt
          }

          userErrors {
            field
            message
            code
          }
        }
      }
    `,
    {
      variables: {
        id: giftCardId,
      },
    },
  );

  const result = await response.json();

  console.log(
    "GIFT CARD DEACTIVATE RESPONSE:",
    JSON.stringify(result, null, 2),
  );

  // GraphQL errors
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  const payload = result.data?.giftCardDeactivate;

  if (!payload) {
    throw new Error("Shopify did not return gift card deactivation data");
  }

  if (payload.userErrors?.length) {
    throw new Error(
      payload.userErrors
        .map((error) => {
          const field = error.field?.length
            ? ` (${error.field.join(".")})`
            : "";

          const code = error.code ? ` [${error.code}]` : "";

          return `${error.message}${field}${code}`;
        })
        .join(", "),
    );
  }

  if (!payload.giftCard) {
    throw new Error("Shopify did not return the deactivated gift card");
  }

  console.log("GIFT CARD DEACTIVATED:", payload.giftCard.id);

  return payload.giftCard;
}
