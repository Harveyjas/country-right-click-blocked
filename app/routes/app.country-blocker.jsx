import { useEffect } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  Banner,
  InlineStack,
  Box,
  Badge,
  Icon,
  Divider,
  ProgressBar,
} from "@shopify/polaris";
import {
  GlobeIcon,
  ThemeIcon,
  ShieldCheckMarkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import CountrySelector from "../components/CountrySelector";
import { useState, useCallback } from "react";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get shop data from session
  const shop = session.shop;
  
  // Default plan values
  let hasPlan = false;
  let planType = "none"; // "none", "free", or "premium"
  
  try {
    // Check if the shop has an active subscription using Shopify GraphQL API
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
    
    // Debug: Log the actual subscription data
    console.log('Main Index - Raw subscription response:', JSON.stringify(responseJson, null, 2));
    console.log('Main Index - Active subscriptions:', activeSubscriptions);
    
    // If there are any active subscriptions, determine the plan type
    if (activeSubscriptions.length > 0) {
      hasPlan = true;
      
      // Log each subscription for debugging
      activeSubscriptions.forEach((sub, index) => {
        console.log(`Main Index - Subscription ${index}:`, {
          id: sub.id,
          name: sub.name,
          status: sub.status,
          nameLowerCase: sub.name?.toLowerCase()
        });
      });
      
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
      
      console.log('Main Index - Premium plan found:', premiumPlan);
      console.log('Main Index - Free plan found:', freePlan);
      
      if (premiumPlan) {
        planType = "premium";
      } else if (freePlan) {
        planType = "free";
      }
      
      console.log('Main Index - Final plan type determined:', planType);
      console.log('Main Index - hasPlan:', hasPlan);
    } else {
      console.log('Main Index - No active subscriptions found');
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Default to no plan if there's an error
    hasPlan = false;
    planType = "none";
  }
  
  // Also fetch current country selections to check against limits
  let selectedCountries = [];
  try {
    const metafieldResponse = await admin.graphql(
      `#graphql
        query {
          shop {
            metafield(namespace: "countryselector", key: "selected-country") {
              value
            }
          }
        }
      `
    );
    
    const metafieldJson = await metafieldResponse.json();
    const metafield = metafieldJson.data?.shop?.metafield;
    
    if (metafield && metafield.value) {
      try {
        selectedCountries = JSON.parse(metafield.value);
      } catch (parseError) {
        console.error("Error parsing countries metafield:", parseError);
      }
    }
  } catch (error) {
    console.error("Error fetching countries metafield:", error);
  }
  
  return json({
    shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    hasPlan,
    planType,
    selectedCountries,
    countryLimit: planType === "free" ? 5 : null // null means unlimited
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Get the form data
  const formData = await request.formData();
  const countries = JSON.parse(formData.get("countries") || "[]");
  const actionType = formData.get("action_type") || "updated";
  
  console.log("Saving countries:", countries, "Action type:", actionType);
  
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
            namespace: "countryselector",
            key: "selected-country",
            value: JSON.stringify(countries),
            type: "json",
          },
        ],
      },
    }
  );
  
  const metafieldResponseJson = await metafieldResponse.json();
  
  if (metafieldResponseJson.errors) {
    console.error("GraphQL errors:", metafieldResponseJson.errors);
    return json({ 
      error: "Failed to save countries", 
      details: metafieldResponseJson.errors 
    }, { status: 500 });
  }
  
  if (metafieldResponseJson.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Metafield save errors:", metafieldResponseJson.data.metafieldsSet.userErrors);
    return json({ 
      error: "Failed to save countries", 
      details: metafieldResponseJson.data.metafieldsSet.userErrors 
    }, { status: 500 });
  }
  
  // Create success message based on action type
  let successMessage = "Countries updated successfully!";
  if (actionType === "added") {
    successMessage = countries.length === 1 ? "Country added successfully!" : "Countries added successfully!";
  } else if (actionType === "removed") {
    successMessage = "Countries removed successfully!";
  }
  
  return json({ success: true, message: successMessage, actionType });
};

function PlanBadge({ planType, hasPlan }) {
  if (!hasPlan) {
    return <Badge tone="warning">No plan</Badge>;
  }
  if (planType === "premium") {
    return <Badge tone="success">Premium</Badge>;
  }
  if (planType === "free") {
    return <Badge tone="info">Essential</Badge>;
  }
  return <Badge>Plan active</Badge>;
}

