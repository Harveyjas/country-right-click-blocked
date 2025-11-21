import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useActionData, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  Banner,
  SettingToggle,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    // Get shop data from session
    const shop = session.shop;
    
    // Check if the shop has an active subscription and get bot blocker settings
    const response = await admin.graphql(
      `#graphql
      query getAppSubscriptionAndSettings {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
        shop {
          id
          myshopifyDomain
          metafield(namespace: "botblocker", key: "enabled") {
            value
          }
        }
      }`
    );
    
    const responseJson = await response.json();
    console.log("Subscription and settings response:", responseJson);
    
    if (responseJson.errors) {
      console.error("GraphQL errors:", responseJson.errors);
      return json({ 
        error: "Failed to fetch subscription status", 
        details: responseJson.errors,
        hasPlan: false,
        planType: "none"
      }, { status: 500 });
    }
    
    const botBlockerMetafield = responseJson.data?.shop?.metafields?.edges?.find(
      edge => edge.node.namespace === "botblocker" && edge.node.key === "enabled"
    )?.node;
    
    const shopDomain = responseJson.data?.shop?.myshopifyDomain;
    const activeSubscriptions = responseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    
    // Default plan values
    let hasPlan = false;
    let planType = "none"; // "none", "free", or "premium"
    
    // If there are any active subscriptions, determine the plan type
    if (activeSubscriptions.length > 0) {
      hasPlan = true;
      
      // Check for plan type based on name
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
      
      console.log('Active subscription found:', planType);
    }
    
    // Default to false if no metafield exists
    let isEnabled = false;
    
    // Get the enabled status
    const enabledMetafield = responseJson.data?.shop?.metafield?.find(
      m => m.namespace === "botblocker" && m.key === "enabled"
    );
    
    if (enabledMetafield && enabledMetafield.value) {
      try {
        isEnabled = JSON.parse(enabledMetafield.value);
      } catch (parseError) {
        console.error("Error parsing metafield value:", parseError);
      }
    }

    return json({ isEnabled, shopDomain, hasPlan, planType });
  } catch (error) {
    console.error("Error in loader:", error);
    return json({ 
      error: "Failed to fetch Bot Blocker settings", 
      details: error.message,
      hasPlan: false,
      planType: "none"
    }, { status: 500 });
  }
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    
    // Get the form data
    const formData = await request.formData();
    const enabled = formData.get("enabled") === "true";
    
    console.log("Updating bot blocker settings:", { enabled });
    
    // Get the shop ID
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
      console.error("GraphQL errors:", responseJson.errors);
      return json({ error: "Failed to get shop ID", details: responseJson.errors }, { status: 500 });
    }
    
    const shopId = responseJson.data?.shop?.id;
    if (!shopId) {
      console.error("No shop ID found");
      return json({ error: "Failed to get shop ID" }, { status: 500 });
    }
    
    // Create or update the metafield
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
              namespace: "botblocker",
              key: "enabled",
              value: JSON.stringify(enabled),
              type: "boolean",
            }
          ],
        },
      }
    );
    
    const metafieldResponseJson = await metafieldResponse.json();
    
    if (metafieldResponseJson.errors) {
      console.error("GraphQL errors:", metafieldResponseJson.errors);
      return json({ 
        error: "Failed to save settings", 
        details: metafieldResponseJson.errors 
      }, { status: 500 });
    }
    
    if (metafieldResponseJson.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("Metafield save errors:", metafieldResponseJson.data.metafieldsSet.userErrors);
      return json({ 
        error: "Failed to save settings", 
        details: metafieldResponseJson.data.metafieldsSet.userErrors 
      }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error("Error in action:", error);
    return json({ 
      error: "Failed to save settings", 
      details: error.message 
    }, { status: 500 });
  }
};

