import { Link, useLoaderData } from "@remix-run/react";
import { useCallback } from "react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  InlineStack,
  Badge,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  const shop = session.shop;
  let hasPlan = false;
  let planType = "none";
  
  try {
    const response = await admin.graphql(
      `#graphql
      query getAppSubscription {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
      }`
    );
    
    const responseJson = await response.json();
    const activeSubscriptions = responseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    
    if (activeSubscriptions.length > 0) {
      hasPlan = true;
      
      const premiumPlan = activeSubscriptions.find(sub => 
        sub.name?.toLowerCase().includes("forever 1") || 
        sub.name?.toLowerCase().includes("forever 2.99") ||
        sub.name?.toLowerCase().includes("2.99") ||
        sub.name?.toLowerCase().includes("growth") ||
        sub.name?.toLowerCase().includes("premium")
      );
      
      const freePlan = activeSubscriptions.find(sub => 
        sub.name?.toLowerCase().includes("forever free") || 
        sub.name?.toLowerCase().includes("essential") ||
        sub.name?.toLowerCase().includes("free")
      );
      
      if (premiumPlan) {
        planType = "premium";
      } else if (freePlan) {
        planType = "free";
      }
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    hasPlan = false;
    planType = "none";
  }
  
  return json({
    shop,
    hasPlan,
    planType,
  });
};

export default function Index() {
  const { shop, hasPlan, planType } = useLoaderData();

  const handleManagePricingClick = useCallback(() => {
    try {
      if (!shop) {
        console.error('Shop information not available');
        return;
      }

      const shopName = shop.replace('.myshopify.com', '');
      const pricingUrl = `https://admin.shopify.com/store/${shopName}/charges/insta-18/pricing_plans`;
      
      window.open(pricingUrl, '_blank');
    } catch (error) {
      console.error('Error opening pricing page:', error);
    }
  }, [shop]);

  return (
    <Page title="Dashboard">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Welcome to your Country Restrictions Dashboard
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Manage your store's geographic restrictions, redirections, and security settings. Start by selecting a feature below.
                  </Text>
                </BlockStack>
                
                {!hasPlan && (
                  <Banner status="warning">
                    <Text as="p" variant="bodyMd">
                      You don't have an active subscription yet. Choose a plan to unlock all features.
                    </Text>
                  </Banner>
                )}
                
                {hasPlan && (
                  <Banner status="success">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        ✓ You have an active <strong>{planType === "premium" ? "Growth" : "Essential"}</strong> plan
                      </Text>
                    </BlockStack>
                  </Banner>
                )}
                
                <InlineStack gap="300" align="end">
                  <Button onClick={handleManagePricingClick} variant="primary">
                    {hasPlan ? "Manage Subscription" : "Choose Plan"}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <div style={{ textAlign: "center", paddingBottom: "20px" }}>
                  <Text as="h1" variant="headingXl" tone="subdued">
                    🌍 Country Blocker & Smart Redirection
                  </Text>
                  <Text tone="subdued" as="p" style={{ marginTop: "10px" }}>
                    Advanced geographic control for your Shopify store
                  </Text>
                </div>
                <InlineStack align="center" gap="300" wrap>
                  <Badge tone="success">🚀 Powerful</Badge>
                  <Badge tone="info">⚡ Fast</Badge>
                  <Badge tone="warning">🔒 Secure</Badge>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section oneThird>
            <Card>
              <BlockStack gap="400">
                <div style={{ textAlign: "center" }}>
                  <Text as="h2" variant="headingMd">
                    🚫 Country Blocker
                  </Text>
                </div>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    <strong>Restrict access by geography</strong>
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Block specific countries from accessing your store
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Prevent unauthorized geographic markets
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Comply with regional regulations
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Reduce fraud and chargeback risks
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Protect your brand in specific territories
                  </Text>
                </BlockStack>
                <Link to="/app/country-blocker">
                  <Button variant="primary" fullWidth>
                    Configure Blocker
                  </Button>
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section oneThird>
            <Card>
              <BlockStack gap="400">
                <div style={{ textAlign: "center" }}>
                  <Text as="h2" variant="headingMd">
                    🔄 Smart Redirection
                  </Text>
                </div>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    <strong>Redirect users to perfect stores</strong>
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Automatically route users to localized stores
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Improve user experience with local content
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Increase conversions with local currency
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Multi-store management made simple
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Seamless regional targeting
                  </Text>
                </BlockStack>
                <Link to="/app/redirection-rules">
                  <Button variant="primary" fullWidth>
                    Setup Rules
                  </Button>
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section oneThird>
            <Card>
              <BlockStack gap="400">
                <div style={{ textAlign: "center" }}>
                  <Text as="h2" variant="headingMd">
                    ⌨️ Keyboard Shortcuts
                  </Text>
                </div>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    <strong>Protect your store integrity</strong>
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Disable browser dev tools shortcuts
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Prevent unauthorized inspections
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Protect custom code and logic
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Reduce competitive intelligence theft
                  </Text>
                  <Text as="p" variant="bodySm">
                    ✓ Enhanced security for premium stores
                  </Text>
                </BlockStack>
                <Link to="/app/keyboard-shortcuts">
                  <Button variant="primary" fullWidth>
                    Disable Shortcuts
                  </Button>
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>


      </BlockStack>
    </Page>
  );
}