function StatusOverview({ selectedCount, countryLimit, planType, hasPlan, isSaving }) {
  const remaining =
    countryLimit != null ? Math.max(countryLimit - selectedCount, 0) : null;
  const progress =
    countryLimit != null && countryLimit > 0
      ? Math.min((selectedCount / countryLimit) * 100, 100)
      : selectedCount > 0
        ? 100
        : 0;

  let statusDetail = "Choose countries below to restrict storefront access.";
  if (!hasPlan) {
    statusDetail = "Select a subscription plan to start blocking countries.";
  } else if (selectedCount === 0) {
    statusDetail = "No countries blocked yet. Expand a region and pick countries to protect your store.";
  } else if (countryLimit != null) {
    statusDetail =
      remaining === 0
        ? `You've reached the Essential plan limit of ${countryLimit} countries.`
        : `${remaining} of ${countryLimit} slots remaining on Essential.`;
  } else {
    statusDetail =
      selectedCount === 1
        ? "1 country is currently blocked from your storefront."
        : `${selectedCount} countries are currently blocked from your storefront.`;
  }

  return (
    <Card padding="0">
      <Box padding="400">
        <InlineStack align="space-between" blockAlign="start" wrap gap="400">
          <InlineStack gap="300" blockAlign="start" wrap={false}>
            <Box
              background="bg-fill-info-secondary"
              padding="200"
              borderRadius="200"
              minHeight="40px"
              minWidth="40px"
            >
              <InlineStack align="center" blockAlign="center">
                <Icon
                  source={hasPlan ? ShieldCheckMarkIcon : AlertTriangleIcon}
                  tone={hasPlan ? "info" : "warning"}
                />
              </InlineStack>
            </Box>
            <BlockStack gap="100">
              <InlineStack gap="200" blockAlign="center" wrap>
                <Text as="h2" variant="headingMd">
                  Country blocking
                </Text>
                <PlanBadge planType={planType} hasPlan={hasPlan} />
                {isSaving && (
                  <Badge tone="info" size="small">
                    Saving…
                  </Badge>
                )}
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {statusDetail}
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
                {selectedCount}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                {selectedCount === 1 ? "country blocked" : "countries blocked"}
              </Text>
            </BlockStack>
          </Box>
        </InlineStack>
      </Box>

      {hasPlan && countryLimit != null && (
        <>
          <Divider />
          <Box padding="300" paddingInline="400" background="bg-surface-secondary">
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Plan usage
                </Text>
                <Text as="span" variant="bodySm" fontWeight="medium">
                  {selectedCount}/{countryLimit}
                </Text>
              </InlineStack>
              <ProgressBar
                progress={progress}
                size="small"
                tone={remaining === 0 ? "critical" : "primary"}
              />
            </BlockStack>
          </Box>
        </>
      )}
    </Card>
  );
}

