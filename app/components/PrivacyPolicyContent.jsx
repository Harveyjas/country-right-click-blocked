const LAST_UPDATED = "November 12, 2026";

export function PrivacyPolicyContent() {
  return (
    <>
      <section>
        <h2>Introduction</h2>
        <p>
          This policy describes the information the Country Blocker app ("we", "our", or "us")
          handles when a merchant installs and uses the app.
        </p>
      </section>

      <section>
        <h2>Data Collection and Use</h2>
        <h3>What data we collect</h3>
        <p>The app handles:</p>
        <ul>
          <li>Shopify authentication session data, including the shop domain and the authorized staff member's Shopify-provided account details and tokens.</li>
          <li>App settings, such as selected countries, redirection rules, and shortcut settings. These are stored as shop metafields in Shopify.</li>
          <li>The country Shopify provides through storefront localization. The app does not send shopper IP addresses to its server for geolocation.</li>
        </ul>

        <p>
          The redirection selector can load country flag images from raw.githubusercontent.com
          and flagcdn.com. Those providers receive the browser request, which can include the
          visitor's IP address and standard request information. The selector does not require
          these images to choose a country.
        </p>

        <h3>How we use your data</h3>
        <p>We use the collected data to:</p>
        <ul>
          <li>Provide and maintain the country blocking functionality</li>
          <li>Authenticate the merchant and operate the app's settings</li>
          <li>Respond to support requests</li>
          <li>Meet applicable legal obligations</li>
        </ul>
      </section>

      <section>
        <h2>Data Storage and Security</h2>
        <p>
          Authentication sessions are stored in the app's configured session database. App
          settings are stored in Shopify shop metafields. Access to these records is limited to
          operating and supporting the app.
        </p>
      </section>

      <section>
        <h2>GDPR Compliance</h2>
        <p>
          The app does not maintain customer profiles or customer IP address records. Merchants
          can request access to or deletion of app-related information by contacting us. Shopify
          privacy webhooks are configured for customer data requests, customer redaction, and shop
          redaction.
        </p>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          Authentication sessions are removed when Shopify sends the app uninstalled webhook.
          Shop settings are stored in Shopify metafields and may remain after uninstalling the
          app. Contact us if you need help removing app-related settings.
        </p>
      </section>

      <section>
        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data practices, please
          contact us at:
          <br />
          Email:{" "}
          <a href="mailto:ventosupprt@gmail.com">ventosupprt@gmail.com</a>
        </p>
      </section>

      <section>
        <h2>Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes
          by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>
      </section>

      <p className="privacy-policy-updated">Last Updated: {LAST_UPDATED}</p>
    </>
  );
}
