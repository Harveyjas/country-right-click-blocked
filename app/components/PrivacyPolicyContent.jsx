const LAST_UPDATED = "July 11, 2026";

export function PrivacyPolicyContent() {
  return (
    <>
      <section>
        <h2>Introduction</h2>
        <p>
          This Privacy Policy describes how the Country Blocker app ("we", "our", or "us")
          collects, uses, and protects your data. We are committed to protecting your privacy
          and ensuring the security of your personal information.
        </p>
      </section>

      <section>
        <h2>Data Collection and Use</h2>
        <h3>What data we collect</h3>
        <p>We collect and process the following types of data:</p>
        <ul>
          <li>Store information (shop domain, shop ID)</li>
          <li>Country restrictions settings</li>
          <li>Customer IP addresses (for geolocation purposes only)</li>
          <li>App usage statistics</li>
        </ul>

        <h3>How we use your data</h3>
        <p>We use the collected data to:</p>
        <ul>
          <li>Provide and maintain the country blocking functionality</li>
          <li>Improve our app's performance and user experience</li>
          <li>Comply with legal obligations</li>
          <li>Respond to your support requests</li>
        </ul>
      </section>

      <section>
        <h2>Data Storage and Security</h2>
        <p>
          We store your data securely using industry-standard encryption and security measures.
          Your data is stored on Shopify's infrastructure and is protected by their security
          protocols.
        </p>
      </section>

      <section>
        <h2>GDPR Compliance</h2>
        <p>
          We comply with the General Data Protection Regulation (GDPR) and provide the following
          rights to our users:
        </p>
        <ul>
          <li>Right to access your personal data</li>
          <li>Right to rectification of your personal data</li>
          <li>Right to erasure of your personal data</li>
          <li>Right to restrict processing of your personal data</li>
          <li>Right to data portability</li>
          <li>Right to object to processing of your personal data</li>
        </ul>
      </section>

      <section>
        <h2>Data Retention</h2>
        <p>
          We retain your data only for as long as necessary to provide our services and comply
          with legal obligations. When you uninstall the app, we will delete your data within
          30 days.
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
