import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, BlockStack, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { PrivacyPolicyContent } from "../components/PrivacyPolicyContent";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const appUrl = process.env.SHOPIFY_APP_URL || new URL(request.url).origin;
  const publicPrivacyPolicyUrl = `${appUrl.replace(/\/$/, "")}/privacy-policy`;

  return json({ publicPrivacyPolicyUrl });
};

export default function PrivacyPolicy() {
  const { publicPrivacyPolicyUrl } = useLoaderData();

  return (
    <Page
      title="Privacy Policy"
      backAction={{
        content: "Back to Dashboard",
        url: "/app",
      }}
    >
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <p>
              Use this public URL in your Shopify App Store listing:{" "}
              <a href={publicPrivacyPolicyUrl} target="_blank" rel="noopener noreferrer">
                {publicPrivacyPolicyUrl}
              </a>
            </p>
          </Banner>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <PrivacyPolicyContent />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
