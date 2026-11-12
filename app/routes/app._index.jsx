import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Page, Layout, Card, Text, BlockStack, Button, InlineStack, Spinner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`#graphql
    query getDashboardSettings {
      shop {
        blockedCountries: metafield(namespace: "countryselector", key: "selected-country") { value }
        redirectionRules: metafield(namespace: "countryblocker", key: "redirection-rules") { value }
      }
    }
  `);
  const result = await response.json();
  const shopData = result.data?.shop;
  let blockedCountryCount = 0;
  let redirectionRuleCount = 0;
  try {
    blockedCountryCount = JSON.parse(shopData?.blockedCountries?.value || "[]").length;
    redirectionRuleCount = JSON.parse(shopData?.redirectionRules?.value || "[]").length;
  } catch {
    // Keep the dashboard available if legacy settings contain invalid JSON.
  }
  return json({ blockedCountryCount, redirectionRuleCount });
};

export default function Index() {
  const { blockedCountryCount, redirectionRuleCount } = useLoaderData();
  const [extensionStatus, setExtensionStatus] = useState({ state: "checking" });

  useEffect(() => {
    let isMounted = true;
    const checkExtensions = async () => {
      try {
        const extensions = await window.shopify?.app?.extensions();
        const themeExtensions = extensions?.filter((extension) => extension.type === "theme_app_extension") || [];
        const statuses = { state: "ready" };
        for (const extension of themeExtensions) {
          for (const activation of extension.activations || []) {
            if (["country_blocker", "redirection_popup", "disable_shortcuts"].includes(activation.handle)) {
              statuses[activation.handle] = activation.status === "active"
                ? "Active"
                : activation.status === "unavailable"
                  ? "Unavailable"
                  : "Not active";
            }
          }
        }
        for (const handle of ["country_blocker", "redirection_popup", "disable_shortcuts"]) {
          statuses[handle] ||= "Not found";
        }
        if (isMounted) setExtensionStatus(statuses);
      } catch {
        if (isMounted) setExtensionStatus({ state: "unavailable" });
      }
    };
    checkExtensions();
    return () => { isMounted = false; };
  }, []);

  return (
    <Page title="Store protection">
      <BlockStack gap="400">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Setup status</Text>
                <Text as="p" variant="bodyMd">
                  Theme blocks: {extensionStatus.state === "checking" ? "Checking status…" : extensionStatus.state === "unavailable" ? "Status unavailable" : `Country blocker ${extensionStatus.country_blocker}; redirection popup ${extensionStatus.redirection_popup}; keyboard shortcuts ${extensionStatus.disable_shortcuts}`}
                </Text>
                <InlineStack gap="400" wrap>
                  <Text as="p" variant="bodyMd">Countries selected: {blockedCountryCount}</Text>
                  <Text as="p" variant="bodyMd">Redirection rules: {redirectionRuleCount}</Text>
                </InlineStack>
                {extensionStatus.state === "checking" && <Spinner accessibilityLabel="Checking theme extension status" size="small" />}
                <Text as="p" variant="bodySm" tone="subdued">
                  Extension status reflects the published theme. Open the relevant settings page to add or enable blocks.
                </Text>
                <InlineStack gap="300" wrap>
                  <Link to="/app/country-blocker"><Button variant="primary">Set up country blocking</Button></Link>
                  <Link to="/app/redirection-rules"><Button>Manage redirection rules</Button></Link>
                  <Link to="/app/shortcuts"><Button>Keyboard shortcut settings</Button></Link>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
