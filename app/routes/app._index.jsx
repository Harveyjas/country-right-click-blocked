import { useEffect } from "react";
import { useFetcher, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  Banner,
  InlineStack,
} from "@shopify/polaris";
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
            metafield(namespace: "countries", key: "allowed") {
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
            namespace: "countries",
            key: "allowed",
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

export default function Index() {
  const { shop, hasPlan, planType, selectedCountries: initialCountries, countryLimit } = useLoaderData();
  const submit = useSubmit();
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
      
      // Clear feedback after 4 seconds
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
      }, 4000);
      
      return () => clearTimeout(timer);
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
      const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=d7c3a32f-9572-4caf-aadd-ab0a618f3c30/country_blocker`;
      console.log('Opening URL:', embedUrl);

      // Open in a new tab
      window.open(embedUrl, '_blank');
    } catch (error) {
      console.error('Error opening theme editor:', error);
    }
  }, [shop]);
  
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

  return (
    <Page title="Country Restrictions Dashboard">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Welcome to your Country Restrictions Dashboard
                </Text>
                <Text as="p" variant="bodyMd">
                  Use this dashboard to manage which countries can access your store. Select countries below and then embed the blocker in your theme.
                </Text>
                <InlineStack gap="300" align="end">
                  <Button onClick={handleManagePricingClick} variant="primary">
                    Manage Subscription
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Country Selection
                </Text>
                
                {/* Visual feedback for save operations */}
                {feedbackMessage && (
                  <Banner status={feedbackType}>
                    <Text as="p" variant="bodyMd">
                      {feedbackMessage}
                    </Text>
                  </Banner>
                )}
                
                {/* Loading indicator while saving */}
                {fetcher.state === "submitting" && (
                  <Banner status="info">
                    <Text as="p" variant="bodyMd">
                      Saving countries...
                    </Text>
                  </Banner>
                )}
                
                {!hasPlan && (
                  <Banner status="warning">
                    <Text as="p" variant="bodyMd">
                      You need to select a subscription plan to use this feature.
                    </Text>
                  </Banner>
                )}
                
                {planType === "free" && (
                  <Banner status="info">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        You are on the <strong>Forever Free</strong> plan which allows blocking up to 5 countries.
                      </Text>
                      {selectedCountries.length >= countryLimit && (
                        <Text as="p" variant="bodyMd">
                          You have reached your limit of {countryLimit} countries. Upgrade to the premium plan for unlimited country blocking.
                        </Text>
                      )}
                      <Button onClick={handleManagePricingClick} variant="primary">
                        Upgrade to Premium
                      </Button>
                    </BlockStack>
                  </Banner>
                )}
                
                {/* {planType === "premium" && (
                  <Banner status="success">
                    <Text as="p" variant="bodyMd">
                      You are on the <strong>Premium</strong> plan with unlimited country blocking.
                    </Text>
                  </Banner>
                )} */}
                
                <div style={{ opacity: hasPlan ? 1 : 0.5 }}>
                  <CountrySelector
                    selectedCountries={selectedCountries}
                    onChange={handleCountryChange}
                    disabled={!hasPlan}
                    countryLimit={countryLimit}
                    limitReached={planType === "free" && selectedCountries.length >= countryLimit}
                    planType={planType}
                  />
                  
                  {selectedCountries.length > 0 && (
                    <Text as="p" variant="bodySm" color="subdued">
                      {selectedCountries.length} countries selected
                      {planType === "free" && ` (${countryLimit - selectedCountries.length} remaining)`}
                    </Text>
                  )}
                </div>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Theme Integration
                </Text>
                <div style={{ opacity: hasPlan ? 1 : 0.5 }}>
                  <Banner status={!hasPlan ? "warning" : "info"}>
                    <BlockStack gap="300">
                      <Text as="p" variant="bodyMd">
                        {!hasPlan 
                          ? "You need to select a subscription plan to use this feature."
                          : "Add the country blocker to your theme:"}
                      </Text>
                      <Button onClick={handleEmbedClick} variant="primary" disabled={!hasPlan}>
                        Open Theme Editor
                      </Button>
                      {hasPlan && (
                        <Text as="p" variant="bodySm" color="subdued">
                          This will open your theme editor where you can add the country blocker block to your store's section.
                        </Text>
                      )}
                    </BlockStack>
                  </Banner>
                </div>
              </BlockStack>
            </Card>
            </BlockStack>
            {/* <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Bot Blocker
                </Text>
                <Text as="p" variant="bodyMd">
                  Advanced multi-layered bot detection system that blocks search engine bots, crawlers, and headless browsers using behavioral analysis, honeypot traps, and user interaction monitoring.
                </Text>
                <Button url="/app/botblocker" variant="primary">
                  Configure Bot Blocker
                </Button>
              </BlockStack>
            </Card> */}
          </Layout.Section>
          {/* <Layout.Section secondary>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Premium Features
                </Text>
                <Text as="p" variant="bodyMd">
                  Upgrade to the Premium plan to unlock all features:
                </Text>
                <BlockStack gap="200">
                  <ul>
                    <li><Text as="span" variant="bodyMd">Unlimited country blocking</Text></li>
                    <li><Text as="span" variant="bodyMd">Keyboard shortcuts blocking</Text></li>
                    <li><Text as="span" variant="bodyMd">Right-click context menu blocking</Text></li>
                    <li><Text as="span" variant="bodyMd">Advanced bot and crawler blocking with behavioral analysis</Text></li>
                    <li><Text as="span" variant="bodyMd">Developer tools access prevention</Text></li>
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