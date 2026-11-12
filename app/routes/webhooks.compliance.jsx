import { authenticate } from "../shopify.server";
import db from "../db.server";

// Shopify requires an acknowledged response for all three mandatory privacy
// topics. This app does not persist customer data; shop/redact removes sessions.
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  if (topic === "SHOP_REDACT" && shop) {
    await db.session.deleteMany({ where: { shop } });
  }

  return new Response(null, { status: 200 });
};
