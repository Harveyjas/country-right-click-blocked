import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  useActionData,
  useNavigation,
  useNavigate,
} from "@remix-run/react";
import { SaveBar } from "@shopify/app-bridge-react";
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
import { useContextualSaveBar } from "../hooks/useContextualSaveBar";

const SAVE_BAR_ID = "content-protection-save-bar";
const THEME_BLOCK_HANDLE = "disable_shortcuts";

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
  try {
    const { admin, session } = await authenticate.admin(request);

    const response = await admin.graphql(`#graphql
      query ContentProtectionPage {
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
      }
    `);

    const responseJson = await response.json();

    if (responseJson.errors) {
      return json(
        {
          error: "Couldn't load content protection settings.",
          hasPlan: false,
          planType: "none",
          isEnabled: false,
          shopDomain: session.shop,
          apiKey: process.env.SHOPIFY_API_KEY || "",
        },
        { status: 500 },
      );
    }

    const metafield = responseJson.data?.shop?.metafield;
    const shopDomain =
      responseJson.data?.shop?.myshopifyDomain || session.shop;
    const activeSubscriptions =
      responseJson.data?.currentAppInstallation?.activeSubscriptions || [];
    const { hasPlan, planType } = resolvePlan(activeSubscriptions);

    let isEnabled = false;
    if (metafield?.value) {
      try {
        isEnabled = JSON.parse(metafield.value) === true;
      } catch {
        isEnabled = false;
      }
    }

    return json({
      isEnabled,
      shopDomain,
      apiKey: process.env.SHOPIFY_API_KEY || "",
      hasPlan,
      planType,
    });
  } catch (error) {
    return json(
      {
        error: "Couldn't load content protection settings.",
        details: error.message,
        hasPlan: false,
        planType: "none",
        isEnabled: false,
        shopDomain: "",
        apiKey: process.env.SHOPIFY_API_KEY || "",
      },
      { status: 500 },
    );
  }
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const enabled = formData.get("enabled") === "true";

    const planResponse = await admin.graphql(`#graphql
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
          }
        }
      }
    `);

    const planJson = await planResponse.json();
    const activeSubscriptions =
      planJson.data?.currentAppInstallation?.activeSubscriptions || [];
    const { planType } = resolvePlan(activeSubscriptions);

    if (planType !== "premium") {
      return json(
        {
          error: "Content protection is available on the Growth plan.",
          success: false,
        },
        { status: 403 },
      );
    }

    const shopResponse = await admin.graphql(`#graphql
      query { shop { id } }
    `);
    const shopJson = await shopResponse.json();

    if (shopJson.errors) {
      return json(
        { error: "Couldn't load shop details. Try again.", success: false },
        { status: 500 },
      );
    }

    const shopId = shopJson.data?.shop?.id;
    if (!shopId) {
      return json(
        { error: "Couldn't load shop details. Try again.", success: false },
        { status: 500 },
      );
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
              namespace: "keyboardshortcuts",
              key: "disabled",
              value: JSON.stringify(enabled),
              type: "boolean",
            },
          ],
        },
      },
    );

    const metafieldJson = await metafieldResponse.json();

    if (metafieldJson.errors) {
      return json(
        { error: "Couldn't save setting. Try again.", success: false },
        { status: 500 },
      );
    }

    if (metafieldJson.data?.metafieldsSet?.userErrors?.length > 0) {
      return json(
        {
          error:
            metafieldJson.data.metafieldsSet.userErrors[0]?.message ||
            "Couldn't save setting. Try again.",
          success: false,
        },
        { status: 500 },
      );
    }

    return json({ success: true, enabled });
  } catch (error) {
    return json(
      {
        error: "Couldn't save setting. Try again.",
        details: error.message,
        success: false,
      },
      { status: 500 },
    );
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
    ],
  },
];

function PlanBadge({ hasPlan, isPremiumPlan, isFreePlan }) {
  if (!hasPlan) return <Badge tone="warning">No plan</Badge>;
  if (isPremiumPlan) return <Badge tone="success">Growth</Badge>;
  if (isFreePlan) return <Badge tone="info">Essential</Badge>;
  return <Badge>Plan active</Badge>;
}

