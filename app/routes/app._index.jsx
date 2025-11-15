import { Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
} from "@shopify/polaris";

export default function Index() {
  return (
    <Page title="Dashboard">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Country Blocker
                </Text>
                <Link to="/app/country-blocker">
                  <Button variant="primary">Configure Country Blocker</Button>
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Redirection Rules
                </Text>
                <Link to="/app/redirection-rules">
                  <Button variant="primary">Configure Redirection Rules</Button>
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}