function ThemeIntegrationCard({ hasPlan, onEmbedClick }) {
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
                Add the country blocker block so rules apply on your live storefront.
              </Text>
            </BlockStack>
          </InlineStack>

          {!hasPlan ? (
            <Box
              background="bg-surface-warning"
              padding="300"
              borderRadius="200"
            >
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Subscription required
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Choose a plan to unlock theme integration and start protecting your store.
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
                      Enable the Country Blocker app block
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <Badge tone="info">3</Badge>
                    <Text as="p" variant="bodySm">
                      Save — blocked visitors are restricted instantly
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>

              <Button onClick={onEmbedClick} variant="primary" size="large" fullWidth>
                Open theme editor
              </Button>
            </BlockStack>
          )}
        </BlockStack>
      </Box>
      {hasPlan && (
        <>
          <Divider />
          <Box padding="300" paddingInline="400" background="bg-surface-secondary">
            <InlineStack gap="200" blockAlign="center" wrap={false}>
              <Icon source={CheckCircleIcon} tone="success" />
              <Text as="p" variant="bodySm" tone="subdued">
                Changes save automatically — enable the block once to go live.
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
          <Icon source={GlobeIcon} tone="base" />
          <Text as="h2" variant="headingSm">
            How blocking works
          </Text>
        </InlineStack>
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Visitors from selected countries won't reach your storefront content once the theme block is active.
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Use Quick Select for whole regions, or expand a continent to fine-tune individual countries.
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

export default function Index() {
  const { shop, apiKey, hasPlan, planType, selectedCountries: initialCountries, countryLimit } = useLoaderData();
  const fetcher = useFetcher();
  const [selectedCountries, setSelectedCountries] = useState(initialCountries || []);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [feedbackType, setFeedbackType] = useState("success"); // "success" or "critical"
  
  // Define isPremiumPlan here to fix the reference error
  const isPremiumPlan = planType === "premium";

  // Handle fetcher state changes for visual feedback
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        setFeedbackMessage(fetcher.data.message || "Countries updated successfully!");
        setFeedbackType("success");
      } else if (fetcher.data.error) {
        setFeedbackMessage(`Error: ${fetcher.data.error}`);
        setFeedbackType("critical");
      }
      
    }
  }, [fetcher.state, fetcher.data]);

  const handleCountryChange = useCallback((countries) => {
    console.log("Countries selected:", countries);
    
    // Clear any existing feedback
    setFeedbackMessage(null);
    
    // Determine if countries were added or removed
    const previousCount = selectedCountries.length;
    const newCount = countries.length;
    
    // If on free plan and exceeding limit, enforce the limit
    let countriesToSave = countries;
    if (planType === "free" && countryLimit && countries.length > countryLimit) {
      // Only take the first 5 countries
      countriesToSave = countries.slice(0, countryLimit);
      setSelectedCountries(countriesToSave);
    } else {
      setSelectedCountries(countries);
    }
    
    // Save to metafield using fetcher for better state management
    const formData = new FormData();
    formData.append("countries", JSON.stringify(countriesToSave));
    formData.append("action_type", newCount > previousCount ? "added" : newCount < previousCount ? "removed" : "updated");
    fetcher.submit(formData, { method: "post" });
  }, [planType, countryLimit, fetcher, selectedCountries]);

  const handleEmbedClick = useCallback(() => {
    try {
      // Use the shop from loader data
      if (!shop) {
        console.error('Shop information not available');
        return;
      }

      // Extract the shop name without .myshopify.com
      const shopName = shop.replace('.myshopify.com', '');

      console.log('shopppppp',shopName)
      
      // Construct the URL using admin.shopify.com format d7c3a32f-9572-4caf-aadd-ab0a618f3c30
      const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/country_blocker`;
      console.log('Opening URL:', embedUrl);

      // Open in a new tab
      window.open(embedUrl, '_blank');
    } catch (error) {
      console.error('Error opening theme editor:', error);
    }
  }, [shop, apiKey]);
  
  const handleManagePricingClick = useCallback(() => {
    try {
      // Use the shop from loader data
      if (!shop) {
        console.error('Shop information not available');
        return;
      }

      // Extract the shop name without .myshopify.com
      const shopName = shop.replace('.myshopify.com', '');
      
      // Construct the URL for the pricing plans page
      const pricingUrl = `https://admin.shopify.com/store/${shopName}/charges/insta-18/pricing_plans`;
      console.log('Opening pricing URL:', pricingUrl);

      // Open in a new tab
      window.open(pricingUrl, '_blank');
    } catch (error) {
      console.error('Error opening pricing page:', error);
    }
  }, [shop]);

  const isSaving = fetcher.state === "submitting";

  return (
    <Page
      title="Block countries"
      subtitle="Choose which countries can access your storefront."
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <BlockStack gap="500">
        {(feedbackMessage || isSaving || !hasPlan) && (
          <BlockStack gap="300">
            {feedbackMessage && (
              <Banner
                tone={feedbackType === "critical" ? "critical" : "success"}
                onDismiss={() => setFeedbackMessage(null)}
              >
                <Text as="p" variant="bodyMd">
                  {feedbackMessage}
                </Text>
              </Banner>
            )}

            {isSaving && (
              <Banner tone="info">
                <Text as="p" variant="bodyMd">
                  Saving countries…
                </Text>
              </Banner>
            )}

            {!hasPlan && (
              <Banner tone="warning">
                <Text as="p" variant="bodyMd">
                  You need to select a subscription plan to use this feature.
                </Text>
              </Banner>
            )}
          </BlockStack>
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <StatusOverview
                selectedCount={selectedCountries.length}
                countryLimit={countryLimit}
                planType={planType}
                hasPlan={hasPlan}
                isSaving={isSaving}
              />

              <Card padding="0">
                <Box padding="400" paddingBlockEnd="300">
                  <InlineStack align="space-between" blockAlign="center" wrap gap="300">
                    <InlineStack gap="300" blockAlign="center" wrap={false}>
                      <Box
                        background="bg-fill-info-secondary"
                        padding="200"
                        borderRadius="200"
                      >
                        <Icon source={GlobeIcon} tone="info" />
                      </Box>
                      <BlockStack gap="050">
                        <Text as="h2" variant="headingMd">
                          Select countries
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Expand a region, then check the countries you want to block
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    {selectedCountries.length > 0 && (
                      <Badge tone="info">
                        {selectedCountries.length}
                        {planType === "free" && countryLimit
                          ? ` / ${countryLimit}`
                          : ""}{" "}
                        selected
                      </Badge>
                    )}
                  </InlineStack>
                </Box>
                <Divider />
                <Box padding="400">
                  <div style={{ opacity: hasPlan ? 1 : 0.5 }}>
                    <CountrySelector
                      selectedCountries={selectedCountries}
                      onChange={handleCountryChange}
                      disabled={!hasPlan}
                      countryLimit={countryLimit}
                      limitReached={planType === "free" && selectedCountries.length >= countryLimit}
                      planType={planType}
                    />
                  </div>
                </Box>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <ThemeIntegrationCard
                hasPlan={hasPlan}
                onEmbedClick={handleEmbedClick}
              />
              <HowItWorksCard />
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