function StatusOverview({
  enabled,
  isPremiumPlan,
  hasPlan,
  isFreePlan,
  isDirty,
  isSaving,
}) {
  const protectionOn = enabled && isPremiumPlan;

  let detail =
    "Discourage casual copying with right-click and shortcut blocking.";
  if (!hasPlan) {
    detail =
      "Select a subscription plan, then upgrade to Growth to use this feature.";
  } else if (isFreePlan) {
    detail =
      "Available on the Growth plan. Upgrade to enable storefront protection.";
  } else if (isDirty) {
    detail = "You have unsaved changes. Save or discard them with the save bar.";
  } else if (protectionOn) {
    detail =
      "Protection is on. Right-click and selected shortcuts are blocked once the theme embed is live.";
  } else if (isPremiumPlan) {
    detail =
      "Turn protection on, save your changes, then enable the app embed in your theme editor.";
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
                  Content protection
                </Text>
                <PlanBadge
                  hasPlan={hasPlan}
                  isPremiumPlan={isPremiumPlan}
                  isFreePlan={isFreePlan}
                />
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
              <Text
                as="p"
                variant="headingXl"
                fontWeight="semibold"
                alignment="center"
              >
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

function ThemeIntegrationCard({ isPremiumPlan, themeStatus, onEmbedClick }) {
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
                  Enable the Content protection app embed on your published
                  theme.
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

          {!isPremiumPlan ? (
            <Box background="bg-surface-warning" padding="300" borderRadius="200">
              <BlockStack gap="100">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Growth plan required
                  </Text>
                  <Badge tone="attention">Growth</Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Upgrade to Growth to unlock theme integration for content
                  protection.
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
                      Enable the Content protection app embed
                    </Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="start" wrap={false}>
                    <Badge tone="info">3</Badge>
                    <Text as="p" variant="bodySm">
                      Save the theme — shortcut blocking goes live on the
                      storefront
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
      {isPremiumPlan && (
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
                Save protection settings above, then enable the embed once to go
                live.
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
            When enabled, common copy shortcuts and right-click are blocked for
            visitors on your storefront.
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            This discourages casual copying. It does not guarantee security or
            stop determined users.
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
              These actions are blocked on your storefront while protection is
              on
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
  const { isEnabled, error, shopDomain, apiKey, hasPlan, planType } =
    useLoaderData();
  const [savedEnabled, setSavedEnabled] = useState(isEnabled);
  const [draftEnabled, setDraftEnabled] = useState(isEnabled);
  const [feedback, setFeedback] = useState(null);
  const [themeStatus, setThemeStatus] = useState("checking");

  const submit = useSubmit();
  const actionData = useActionData();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const isSaving = navigation.state === "submitting";
  const isPremiumPlan = planType === "premium";
  const isFreePlan = planType === "free";
  const isDirty = draftEnabled !== savedEnabled;

  useContextualSaveBar(SAVE_BAR_ID, isDirty && isPremiumPlan);

  useEffect(() => {
    setSavedEnabled(isEnabled);
    setDraftEnabled(isEnabled);
  }, [isEnabled]);

  useEffect(() => {
    if (!actionData || navigation.state !== "idle") return;

    if (actionData.success) {
      const next =
        typeof actionData.enabled === "boolean"
          ? actionData.enabled
          : draftEnabled;
      setSavedEnabled(next);
      setDraftEnabled(next);
      setFeedback({
        tone: "success",
        message: "Content protection settings saved.",
      });
    } else if (actionData.error) {
      setFeedback({ tone: "critical", message: actionData.error });
    }
  }, [actionData, navigation.state, draftEnabled]);

  useEffect(() => {
    let mounted = true;

    const checkTheme = async () => {
      try {
        const extensions = await window.shopify?.app?.extensions();
        const themeExtensions =
          extensions?.filter((ext) => ext.type === "theme_app_extension") ||
          [];

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

  const handleToggle = useCallback(() => {
    if (!isPremiumPlan) return;
    setFeedback(null);
    setDraftEnabled((value) => !value);
  }, [isPremiumPlan]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("enabled", draftEnabled.toString());
    submit(formData, { method: "post" });
  }, [draftEnabled, submit]);

  const handleDiscard = useCallback(() => {
    setDraftEnabled(savedEnabled);
    setFeedback(null);
  }, [savedEnabled]);

  const handleEmbedShortcutClick = useCallback(() => {
    if (!isPremiumPlan || !shopDomain) return;
    const shopName = shopDomain.replace(".myshopify.com", "");
    const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/${THEME_BLOCK_HANDLE}`;
    window.open(embedUrl, "_blank");
  }, [shopDomain, isPremiumPlan, apiKey]);

  const handleManagePricingClick = useCallback(() => {
    if (!shopDomain) return;
    const shopName = shopDomain.replace(".myshopify.com", "");
    window.open(
      `https://admin.shopify.com/store/${shopName}/charges/insta-18/pricing_plans`,
      "_blank",
    );
  }, [shopDomain]);

  const pageBanner = error
    ? { tone: "critical", message: error }
    : !hasPlan
      ? {
          tone: "warning",
          message: "Select a subscription plan to use this feature.",
          action: {
            content: "View plans",
            onAction: handleManagePricingClick,
          },
        }
      : isFreePlan
        ? {
            tone: "info",
            message:
              "Content protection is a Growth plan feature. Upgrade to unlock it.",
            action: {
              content: "Upgrade to Growth",
              onAction: handleManagePricingClick,
            },
          }
        : feedback;

  return (
    <Page
      title="Content protection"
      subtitle="Disable right-click and common keyboard shortcuts on your storefront."
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
      secondaryActions={
        !isPremiumPlan
          ? [
              {
                content: "View plans",
                onAction: handleManagePricingClick,
              },
            ]
          : undefined
      }
    >
      <SaveBar id={SAVE_BAR_ID} discardConfirmation="">
        <button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || !isPremiumPlan}
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
                enabled={draftEnabled}
                isPremiumPlan={isPremiumPlan}
                hasPlan={hasPlan}
                isFreePlan={isFreePlan}
                isDirty={isDirty}
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
                      <InlineStack gap="200" blockAlign="center" wrap>
                        <Text as="h2" variant="headingMd">
                          Protection settings
                        </Text>
                        {!isPremiumPlan && (
                          <Badge tone="attention">Growth</Badge>
                        )}
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Turn this on to discourage casual copying on your
                        storefront
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </Box>
                <Divider />
                <Box padding="400">
                  <BlockStack gap="400">
                    <div
                      style={{
                        opacity: isPremiumPlan ? 1 : 0.55,
                        pointerEvents: isPremiumPlan ? "auto" : "none",
                      }}
                      aria-disabled={!isPremiumPlan}
                    >
                      <SettingToggle
                        action={{
                          content: draftEnabled ? "Turn off" : "Turn on",
                          onAction: handleToggle,
                          disabled: !isPremiumPlan || isSaving,
                          variant: "primary",
                        }}
                        enabled={draftEnabled && isPremiumPlan}
                      >
                        <Text variant="headingMd" as="h6">
                          Content protection
                        </Text>
                        <Text variant="bodyMd" as="p">
                          {draftEnabled && isPremiumPlan
                            ? "Protection will be on after you save. Right-click and selected shortcuts are blocked on your storefront."
                            : "Turn on, then save, to block right-click and shortcuts like Ctrl+C, Ctrl+U, and F12."}
                        </Text>
                      </SettingToggle>
                    </div>

                    {!isPremiumPlan && (
                      <Box
                        background="bg-surface-secondary"
                        padding="300"
                        borderRadius="200"
                      >
                        <InlineStack gap="200" blockAlign="center" wrap>
                          <Badge tone="attention">Growth</Badge>
                          <Text as="p" variant="bodySm" tone="subdued">
                            This setting is locked on your current plan.
                          </Text>
                          <Button
                            variant="plain"
                            onClick={handleManagePricingClick}
                          >
                            Upgrade to Growth
                          </Button>
                        </InlineStack>
                      </Box>
                    )}

                    <Box
                      background="bg-surface-secondary"
                      padding="300"
                      borderRadius="200"
                    >
                      <InlineStack gap="200" blockAlign="start" wrap={false}>
                        <Icon source={AlertTriangleIcon} tone="caution" />
                        <Text as="p" variant="bodySm" tone="subdued">
                          Disabling shortcuts does not prevent copying or
                          guarantee security. It can also interfere with browser
                          features and assistive technology.
                        </Text>
                      </InlineStack>
                    </Box>
                  </BlockStack>
                </Box>
              </Card>

              {draftEnabled && isPremiumPlan && <ProtectedShortcutsCard />}
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <ThemeIntegrationCard
                isPremiumPlan={isPremiumPlan}
                themeStatus={themeStatus}
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
