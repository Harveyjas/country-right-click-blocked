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
    
    // Check if the shop has an active subscription and get keyboard shortcuts settings
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
          metafield(namespace: "keyboardshortcuts", key: "disabled") {
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
    
    const metafield = responseJson.data?.shop?.metafield;
    const shopDomain = responseJson.data?.shop?.myshopifyDomain;
    const activeSubscriptions = responseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    
    // Default plan values
    let hasPlan = false;
    let planType = "none"; // "none", "free", or "premium"
    
    // If there are any active subscriptions, determine the plan type
    if (activeSubscriptions.length > 0) {
      hasPlan = true;
      
      // Check for plan type based on name
      // Assuming plan names are "Forever Free" and "Forever 2.99"
      const premiumPlan = activeSubscriptions.find(sub => 
        sub.name?.toLowerCase().includes("forever 1") || 
        sub.name?.toLowerCase().includes("forever 2.99") ||
        sub.name?.toLowerCase().includes("2.99") ||
        sub.name?.toLowerCase().includes("premium")
      );
      
      const freePlan = activeSubscriptions.find(sub => 
        sub.name?.toLowerCase().includes("forever free") || 
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
    
    if (metafield && metafield.value) {
      try {
        isEnabled = JSON.parse(metafield.value);
      } catch (parseError) {
        console.error("Error parsing metafield value:", parseError);
      }
    }

    return json({ isEnabled, shopDomain, hasPlan, planType });
  } catch (error) {
    console.error("Error in loader:", error);
    return json({ 
      error: "Failed to fetch Keyboard shortcuts settings", 
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
    
    console.log("Updating keyboard shortcuts setting to:", enabled);
    
    // Check if the shop has a premium plan before allowing changes
    const planResponse = await admin.graphql(
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
    
    const planResponseJson = await planResponse.json();
    const activeSubscriptions = planResponseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    
    // Check for premium plan
    const premiumPlan = activeSubscriptions.find(sub => 
      sub.name?.toLowerCase().includes("forever 1") || 
      sub.name?.toLowerCase().includes("forever 2.99") ||
      sub.name?.toLowerCase().includes("2.99") ||
      sub.name?.toLowerCase().includes("premium")
    );
    
    // If not on premium plan, don't allow enabling this feature
    if (!premiumPlan) {
      return json({ 
        error: "This feature is only available on the Premium plan", 
        success: false 
      }, { status: 403 });
    }
    
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
              namespace: "keyboardshortcuts",
              key: "disabled",
              value: JSON.stringify(enabled),
              type: "boolean",
            },
          ],
        },
      }
    );
    
    const metafieldResponseJson = await metafieldResponse.json();
    
    if (metafieldResponseJson.errors) {
      console.error("GraphQL errors:", metafieldResponseJson.errors);
      return json({ 
        error: "Failed to save setting", 
        details: metafieldResponseJson.errors 
      }, { status: 500 });
    }
    
    if (metafieldResponseJson.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error("Metafield save errors:", metafieldResponseJson.data.metafieldsSet.userErrors);
      return json({ 
        error: "Failed to save setting", 
        details: metafieldResponseJson.data.metafieldsSet.userErrors 
      }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error("Error in action:", error);
    return json({ 
      error: "Failed to save setting", 
      details: error.message 
    }, { status: 500 });
  }
};

export default function Shortcuts() {
  const { isEnabled, error, shopDomain, hasPlan, planType } = useLoaderData();
  const [enabled, setEnabled] = useState(isEnabled);
  const [saveStatus, setSaveStatus] = useState({ success: false, error: null });
  
  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  
  // Check if we're currently submitting
  const isSaving = navigation.state === "submitting";
  
  // Check if user is on premium plan (only premium plan can use keyboard shortcuts)
  const isPremiumPlan = planType === "premium";
  const isFreePlan = planType === "free";
  
  // Sync enabled state with loader data
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
    // Only allow premium plan users to toggle this feature
    if (!isPremiumPlan) {
      setSaveStatus({
        success: false,
        error: "This feature is only available on the Premium plan"
      });
      return;
    }
    
    // Clear any previous save status
    setSaveStatus({ success: false, error: null });
    
    const newEnabledState = !enabled;
    
    const formData = new FormData();
    formData.append("enabled", newEnabledState.toString());
    
    submit(formData, { method: "post" });
  }, [enabled, isPremiumPlan, submit]);
  
  const handleEmbedShortcutClick = useCallback(() => {
    // Only allow premium plan users to access this feature
    if (!isPremiumPlan) {
      setSaveStatus({
        success: false,
        error: "This feature is only available on the Premium plan"
      });
      return;
    }
    
    try {
      if (!shopDomain) {
        console.error('Shop information not available');
        return;
      }
      
      // Extract the shop name without .myshopify.com
      const shopName = shopDomain.replace('.myshopify.com', '');
      
      // Construct the URL using admin.shopify.com format

      const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=d7c3a32f-9572-4caf-aadd-ab0a618f3c30/disable_shortcuts`;
      console.log('Opening URL:', embedUrl);
      console.log('shopNameeeee',shopName)
      
      // Open in a new tab
      window.open(embedUrl, '_blank');
    } catch (error) {
      console.error('Error opening theme editor:', error);
    }
  }, [shopDomain, isPremiumPlan]);
  
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
      title="Keyboard Shortcuts Blocker"
      primaryAction={{
        content: "Manage Subscription",
        onAction: handleManagePricingClick,
        variant: "primary",
      }}
    >
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                
                {!hasPlan && (
                  <Banner status="warning">
                    <Text as="p" variant="bodyMd">
                      You need to select a subscription plan to use this feature.
                    </Text>
                    <Button onClick={handleManagePricingClick} variant="primary">
                      Manage Subscription
                    </Button>
                  </Banner>
                )}
                
                {isFreePlan && (
                  <Banner status="info">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        You are on the <strong>Forever Free</strong> plan.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        <strong>Note:</strong> Keyboard shortcuts blocking is a premium feature. Upgrade to the premium plan to access this functionality.
                      </Text>
                      <Button onClick={handleManagePricingClick} variant="primary">
                        Upgrade to Premium
                      </Button>
                    </BlockStack>
                  </Banner>
                )}
                
                {/* {isPremiumPlan && (
                  <Banner status="success">
                    <Text as="p" variant="bodyMd">
                      You are on the <strong>Premium</strong> plan with full access to all features.
                    </Text>
                  </Banner>
                )} */}
                
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
                Enable this setting to prevent users from using keyboard shortcuts like Ctrl+C, Ctrl+X, Ctrl+U, and F12 on your website or specific pages.
                </Text>
                
                <div style={{ opacity: isPremiumPlan ? 1 : 0.5 }}>
                  <SettingToggle
                    action={{
                      content: enabled ? "Disable" : "Enable",
                      onAction: handleToggle,
                      loading: isSaving,
                      disabled: !isPremiumPlan,
                      variant: "primary"
                    }}
                    enabled={enabled && isPremiumPlan}
                  >
                    <Text variant="headingMd" as="h6">
                      Disable Keyboard Shortcuts
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {enabled && isPremiumPlan
                        ? "Keyboard shortcuts are currently disabled on your website." 
                        : "Enable to disable keyboard shortcuts like Ctrl+C, Ctrl+U, F12 on your website."}
                    </Text>
                  </SettingToggle>
                </div>

                <Text as="p" variant="bodyMd">
                This feature helps you enhance security, reduce content copying, and limit access to developer tools.
                
                </Text>
                
                {enabled && isPremiumPlan && (
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      Shortcuts Disabled
                    </Text>
                    
                    <Text as="p" variant="bodyMd">
                      The following keyboard shortcuts are now disabled on your website:
                    </Text>
                    
                    <BlockStack gap="200">
                      <Text as="h4" variant="bodySm" fontWeight="bold">Content Protection:</Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+C</strong> (Copy)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+X</strong> (Cut)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+A</strong> (Select All)</Text></li>
                      </ul>
                      
                      <Text as="h4" variant="bodySm" fontWeight="bold">Source Code Protection:</Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+U</strong> (View Source)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+S</strong> (Save Page)</Text></li>
                      </ul>
                      
                      <Text as="h4" variant="bodySm" fontWeight="bold">Developer Tools:</Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>F12</strong> (Developer Tools)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+Shift+I</strong> (Inspect Element)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+Shift+J</strong> (JavaScript Console)</Text></li>
                      </ul>
                      
                      <Text as="h4" variant="bodySm" fontWeight="bold">Other Restrictions:</Text>
                      <ul>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+P</strong> (Print)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Shift+F10</strong> (Context Menu)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Right-click</strong> (Context Menu)</Text></li>
                        <li><Text as="span" variant="bodyMd"><strong>Ctrl+R</strong> / <strong>F5</strong> (Reload Page)</Text></li>
                      </ul>
                    </BlockStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
            <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Theme Integration
                  </Text>
                  <div style={{ opacity: isPremiumPlan ? 1 : 0.5 }}>
                    <Banner status={isPremiumPlan ? "info" : "warning"}>
                      <BlockStack gap="300">
                        <Text as="p" variant="bodyMd">
                          {isPremiumPlan 
                            ? "Add the keyboard shortcuts blocker to your theme:" 
                            : "This feature is only available on the Premium plan."}
                        </Text>
                        <Button onClick={handleEmbedShortcutClick} variant="primary" disabled={!isPremiumPlan}>
                          Open Theme Editor
                        </Button>
                        {isPremiumPlan && (
                          <Text as="p" variant="bodySm" color="subdued">
                            This will open your theme editor where you can add the keyboard shortcuts blocker to your store's sections.
                          </Text>
                        )}
                      </BlockStack>
                    </Banner>
                  </div>
                </BlockStack>
            </Card>
            </BlockStack>
          </Layout.Section>
          {/* <Layout.Section secondary>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Premium Features
                </Text>
                <Text as="p" variant="bodyMd">
                  The Keyboard Shortcuts Blocker is a premium feature that helps protect your content and enhance security.
                </Text>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">
                    Premium Plan Benefits:
                  </Text>
                  <ul>
                    <li><Text as="span" variant="bodyMd">Disable keyboard shortcuts</Text></li>
                    <li><Text as="span" variant="bodyMd">Prevent right-click context menu</Text></li>
                    <li><Text as="span" variant="bodyMd">Block developer tools access</Text></li>
                    <li><Text as="span" variant="bodyMd">Unlimited country blocking</Text></li>
                    <li><Text as="span" variant="bodyMd">Priority support</Text></li>
                  </ul>
                </BlockStack>
                {!isPremiumPlan && (
                  <Button onClick={handleManagePricingClick} variant="primary" fullWidth>
                    Upgrade to Premium
                  </Button>
                )}
              </BlockStack>
            </Card>
          </Layout.Section> */}
        </Layout>
      </BlockStack>
    </Page>
  );
}