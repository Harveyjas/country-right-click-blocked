import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Spinner,
  Badge,
  Box,
  Icon,
  Divider,
} from "@shopify/polaris";
import {
  GlobeIcon,
  DomainRedirectIcon,
  LockIcon,
  QuestionCircleIcon,
  ShieldCheckMarkIcon,
  ThemeIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import WelcomeGuide from "../components/WelcomeGuide";

const THEME_BLOCK_HANDLES = [
  "country_blocker",
  "redirection_popup",
  "disable_shortcuts",
];

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function statusTone(status) {
  if (status === "Active") return "success";
  if (status === "checking") return "info";
  return "attention";
}

function statusLabel(status) {
  if (status === "Active") return "Live on theme";
  if (status === "checking") return "Checking…";
  return "Setup needed";
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`#graphql
    query getDashboardSettings {
      shop {
        name
        myshopifyDomain
        blockedCountries: metafield(namespace: "countryselector", key: "selected-country") { value }
        redirectionRules: metafield(namespace: "countryblocker", key: "redirection-rules") { value }
        contentProtection: metafield(namespace: "keyboardshortcuts", key: "disabled") { value }
      }
    }
  `);

  const result = await response.json();
  const shopData = result.data?.shop;
  const blockedCountries = parseJsonArray(shopData?.blockedCountries?.value);
  const redirectionRules = parseJsonArray(shopData?.redirectionRules?.value);

  let contentProtectionEnabled = false;
  try {
    contentProtectionEnabled =
      JSON.parse(shopData?.contentProtection?.value || "false") === true;
  } catch {
    contentProtectionEnabled = false;
  }

  return json({
    shopName: shopData?.name || session.shop,
    shopDomain: shopData?.myshopifyDomain || session.shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    blockedCountryCount: blockedCountries.length,
    redirectionRuleCount: redirectionRules.length,
    contentProtectionEnabled,
  });
};

function FeatureCard({
  title,
  detail,
  value,
  valueHint,
  themeStatus,
  to,
  icon,
  accent,
}) {
  const isLive = themeStatus === "Active";

  return (
    <Card padding="0">
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="start" wrap={false}>
            <Box
              background={accent}
              padding="200"
              borderRadius="200"
              minHeight="40px"
              minWidth="40px"
            >
              <InlineStack align="center" blockAlign="center">
                <Icon source={icon} tone="base" />
              </InlineStack>
            </Box>
            <Badge tone={statusTone(themeStatus)} size="small">
              {statusLabel(themeStatus)}
            </Badge>
          </InlineStack>

          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              {title}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {detail}
            </Text>
          </BlockStack>

          <Box
            background="bg-surface-secondary"
            padding="300"
            borderRadius="200"
          >
            <InlineStack align="space-between" blockAlign="center" wrap gap="200">
              <BlockStack gap="050">
                <Text as="p" variant="headingLg" fontWeight="semibold">
                  {value}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {valueHint}
                </Text>
              </BlockStack>
              {!isLive && themeStatus !== "checking" && (
                <InlineStack gap="100" blockAlign="center">
                  <Icon source={ThemeIcon} tone="subdued" />
                  <Text as="span" variant="bodySm" tone="subdued">
                    Theme
                  </Text>
                </InlineStack>
              )}
            </InlineStack>
          </Box>

          <Link to={to} style={{ textDecoration: "none" }}>
            <Button fullWidth>{isLive ? "Manage" : "Set up"}</Button>
          </Link>
        </BlockStack>
      </Box>
    </Card>
  );
}

function StatusSummary({
  blockedCountryCount,
  redirectionRuleCount,
  contentProtectionEnabled,
  liveCount,
  checking,
}) {
  const configuredCount =
    (blockedCountryCount > 0 ? 1 : 0) +
    (redirectionRuleCount > 0 ? 1 : 0) +
    (contentProtectionEnabled ? 1 : 0);

  let headline = "Finish setup to protect your storefront";
  let tone = "attention";
  let detail =
    "Configure features below, then enable each app block on your published theme.";

  if (checking) {
    headline = "Checking your theme connection…";
    tone = "info";
    detail = "We’re verifying which Geoshield blocks are live on your storefront.";
  } else if (liveCount === 3 && configuredCount === 3) {
    headline = "Your storefront protection looks solid";
    tone = "success";
    detail = "All three features are configured and live on your theme.";
  } else if (liveCount > 0 || configuredCount > 0) {
    headline = "Protection is partially set up";
    tone = "warning";
    detail = `${configuredCount} of 3 features configured · ${liveCount} of 3 live on theme.`;
  }

  return (
    <Card>
      <InlineStack align="space-between" blockAlign="center" wrap gap="400">
        <InlineStack gap="300" blockAlign="center" wrap={false}>
          <Box
            background="bg-surface-secondary"
            padding="200"
            borderRadius="200"
          >
            <Icon source={ShieldCheckMarkIcon} tone={tone === "success" ? "success" : "base"} />
          </Box>
          <BlockStack gap="050">
            <InlineStack gap="200" blockAlign="center" wrap>
              <Text as="h2" variant="headingMd">
                {headline}
              </Text>
              {checking ? (
                <Spinner accessibilityLabel="Checking theme status" size="small" />
              ) : (
                <Badge tone={tone === "warning" ? "attention" : tone} size="small">
                  {tone === "success"
                    ? "Protected"
                    : tone === "info"
                      ? "Checking"
                      : "In progress"}
                </Badge>
              )}
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {detail}
            </Text>
          </BlockStack>
        </InlineStack>
      </InlineStack>
    </Card>
  );
}

