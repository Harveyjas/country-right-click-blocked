import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // Check if this is a new installation (shop parameter is present)
  if (shop) {
    // Check if the 'first_install' parameter is present, indicating this is a first-time install
    if (url.searchParams.get("first_install") === "1") {
      // Redirect to the pricing page for first-time installations
      throw redirect(`/app/pricing?${url.searchParams.toString()}`);
    } else {
      // For returning users, redirect to the main app
      throw redirect(`/app?${url.searchParams.toString()}`);
    }
  }

  // The root URL is the app's Home destination. Send it to the dashboard
  // instead of rendering Remix's starter landing page.
  throw redirect(`/app${url.search}`);
};
