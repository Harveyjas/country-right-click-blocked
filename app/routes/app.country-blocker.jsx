import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { SaveBar } from "@shopify/app-bridge-react";
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
import {
  arraysEqualAsSets,
  useContextualSaveBar,
} from "../hooks/useContextualSaveBar";

const SAVE_BAR_ID = "country-blocker-save-bar";
const THEME_BLOCK_HANDLE = "country_blocker";

function resolvePlan(activeSubscriptions = []) {
  if (!activeSubscriptions.length) {
    return { hasPlan: false, planType: "none" };
  }

  const premiumPlan = activeSubscriptions.find((sub) => {
    const name = sub.name?.toLowerCase() || "";
    return (
      name.includes("forever 1") ||
      name.includes("forever 2.99") ||
      name.includes("2.99") ||
      name.includes("growth") ||
      name.includes("premium")
    );
  });

  const freePlan = activeSubscriptions.find((sub) => {
    const name = sub.name?.toLowerCase() || "";
    return (
      name.includes("forever free") ||
      name.includes("essential") ||
      name.includes("free")
    );
  });

  if (premiumPlan) return { hasPlan: true, planType: "premium" };
  if (freePlan) return { hasPlan: true, planType: "free" };
  return { hasPlan: true, planType: "free" };
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  let hasPlan = false;
  let planType = "none";
  let selectedCountries = [];

  try {
    const response = await admin.graphql(`#graphql
      query CountryBlockerPage {
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
          metafield(namespace: "countryselector", key: "selected-country") {
            value
          }
        }
      }
    `);

    const responseJson = await response.json();
    const activeSubscriptions =
      responseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    const plan = resolvePlan(activeSubscriptions);
    hasPlan = plan.hasPlan;
    planType = plan.planType;

    const metafield = responseJson.data?.shop?.metafield;
    if (metafield?.value) {
      try {
        const parsed = JSON.parse(metafield.value);
        selectedCountries = Array.isArray(parsed) ? parsed : [];
      } catch {
        selectedCountries = [];
      }
    }
  } catch {
    hasPlan = false;
    planType = "none";
  }

  return json({
    shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    hasPlan,
    planType,
    selectedCountries,
    countryLimit: planType === "free" ? 5 : null,
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const countries = JSON.parse(formData.get("countries") || "[]");

  const shopResponse = await admin.graphql(`#graphql
    query {
      shop { id }
    }
  `);
  const shopJson = await shopResponse.json();

  if (shopJson.errors) {
    return json(
      { error: "Couldn't load shop details. Try again." },
      { status: 500 },
    );
  }

  const shopId = shopJson.data?.shop?.id;
  if (!shopId) {
    return json({ error: "Couldn't load shop details. Try again." }, { status: 500 });
  }

  const metafieldResponse = await admin.graphql(
    `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id value }
          userErrors { field message }
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
    },
  );

  const metafieldJson = await metafieldResponse.json();

  if (metafieldJson.errors) {
    return json(
      { error: "Couldn't save countries. Try again." },
      { status: 500 },
    );
  }

  if (metafieldJson.data?.metafieldsSet?.userErrors?.length > 0) {
    return json(
      {
        error:
          metafieldJson.data.metafieldsSet.userErrors[0]?.message ||
          "Couldn't save countries. Try again.",
      },
      { status: 500 },
    );
  }

  return json({
    success: true,
    message: "Country blocking settings saved.",
    countries,
  });
};

function PlanBadge({ planType, hasPlan }) {
  if (!hasPlan) return <Badge tone="warning">No plan</Badge>;
  if (planType === "premium") return <Badge tone="success">Growth</Badge>;
  if (planType === "free") return <Badge tone="info">Essential</Badge>;
  return <Badge>Plan active</Badge>;
}

function StatusOverview({
  selectedCount,
  countryLimit,
  planType,
  hasPlan,
  isDirty,
  isSaving,
}) {
  const remaining =
    countryLimit != null ? Math.max(countryLimit - selectedCount, 0) : null;
  const progress =
    countryLimit != null && countryLimit > 0
      ? Math.min((selectedCount / countryLimit) * 100, 100)
      : selectedCount > 0
        ? 100
        : 0;

  let statusDetail = "Choose countries below, then save with the save bar.";
  if (!hasPlan) {
    statusDetail = "Select a subscription plan to start blocking countries.";
  } else if (isDirty) {
    statusDetail = "You have unsaved changes. Save or discard them with the save bar.";
  } else if (selectedCount === 0) {
    statusDetail =
      "No countries blocked yet. Expand a region and pick countries to protect your store.";
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
                {isDirty && (
                  <Badge tone="attention" size="small">
                    Unsaved
                  </Badge>
                )}
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
              <Text
                as="p"
                variant="headingXl"
                fontWeight="semibold"
                alignment="center"
              >
                {selectedCount}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                {selectedCount === 1 ? "country selected" : "countries selected"}
              </Text>
            </BlockStack>
          </Box>
        </InlineStack>
      </Box>

      {hasPlan && countryLimit != null && (
        <>
          <Divider />
          <Box
            padding="300"
            paddingInline="400"
            background="bg-surface-secondary"
          >
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

function ThemeIntegrationCard({
  hasPlan,
  themeStatus,
  onEmbedClick,
}) {
  const isLive = themeStatus === "Active";

  return (
    <Card padding="0">
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="start" wrap gap="200">
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
                  Enable the Country Blocker app embed on your published theme.
                </Text>
              </BlockStack>
            </InlineStack>
            <Badge
              tone={
                themeStatus === "checking"
                  ? "info"
                  : isLive
                    ? "success"
                    : "attention"
              }
              size="small"
            >
              {themeStatus === "checking"
                ? "Checking…"
                : isLive
                  ? "Live on theme"
                  : "Setup needed"}
            </Badge>
          </InlineStack>

          {!hasPlan ? (
            <Box background="bg-surface-warning" padding="300" borderRadius="200">
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Subscription required
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Choose a plan to unlock theme integration and start protecting
                  your store.
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
                      Enable the Country Blocker app embed
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <Badge tone="info">3</Badge>
                    <Text as="p" variant="bodySm">
                      Save the theme — blocked visitors see the restriction message
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>

              <Button
                onClick={onEmbedClick}
                variant="primary"
                size="large"
                fullWidth
              >
                {isLive ? "Manage in theme editor" : "Open theme editor"}
              </Button>
            </BlockStack>
          )}
        </BlockStack>
      </Box>
      {hasPlan && (
        <>
          <Divider />
          <Box
            padding="300"
            paddingInline="400"
            background="bg-surface-secondary"
          >
            <InlineStack gap="200" blockAlign="center" wrap={false}>
              <Icon source={CheckCircleIcon} tone="success" />
              <Text as="p" variant="bodySm" tone="subdued">
                Settings apply on the storefront only after this app embed is
                enabled.
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
            Visitors from selected countries won&apos;t reach your storefront
            content once the theme embed is active.
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Use Quick Select for whole regions, or expand a continent to
            fine-tune individual countries.
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

export default function CountryBlockerPage() {
  const {
    shop,
    apiKey,
    hasPlan,
    planType,
    selectedCountries: initialCountries,
    countryLimit,
  } = useLoaderData();
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const [savedCountries, setSavedCountries] = useState(initialCountries || []);
  const [draftCountries, setDraftCountries] = useState(initialCountries || []);
  const [feedback, setFeedback] = useState(null);
  const [themeStatus, setThemeStatus] = useState("checking");

  const isDirty = useMemo(
    () => !arraysEqualAsSets(draftCountries, savedCountries),
    [draftCountries, savedCountries],
  );
  const isSaving = fetcher.state === "submitting";

  useContextualSaveBar(SAVE_BAR_ID, isDirty && hasPlan);

  useEffect(() => {
    setSavedCountries(initialCountries || []);
    setDraftCountries(initialCountries || []);
  }, [initialCountries]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    if (fetcher.data.success) {
      const next = Array.isArray(fetcher.data.countries)
        ? fetcher.data.countries
        : draftCountries;
      setSavedCountries(next);
      setDraftCountries(next);
      setFeedback({
        tone: "success",
        message: fetcher.data.message || "Country blocking settings saved.",
      });
    } else if (fetcher.data.error) {
      setFeedback({ tone: "critical", message: fetcher.data.error });
    }
  }, [fetcher.state, fetcher.data, draftCountries]);

  useEffect(() => {
    let mounted = true;

    const checkTheme = async () => {
      try {
        const extensions = await window.shopify?.app?.extensions();
        const themeExtensions =
          extensions?.filter((ext) => ext.type === "theme_app_extension") || [];

        let status = "Not active";
        for (const extension of themeExtensions) {
          for (const activation of extension.activations || []) {
            if (activation.handle === THEME_BLOCK_HANDLE) {
              status =
                activation.status === "active" ? "Active" : "Not active";
            }
          }
        }
        if (mounted) setThemeStatus(status);
      } catch {
        if (mounted) setThemeStatus("Not active");
      }
    };

    checkTheme();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCountryChange = useCallback(
    (countries) => {
      setFeedback(null);
      let next = countries;
      if (planType === "free" && countryLimit && countries.length > countryLimit) {
        next = countries.slice(0, countryLimit);
      }
      setDraftCountries(next);
    },
    [planType, countryLimit],
  );

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("countries", JSON.stringify(draftCountries));
    fetcher.submit(formData, { method: "post" });
  }, [draftCountries, fetcher]);

  const handleDiscard = useCallback(() => {
    setDraftCountries(savedCountries);
    setFeedback(null);
  }, [savedCountries]);

  const handleEmbedClick = useCallback(() => {
    if (!shop) return;
    const shopName = shop.replace(".myshopify.com", "");
    const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/${THEME_BLOCK_HANDLE}`;
    window.open(embedUrl, "_blank");
  }, [shop, apiKey]);

  const handleManagePricingClick = useCallback(() => {
    if (!shop) return;
    const shopName = shop.replace(".myshopify.com", "");
    window.open(
      `https://admin.shopify.com/store/${shopName}/charges/insta-18/pricing_plans`,
      "_blank",
    );
  }, [shop]);

  const pageBanner = !hasPlan
    ? {
        tone: "warning",
        message: "Select a subscription plan to use country blocking.",
        action: { content: "View plans", onAction: handleManagePricingClick },
      }
    : feedback;

  return (
    <Page
      title="Block countries"
      subtitle="Choose which countries can access your storefront."
      backAction={{
        content: "Home",
        onAction: async () => {
          try {
            if (isDirty && window.shopify?.saveBar?.leaveConfirmation) {
              await window.shopify.saveBar.leaveConfirmation();
            }
            navigate("/app");
          } catch {
            // Merchant cancelled leave confirmation.
          }
        },
      }}
    >
      <SaveBar id={SAVE_BAR_ID} discardConfirmation="">
        <button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !hasPlan}
          {...(isSaving ? { loading: "" } : {})}
        />
        <button onClick={handleDiscard} disabled={isSaving} />
      </SaveBar>

      <BlockStack gap="500">
        {pageBanner && (
          <Banner
            tone={pageBanner.tone}
            onDismiss={
              pageBanner.tone === "critical" || pageBanner.tone === "success"
                ? () => setFeedback(null)
                : undefined
            }
            action={pageBanner.action}
          >
            <Text as="p" variant="bodyMd">
              {pageBanner.message}
            </Text>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <StatusOverview
                selectedCount={draftCountries.length}
                countryLimit={countryLimit}
                planType={planType}
                hasPlan={hasPlan}
                isDirty={isDirty}
                isSaving={isSaving}
              />

              <Card padding="0">
                <Box padding="400" paddingBlockEnd="300">
                  <InlineStack
                    align="space-between"
                    blockAlign="center"
                    wrap
                    gap="300"
                  >
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
                          Expand a region, then check the countries you want to
                          block
                        </Text>
                      </BlockStack>
                    </InlineStack>
                    {draftCountries.length > 0 && (
                      <Badge tone="info">
                        {draftCountries.length}
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
                  <CountrySelector
                    selectedCountries={draftCountries}
                    onChange={handleCountryChange}
                    disabled={!hasPlan}
                    countryLimit={countryLimit}
                    limitReached={
                      planType === "free" &&
                      draftCountries.length >= countryLimit
                    }
                  />
                </Box>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <ThemeIntegrationCard
                hasPlan={hasPlan}
                themeStatus={themeStatus}
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
