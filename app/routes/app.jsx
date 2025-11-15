import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // Get shop data from session
  const shop = session.shop;

  return json({ 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop
  });
};

export default function App() {
  const { apiKey, shop } = useLoaderData();

  const handleManagePricingClick = () => {
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
  };

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/country-blocker">
          Country Blocker
        </Link>
        <Link to="/app/redirection-rules">Redirection Rules</Link>
        <Link to="/app/shortcuts">Disable Keyboard Shortcuts</Link>
        {/* <Link to="/app/botblocker">Bot Blocker</Link> */}
        <Link to="/app/faq">FAQ</Link>
        <Link to="/app/privacy-policy">Privacy Policy</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
