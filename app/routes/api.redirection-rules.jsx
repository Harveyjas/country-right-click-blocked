import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
        query {
          shop {
            id
            metafield(namespace: "countryblocker", key: "redirection-rules") {
              value
            }
          }
        }
      `
    );

    const responseJson = await response.json();
    
    if (responseJson.errors) {
      return json({ error: "Failed to fetch redirection rules", details: responseJson.errors }, { status: 500 });
    }

    const metafield = responseJson.data?.shop?.metafield;
    
    if (!metafield) {
      return json({ redirectionRules: [] });
    }

    try {
      const parsedValue = JSON.parse(metafield.value);
      return json({ redirectionRules: parsedValue });
    } catch (parseError) {
      return json({ redirectionRules: [] });
    }
  } catch (error) {
    return json({ 
      error: "Failed to fetch redirection rules", 
      details: error.message 
    }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();
    let redirectionRules = [];
    
    if (typeof body.redirectionRules === 'string') {
      redirectionRules = JSON.parse(body.redirectionRules);
    } else {
      redirectionRules = body.redirectionRules || [];
    }

    const response = await admin.graphql(
      `#graphql
        query {
          shop {
            id
          }
        }
      `
    );

    const responseJson = await response.json();

    if (responseJson.errors) {
      return json({ error: "Failed to get shop ID", details: responseJson.errors }, { status: 500 });
    }

    const shopId = responseJson.data?.shop?.id;
    if (!shopId) {
      return json({ error: "Failed to get shop ID" }, { status: 500 });
    }

    const formattedRules = redirectionRules.reduce((acc, rule) => {
      if (rule.countries && Array.isArray(rule.countries)) {
        rule.countries.forEach(country => {
          acc[country.code] = rule.url;
        });
      }
      return acc;
    }, {});

    const metafieldResponse = await admin.graphql(
      `#graphql
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              value
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
          metafields: [
            {
              ownerId: shopId,
              namespace: "countryblocker",
              key: "redirection-rules",
              value: JSON.stringify(formattedRules),
              type: "json",
            },
          ],
        },
      }
    );

    const metafieldResponseJson = await metafieldResponse.json();

    if (metafieldResponseJson.errors) {
      return json({ 
        error: "Failed to save redirection rules", 
        details: metafieldResponseJson.errors 
      }, { status: 500 });
    }

    if (metafieldResponseJson.data?.metafieldsSet?.userErrors?.length > 0) {
      return json({ 
        error: "Failed to save redirection rules", 
        details: metafieldResponseJson.data.metafieldsSet.userErrors 
      }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    return json({ 
      error: "Failed to save redirection rules", 
      details: error.message 
    }, { status: 500 });
  }
};