export default function BotBlocker() {
  const { isEnabled, error, shopDomain, hasPlan, planType } = useLoaderData();
  const [enabled, setEnabled] = useState(isEnabled);
  const [saveStatus, setSaveStatus] = useState({ success: false, error: null });
  
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  
  // Check if we're currently submitting
  const isSaving = navigation.state === "submitting";
  
  // Sync state with loader data
  useEffect(() => {
    setEnabled(isEnabled);
  }, [isEnabled]);
  
  // Handle action response
  useEffect(() => {
    if (actionData && navigation.state === "idle") {
      if (actionData.success) {
        setSaveStatus({ success: true, error: null });
      } else if (actionData.error) {
        setSaveStatus({ success: false, error: actionData.error });
      }
    }
  }, [actionData, navigation.state]);
  
  // Clear save status after a few seconds
  useEffect(() => {
    if (saveStatus.success || saveStatus.error) {
      const timer = setTimeout(() => {
        setSaveStatus({ success: false, error: null });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);
  
  const handleToggle = useCallback(() => {
    // Clear any previous save status
    setSaveStatus({ success: false, error: null });
    
    const newEnabledState = !enabled;
    setEnabled(newEnabledState);
    
    const formData = new FormData();
    formData.append("enabled", newEnabledState.toString());
    
    submit(formData, { method: "post" });
  }, [enabled, submit]);
  
  const handleEmbedBotBlockerClick = useCallback(() => {
    try {
      if (!shopDomain) {
        console.error('Shop information not available');
        return;
      }
      
      // Extract the shop name without .myshopify.com
      const shopName = shopDomain.replace('.myshopify.com', '');
      
      // Construct the URL using admin.shopify.com format
      const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=d7c3a32f-9572-4caf-aadd-ab0a618f3c30/bot_blocker`;
      console.log('Opening URL:', embedUrl);
      
      // Open in a new tab
      window.open(embedUrl, '_blank');
    } catch (error) {
      console.error('Error opening theme editor:', error);
    }
  }, [shopDomain]);
  
  const handleManagePricingClick = useCallback(() => {
    try {
      if (!shopDomain) {
        console.error('Shop information not available');
        return;
      }
      
      // Extract the shop name without .myshopify.com
      const shopName = shopDomain.replace('.myshopify.com', '');
      
      // Construct the URL for the pricing plans page
      const pricingUrl = `https://admin.shopify.com/store/${shopName}/charges/insta-18/pricing_plans`;
      console.log('Opening pricing URL:', pricingUrl);
      
      // Open in a new tab
      window.open(pricingUrl, '_blank');
    } catch (error) {
      console.error('Error opening pricing page:', error);
    }
  }, [shopDomain]);
  
  return (
    <Page
      title="Bot Blocker"
      primaryAction={{
        content: "Manage Subscription",
        onAction: handleManagePricingClick,
      }}
    >
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                
                {saveStatus.success && (
                  <Banner status="success">
                    <Text as="p" variant="bodyMd">
                      Settings saved successfully!
                    </Text>
                  </Banner>
                )}
                
                {saveStatus.error && (
                  <Banner status="critical">
                    <Text as="p" variant="bodyMd">
                      {saveStatus.error}
                    </Text>
                  </Banner>
                )}
                
                <Text as="p" variant="bodyMd">
                  Enable this setting to block search engine bots and crawlers from accessing your website. This can help protect your content from being indexed or scraped.
                </Text>
                
                <Banner status="info">
                  <Text as="p" variant="bodyMd">
                    <strong>Advanced Bot Detection:</strong> Our bot blocker uses a combination of user agent detection and honeypot traps to identify and block bots more effectively than traditional methods.
                  </Text>
                </Banner>
                
                <SettingToggle
                  action={{
                    content: enabled ? "Disable" : "Enable",
                    onAction: handleToggle,
                    loading: isSaving,
                    ...(enabled && {
                      variant: "primary",
                      tone: "success"
                    })
                  }}
                  enabled={enabled}
                >
                  <Text variant="headingMd" as="h6">
                    Block Bots
                  </Text>
                  <Text variant="bodyMd" as="p">
                    {enabled
                      ? "Bot blocking is currently enabled on your website." 
                      : "Enable to block search engine bots and crawlers from accessing your website."}
                  </Text>
                </SettingToggle>
                
                {enabled && (
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Bot Detection Methods
                    </Text>
                    
                    <Text as="p" variant="bodyMd">
                      Our bot blocker uses multiple detection methods for maximum effectiveness:
                    </Text>
                    
                    <BlockStack gap="200">
                      <Text as="h4" variant="bodySm" fontWeight="bold">1. User Agent Detection</Text>
                      <Text as="p" variant="bodyMd">
                        Blocks common bot user agents including:
                      </Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>Googlebot</strong> - Google's web crawler</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Bingbot</strong> - Microsoft Bing's web crawler</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Slurp</strong> - Yahoo's web crawler</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>DuckDuckBot</strong> - DuckDuckGo's web crawler</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Baiduspider</strong> - Baidu's web crawler</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>YandexBot</strong> - Yandex's web crawler</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>And many others...</strong></Text></li>
                      </ul>
                      
                      <Text as="h4" variant="bodySm" fontWeight="bold">2. Honeypot Traps</Text>
                      <Text as="p" variant="bodyMd">
                        Hidden elements that only bots interact with:
                      </Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>Hidden Links</strong> - Invisible links that bots may click</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Hidden Forms</strong> - Form fields that humans can't see</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Input Traps</strong> - Text fields that trigger when filled</Text></li>
                      </ul>
                      
                      <Text as="h4" variant="bodySm" fontWeight="bold">3. Advanced Behavioral Analysis</Text>
                      <Text as="p" variant="bodyMd">
                        Sophisticated detection methods for modern bots:
                      </Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>Headless Browser Detection</strong> - Identifies browsers without UI</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>User Interaction Analysis</strong> - Monitors mouse, keyboard, and touch events</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Browser Fingerprinting</strong> - Checks for automation indicators</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Screen Dimension Analysis</strong> - Detects unusual display properties</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>API Availability Checks</strong> - Verifies expected browser features</Text></li>
                      </ul>
                      
                      <Text as="p" variant="bodyMd">
                        Continuous monitoring of user behavior patterns to identify suspicious activity in real-time.
                      </Text>
                    </BlockStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Theme Integration
                </Text>
                <Banner status="info">
                  <BlockStack gap="300">
                    <Text as="p" variant="bodyMd">
                      Add the bot blocker to your theme:
                    </Text>
                    <Button 
                      onClick={handleEmbedBotBlockerClick} 
                      primary 
                    >
                      Open Theme Editor
                    </Button>
                    <Text as="p" variant="bodySm" color="subdued">
                      This will open your theme editor where you can add the bot blocker to your store's sections.
                    </Text>
                  </BlockStack>
                </Banner>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section secondary>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Bot Blocker Features
                </Text>
                <Text as="p" variant="bodyMd">
                  The Bot Blocker helps protect your content from being indexed or scraped by search engines and other bots.
                </Text>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Benefits:
                  </Text>
                  <ul>
                    <li><Text as="span" variant="bodyMd">Multi-layered bot detection (User Agent + Honeypots + Behavioral Analysis)</Text></li>
                    <li><Text as="span" variant="bodyMd">Advanced headless browser detection</Text></li>
                    <li><Text as="span" variant="bodyMd">Real-time user interaction monitoring</Text></li>
                    <li><Text as="span" variant="bodyMd">Prevent content indexing by search engines</Text></li>
                    <li><Text as="span" variant="bodyMd">Protect against content scraping and theft</Text></li>
                    <li><Text as="span" variant="bodyMd">Block sophisticated bots that spoof user agents</Text></li>
                    <li><Text as="span" variant="bodyMd">Browser fingerprinting for automation detection</Text></li>
                    <li><Text as="span" variant="bodyMd">Reduce server load from bot traffic</Text></li>
                  </ul>
                </BlockStack>
                <Text as="p" variant="bodyMd">
                  <strong>Note:</strong> Blocking search engine bots will prevent your pages from appearing in search results. Only use this feature if you want to keep your content private.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}