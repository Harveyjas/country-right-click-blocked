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
  Box,
  Badge,
  Icon,
  Divider,
} from "@shopify/polaris";
import {
  LockIcon,
  ThemeIcon,
  ShieldCheckMarkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@shopify/polaris-icons";
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
      // Assuming plan names are "Forever Free", "Essential", "Forever 2.99", and "Growth"
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
    
    if (metafield && metafield.value) {
      try {
        isEnabled = JSON.parse(metafield.value);
      } catch (parseError) {
        console.error("Error parsing metafield value:", parseError);
      }
    }

    return json({ isEnabled, shopDomain, apiKey: process.env.SHOPIFY_API_KEY || "", hasPlan, planType });
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
      sub.name?.toLowerCase().includes("growth") ||
      sub.name?.toLowerCase().includes("premium")
    );
    
    // If not on premium plan, don't allow enabling this feature
    if (!premiumPlan) {
      return json({ 
        error: "This feature is only available on the Growth plan", 
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

const PROTECTION_GROUPS = [
  {
    title: "Content protection",
    items: [
      { keys: "Ctrl+C", label: "Copy" },
      { keys: "Ctrl+X", label: "Cut" },
      { keys: "Ctrl+A", label: "Select all" },
    ],
  },
  {
    title: "Source code",
    items: [
      { keys: "Ctrl+U", label: "View source" },
      { keys: "Ctrl+S", label: "Save page" },
    ],
  },
  {
    title: "Developer tools",
    items: [
      { keys: "F12", label: "Developer tools" },
      { keys: "Ctrl+Shift+I", label: "Inspect element" },
      { keys: "Ctrl+Shift+J", label: "JavaScript console" },
    ],
  },
  {
    title: "Other restrictions",
    items: [
      { keys: "Ctrl+P", label: "Print" },
      { keys: "Shift+F10", label: "Context menu" },
      { keys: "Right-click", label: "Context menu" },
      { keys: "Ctrl+R / F5", label: "Reload page" },
    ],
  },
];

function PlanBadge({ hasPlan, isPremiumPlan, isFreePlan }) {
  if (!hasPlan) {
    return <Badge tone="warning">No plan</Badge>;
  }
  if (isPremiumPlan) {
    return <Badge tone="success">Growth</Badge>;
  }
  if (isFreePlan) {
    return <Badge tone="info">Essential</Badge>;
  }
  return <Badge>Plan active</Badge>;
}

function StatusOverview({
  enabled,
  isPremiumPlan,
  hasPlan,
  isFreePlan,
  isSaving,
}) {
  const protectionOn = enabled && isPremiumPlan;

  let headline = "Content protection";
  let detail = "Discourage casual copying with right-click and shortcut blocking.";

  if (!hasPlan) {
    detail = "Select a subscription plan, then upgrade to Growth to use this feature.";
  } else if (isFreePlan) {
    detail = "Available on the Growth plan. Upgrade to enable storefront protection.";
  } else if (protectionOn) {
    detail = "Protection is on. Right-click and selected shortcuts are blocked once the theme block is live.";
  } else if (isPremiumPlan) {
    detail = "Turn protection on, then enable the app block in your theme editor.";
  }

  return (
    <Card padding="0">
      <Box padding="400">
        <InlineStack align="space-between" blockAlign="start" wrap gap="400">
          <InlineStack gap="300" blockAlign="start" wrap={false}>
            <Box
              background={
                protectionOn
                  ? "bg-fill-success-secondary"
                  : "bg-fill-warning-secondary"
              }
              padding="200"
              borderRadius="200"
              minHeight="40px"
              minWidth="40px"
            >
              <InlineStack align="center" blockAlign="center">
                <Icon
                  source={protectionOn ? ShieldCheckMarkIcon : LockIcon}
                  tone={protectionOn ? "success" : "warning"}
                />
              </InlineStack>
            </Box>
            <BlockStack gap="100">
              <InlineStack gap="200" blockAlign="center" wrap>
                <Text as="h2" variant="headingMd">
                  {headline}
                </Text>
                <PlanBadge
                  hasPlan={hasPlan}
                  isPremiumPlan={isPremiumPlan}
                  isFreePlan={isFreePlan}
                />
                {isSaving && (
                  <Badge tone="info" size="small">
                    Saving…
                  </Badge>
                )}
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {detail}
              </Text>
            </BlockStack>
          </InlineStack>

          <Box
            background="bg-surface-secondary"
            padding="300"
            borderRadius="200"
            minWidth="120px"
          >
            <BlockStack gap="050">
              <Text as="p" variant="headingXl" fontWeight="semibold" alignment="center">
                {protectionOn ? "On" : "Off"}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                {protectionOn ? "Protection active" : "Not enabled"}
              </Text>
            </BlockStack>
          </Box>
        </InlineStack>
      </Box>
    </Card>
  );
}

function ThemeIntegrationCard({ isPremiumPlan, onEmbedClick }) {
  return (
    <Card padding="0">
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack gap="300" blockAlign="start" wrap={false}>
            <Box
              background="bg-fill-success-secondary"
              padding="200"
              borderRadius="200"
              minHeight="40px"
              minWidth="40px"
            >
              <InlineStack align="center" blockAlign="center">
                <Icon source={ThemeIcon} tone="success" />
              </InlineStack>
            </Box>
            <BlockStack gap="050">
              <Text as="h2" variant="headingMd">
                Theme integration
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Add the Content protection block so settings apply on your live storefront.
              </Text>
            </BlockStack>
          </InlineStack>

          {!isPremiumPlan ? (
            <Box background="bg-surface-warning" padding="300" borderRadius="200">
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Growth plan required
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Upgrade to Growth to unlock theme integration for content protection.
                </Text>
              </BlockStack>
            </Box>
          ) : (
            <BlockStack gap="300">
              <Box
                background="bg-surface-secondary"
                padding="300"
                borderRadius="200"
              >
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <Badge tone="info">1</Badge>
                    <Text as="p" variant="bodySm">
                      Open the theme editor for your published theme
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <Badge tone="info">2</Badge>
                    <Text as="p" variant="bodySm">
                      Enable the Content protection app block
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <Badge tone="info">3</Badge>
                    <Text as="p" variant="bodySm">
                      Save — shortcut blocking goes live on the storefront
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>

              <Button
                onClick={onEmbedClick}
                variant="primary"
                size="large"
                fullWidth
                disabled={!isPremiumPlan}
              >
                Open theme editor
              </Button>
            </BlockStack>
          )}
        </BlockStack>
      </Box>
      {isPremiumPlan && (
        <>
          <Divider />
          <Box padding="300" paddingInline="400" background="bg-surface-secondary">
            <InlineStack gap="200" blockAlign="center" wrap={false}>
              <Icon source={CheckCircleIcon} tone="success" />
              <Text as="p" variant="bodySm" tone="subdued">
                Toggle protection above, then enable the block once to go live.
              </Text>
            </InlineStack>
          </Box>
        </>
      )}
    </Card>
  );
}

function HowItWorksCard() {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack gap="200" blockAlign="center">
          <Icon source={InfoIcon} tone="base" />
          <Text as="h2" variant="headingSm">
            How it works
          </Text>
        </InlineStack>
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            When enabled, common copy shortcuts and right-click are blocked for visitors on your storefront.
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            This discourages casual copying — it does not guarantee security or stop determined users.
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

function ShortcutChip({ keys, label }) {
  return (
    <Box
      background="bg-surface-secondary"
      padding="200"
      paddingInline="300"
      borderRadius="200"
    >
      <InlineStack gap="200" blockAlign="center" wrap={false}>
        <Badge>{keys}</Badge>
        <Text as="span" variant="bodySm">
          {label}
        </Text>
      </InlineStack>
    </Box>
  );
}

function ProtectedShortcutsCard() {
  return (
    <Card padding="0">
      <Box padding="400" paddingBlockEnd="300">
        <InlineStack align="space-between" blockAlign="center" wrap gap="200">
          <BlockStack gap="050">
            <Text as="h2" variant="headingMd">
              Shortcuts disabled
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              These actions are blocked on your storefront while protection is on
            </Text>
          </BlockStack>
          <Badge tone="success">Active</Badge>
        </InlineStack>
      </Box>
      <Divider />
      <Box padding="400">
        <BlockStack gap="400">
          {PROTECTION_GROUPS.map((group) => (
            <BlockStack key={group.title} gap="200">
              <Text as="h3" variant="headingSm">
                {group.title}
              </Text>
              <InlineStack gap="200" wrap>
                {group.items.map((item) => (
                  <ShortcutChip
                    key={`${group.title}-${item.keys}`}
                    keys={item.keys}
                    label={item.label}
                  />
                ))}
              </InlineStack>
            </BlockStack>
          ))}
        </BlockStack>
      </Box>
    </Card>
  );
}

export default function Shortcuts() {
  const { isEnabled, error, shopDomain, apiKey, hasPlan, planType } = useLoaderData();
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
  
  // Success can clear automatically; errors remain visible until dismissed.
  useEffect(() => {
    if (saveStatus.success) {
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

      const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/disable_shortcuts`;
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
  }, [shopDomain, apiKey]);
  
  return (
    <Page
      title="Content protection"
      subtitle="Disable right-click and common keyboard shortcuts on your storefront."
      backAction={{ content: "Dashboard", url: "/app" }}
      primaryAction={{
        content: "Manage Subscription",
        onAction: handleManagePricingClick,
        variant: "primary",
      }}
    >
      <BlockStack gap="500">
        {(
          !hasPlan ||
          isFreePlan ||
          saveStatus.success ||
          saveStatus.error
        ) && (
          <BlockStack gap="300">
            {!hasPlan && (
              <Banner tone="warning">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    You need to select a subscription plan to use this feature.
                  </Text>
                  <InlineStack>
                    <Button onClick={handleManagePricingClick} variant="primary">
                      Manage Subscription
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Banner>
            )}

            {isFreePlan && (
              <Banner tone="info">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    You are on the <strong>Essential</strong> plan.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    <strong>Note:</strong> Keyboard shortcuts blocking is a Growth plan feature. Upgrade to the Growth plan to access this functionality.
                  </Text>
                  <InlineStack>
                    <Button onClick={handleManagePricingClick} variant="primary">
                      Upgrade to Growth
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Banner>
            )}

            {saveStatus.success && (
              <Banner tone="success">
                <Text as="p" variant="bodyMd">
                  Settings saved successfully!
                </Text>
              </Banner>
            )}

            {saveStatus.error && (
              <Banner
                tone="critical"
                onDismiss={() => setSaveStatus({ success: false, error: null })}
              >
                <Text as="p" variant="bodyMd">
                  {saveStatus.error}
                </Text>
              </Banner>
            )}
          </BlockStack>
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <StatusOverview
                enabled={enabled}
                isPremiumPlan={isPremiumPlan}
                hasPlan={hasPlan}
                isFreePlan={isFreePlan}
                isSaving={isSaving}
              />

              <Card padding="0">
                <Box padding="400" paddingBlockEnd="300">
                  <InlineStack gap="300" blockAlign="center" wrap={false}>
                    <Box
                      background="bg-fill-warning-secondary"
                      padding="200"
                      borderRadius="200"
                    >
                      <Icon source={LockIcon} tone="warning" />
                    </Box>
                    <BlockStack gap="050">
                      <Text as="h2" variant="headingMd">
                        Protection settings
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Turn this on to discourage casual copying on your storefront
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Divider />
                <Box padding="400">
                  <BlockStack gap="400">
                    <div style={{ opacity: isPremiumPlan ? 1 : 0.5 }}>
                      <SettingToggle
                        action={{
                          content: enabled ? "Turn off" : "Turn on",
                          onAction: handleToggle,
                          loading: isSaving,
                          disabled: !isPremiumPlan,
                          variant: "primary"
                        }}
                        enabled={enabled && isPremiumPlan}
                      >
                        <Text variant="headingMd" as="h6">
                          Content protection
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {enabled && isPremiumPlan
                            ? "Protection is on. Right-click and selected shortcuts are blocked on your storefront." 
                            : "Turn on to block right-click and shortcuts like Ctrl+C, Ctrl+U, and F12."}
                        </Text>
                      </SettingToggle>
                    </div>

                    <Box
                      background="bg-surface-secondary"
                      padding="300"
                      borderRadius="200"
                    >
                      <InlineStack gap="200" blockAlign="start" wrap={false}>
                        <Icon source={AlertTriangleIcon} tone="caution" />
                        <Text as="p" variant="bodySm" tone="subdued">
                          Disabling shortcuts does not prevent copying or guarantee security. It can also interfere with browser features and assistive technology.
                        </Text>
                      </InlineStack>
                    </Box>
                  </BlockStack>
                </Box>
              </Card>

              {enabled && isPremiumPlan && <ProtectedShortcutsCard />}
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <ThemeIntegrationCard
                isPremiumPlan={isPremiumPlan}
                onEmbedClick={handleEmbedShortcutClick}
              />
              <HowItWorksCard />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