export default function Index() {
  const {
    shopName,
    shopDomain,
    apiKey,
    blockedCountryCount,
    redirectionRuleCount,
    contentProtectionEnabled,
  } = useLoaderData();

  const [extensionStatus, setExtensionStatus] = useState({ state: "checking" });

  useEffect(() => {
    let isMounted = true;

    const checkExtensions = async () => {
      try {
        const extensions = await window.shopify?.app?.extensions();
        const themeExtensions =
          extensions?.filter(
            (extension) => extension.type === "theme_app_extension",
          ) || [];

        const statuses = { state: "ready" };

        for (const extension of themeExtensions) {
          for (const activation of extension.activations || []) {
            if (THEME_BLOCK_HANDLES.includes(activation.handle)) {
              statuses[activation.handle] =
                activation.status === "active" ? "Active" : "Not active";
            }
          }
        }

        for (const handle of THEME_BLOCK_HANDLES) {
          statuses[handle] ||= "Not found";
        }

        if (isMounted) setExtensionStatus(statuses);
      } catch {
        if (isMounted) setExtensionStatus({ state: "unavailable" });
      }
    };

    checkExtensions();
    return () => {
      isMounted = false;
    };
  }, []);

  const getBlockStatus = (handle) => {
    if (extensionStatus.state === "checking") return "checking";
    if (extensionStatus.state === "unavailable") return "Not active";
    return extensionStatus[handle] || "Not found";
  };

  const liveCount = THEME_BLOCK_HANDLES.filter(
    (handle) => getBlockStatus(handle) === "Active",
  ).length;

  return (
    <Page
      title="Dashboard"
      subtitle={`${shopName} · Storefront protection overview`}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <WelcomeGuide
              blockedCountryCount={blockedCountryCount}
              redirectionRuleCount={redirectionRuleCount}
              contentProtectionEnabled={contentProtectionEnabled}
              extensionStatus={extensionStatus}
              shopDomain={shopDomain}
              apiKey={apiKey}
            />

            <StatusSummary
              blockedCountryCount={blockedCountryCount}
              redirectionRuleCount={redirectionRuleCount}
              contentProtectionEnabled={contentProtectionEnabled}
              liveCount={liveCount}
              checking={extensionStatus.state === "checking"}
            />
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <BlockStack gap="050">
                <Text as="h2" variant="headingMd">
                  Protection tools
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Review settings and confirm each feature is live on your theme
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <FeatureCard
            title="Block countries"
            detail="Restrict storefront access for selected countries."
            value={String(blockedCountryCount)}
            valueHint={
              blockedCountryCount === 1
                ? "country selected"
                : "countries selected"
            }
            themeStatus={getBlockStatus("country_blocker")}
            to="/app/country-blocker"
            icon={GlobeIcon}
            accent="bg-fill-info-secondary"
          />
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <FeatureCard
            title="Geo redirects"
            detail="Send visitors from chosen countries to another URL."
            value={String(redirectionRuleCount)}
            valueHint={
              redirectionRuleCount === 1 ? "redirect rule" : "redirect rules"
            }
            themeStatus={getBlockStatus("redirection_popup")}
            to="/app/redirection-rules"
            icon={DomainRedirectIcon}
            accent="bg-fill-warning-secondary"
          />
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <FeatureCard
            title="Content protection"
            detail="Discourage copying with right-click and shortcut blocks."
            value={contentProtectionEnabled ? "On" : "Off"}
            valueHint={
              contentProtectionEnabled
                ? "Protection enabled"
                : "Not enabled yet"
            }
            themeStatus={getBlockStatus("disable_shortcuts")}
            to="/app/shortcuts"
            icon={LockIcon}
            accent="bg-fill-success-secondary"
          />
        </Layout.Section>

        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center" wrap gap="400">
                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <Box
                    background="bg-surface-secondary"
                    padding="200"
                    borderRadius="200"
                  >
                    <Icon source={QuestionCircleIcon} tone="base" />
                  </Box>
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingSm">
                      Need a hand?
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Browse setup tips or review how we handle store data.
                    </Text>
                  </BlockStack>
                </InlineStack>
                <InlineStack gap="200" wrap>
                  <Link to="/app/faq">
                    <Button>Help center</Button>
                  </Link>
                  <Link to="/app/privacy-policy">
                    <Button variant="plain">Privacy policy</Button>
                  </Link>
                </InlineStack>
              </InlineStack>
            </Box>
            <Divider />
            <Box padding="300" paddingInline="400" background="bg-surface-secondary">
              <Text as="p" variant="bodySm" tone="subdued">
                Tip: After saving settings, open the theme editor and enable the
                matching Geoshield app block so changes appear on your live store.
              </Text>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
