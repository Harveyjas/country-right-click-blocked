import { Page, Layout, Card, Text, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

export default function FAQ() {
  return (
    <Page
      title="Frequently asked questions"
      backAction={{
        content: "Back to Dashboard",
        url: "/app",
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                General Questions
              </Text>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  What is the Country Blocker app?
                </Text>
                <Text as="p" variant="bodyMd">
                  The Country Blocker app allows you to restrict access to your Shopify store based on customer location. You can select specific countries that you want to block or allow access to your store.
                </Text>

                <Text as="h3" variant="headingSm">
                  How does the country blocking work?
                </Text>
                <Text as="p" variant="bodyMd">
                  Country blocking compares your selected countries with the country Shopify provides for the visitor's storefront localization. VPNs or proxy services may affect the country Shopify detects.
                </Text>

                <Text as="h3" variant="headingSm">
                  Can I change my country restrictions at any time?
                </Text>
                <Text as="p" variant="bodyMd">
                  Yes. Country settings save when you change them. The storefront behavior also depends on the corresponding theme block being enabled in the published theme.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Technical Questions
              </Text>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  How accurate is the country detection?
                </Text>
                <Text as="p" variant="bodyMd">
                  The app uses the country Shopify provides for storefront localization. VPNs, proxies, and a visitor's localization settings can affect that value.
                </Text>

                <Text as="h3" variant="headingSm">
                  Does the app affect my store's performance?
                </Text>
                <Text as="p" variant="bodyMd">
                  Theme blocks run on pages where you add them. You can remove a block in the theme editor if it affects your storefront or is no longer needed.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Support
              </Text>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">
                  How can I get help if I have issues?
                </Text>
                <Text as="p" variant="bodyMd">
                  If you encounter an issue, contact support at ventosupprt@gmail.com and include the affected feature and steps to reproduce it.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 
