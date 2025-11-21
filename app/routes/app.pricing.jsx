import { useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page, Layout, Card, Text, BlockStack, Spinner } from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get shop data from session
  const shop = session.shop;
  
  // Extract the shop name without .myshopify.com
  const shopName = shop.replace('.myshopify.com', '');
  
  // Construct the URL for the pricing plans page
  const pricingUrl = `https://admin.shopify.com/store/${shopName}/charges/insta-18/pricing_plans`;
  
  // Default plan values
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
    console.log('Raw subscription response:', JSON.stringify(responseJson, null, 2));
    console.log('Active subscriptions:', activeSubscriptions);
    
    // If there are any active subscriptions, determine the plan type
    if (activeSubscriptions.length > 0) {
      // Log each subscription for debugging
      activeSubscriptions.forEach((sub, index) => {
        console.log(`Subscription ${index}:`, {
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
      
      console.log('Premium plan found:', premiumPlan);
      console.log('Free plan found:', freePlan);
      
      if (premiumPlan) {
        planType = "premium";
      } else if (freePlan) {
        planType = "free";
      }
      
      console.log('Final plan type determined:', planType);
    } else {
      console.log('No active subscriptions found');
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
  }
  
  return json({ 
    shop,
    pricingUrl,
    planType
  });
};

export default function PricingRedirect() {
  const { pricingUrl, planType } = useLoaderData();
  
  useEffect(() => {
    // Redirect to the pricing URL after a short delay
    const timer = setTimeout(() => {
      window.location.href = pricingUrl;
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [pricingUrl]);
  
  return (
    <Page title="Subscription Management">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400" alignment="center">
              {planType === "none" && (
                <>
                  <Text as="h2" variant="headingMd">
                    Select a Subscription Plan
                  </Text>
                  <Text as="p" variant="bodyMd">
                    You don't have an active subscription yet. You'll be redirected to select a plan.
                  </Text>
                </>
              )}
              
              {planType === "free" && (
                <>
                  <Text as="h2" variant="headingMd">
                    You're on the Essential Plan
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Your current plan allows you to block up to 5 countries and use all other features.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Consider upgrading to the Growth plan for unlimited country blocking.
                  </Text>
                </>
              )}
              
              {planType === "premium" && (
                <>
                  <Text as="h2" variant="headingMd">
                    You're on the Growth Plan
                  </Text>
                  <Text as="p" variant="bodyMd">
                    You have full access to all features, including unlimited country blocking.
                  </Text>
                  <Text as="p" variant="bodyMd">
                    You'll be redirected to manage your subscription.
                  </Text>
                </>
              )}
              
              <Spinner size="large" />
              <Text as="p" variant="bodyMd">
                Redirecting to subscription management...
              </Text>
              <Text as="p" variant="bodyMd">
                If you are not redirected automatically, please{" "}
                <a href={pricingUrl} target="_blank" rel="noopener noreferrer">
                  click here
                </a>
                .
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}