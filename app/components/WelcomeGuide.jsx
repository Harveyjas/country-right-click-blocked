import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Collapsible,
  Divider,
  Icon,
  InlineStack,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@shopify/polaris-icons";

const GUIDE_DISMISSED_KEY = "geoshield-setup-guide-dismissed";

function openThemeEditor(shopDomain, apiKey, blockHandle) {
  if (!shopDomain || !apiKey) return;
  const shopHandle = shopDomain.replace(".myshopify.com", "");
  const url = `https://admin.shopify.com/store/${shopHandle}/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/${blockHandle}`;
  window.open(url, "_blank");
}

function StepIndicator({ number, complete }) {
  if (complete) {
    return (
      <Box minWidth="28px" minHeight="28px">
        <InlineStack align="center" blockAlign="center">
          <Icon source={CheckCircleIcon} tone="success" />
        </InlineStack>
      </Box>
    );
  }

  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--p-color-bg-fill-secondary)",
        border: "1px solid var(--p-color-border)",
        flexShrink: 0,
      }}
    >
      <Text as="span" variant="bodySm" fontWeight="semibold">
        {number}
      </Text>
    </div>
  );
}

function GuideStep({ step, expanded, onToggle, showDivider, stepNumber }) {
  return (
    <Box>
      <Box padding="300" paddingInline="400">
        <InlineStack
          align="space-between"
          blockAlign="center"
          gap="300"
          wrap={false}
        >
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <StepIndicator number={stepNumber} complete={step.complete} />
            <BlockStack gap="050">
              <InlineStack gap="200" blockAlign="center" wrap>
                <Text
                  as="h3"
                  variant="bodyMd"
                  fontWeight="semibold"
                  tone={step.complete ? "subdued" : undefined}
                >
                  {step.title}
                </Text>
                {step.optional && !step.complete && (
                  <Badge tone="info" size="small">
                    Optional
                  </Badge>
                )}
                {step.complete && (
                  <Badge tone="success" size="small">
                    Done
                  </Badge>
                )}
              </InlineStack>
            </BlockStack>
          </InlineStack>

          <Button
            variant="plain"
            onClick={onToggle}
            icon={expanded ? ChevronUpIcon : ChevronDownIcon}
            accessibilityLabel={expanded ? "Hide step details" : "Show step details"}
          />
        </InlineStack>
      </Box>

      <Collapsible open={expanded} id={`guide-step-${step.id}`}>
        <Box padding="400" paddingBlockStart="0" paddingInlineStart="1000">
          <Box
            background="bg-surface-secondary"
            padding="400"
            borderRadius="200"
          >
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                {step.description}
              </Text>
              <InlineStack gap="200" wrap>
                {step.primaryAction}
                {step.secondaryAction}
              </InlineStack>
            </BlockStack>
          </Box>
        </Box>
      </Collapsible>

      {showDivider && <Divider />}
    </Box>
  );
}

export default function WelcomeGuide({
  blockedCountryCount,
  redirectionRuleCount,
  contentProtectionEnabled,
  extensionStatus,
  shopDomain,
  apiKey,
}) {
  const [guideOpen, setGuideOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [ready, setReady] = useState(false);

  const getBlockStatus = useCallback(
    (handle) => {
      if (extensionStatus.state === "checking") return "checking";
      if (extensionStatus.state === "unavailable") return "Not active";
      return extensionStatus[handle] || "Not found";
    },
    [extensionStatus],
  );

  const steps = useMemo(() => {
    const countryBlockLive = getBlockStatus("country_blocker") === "Active";

    return [
      {
        id: "select-countries",
        title: "Select countries to block",
        description:
          "Choose the countries that should not access your storefront. Start with markets you don’t ship to.",
        complete: blockedCountryCount > 0,
        primaryAction: (
          <Link to="/app/country-blocker">
            <Button variant="primary">
              {blockedCountryCount > 0 ? "Edit countries" : "Select countries"}
            </Button>
          </Link>
        ),
      },
      {
        id: "enable-country-block",
        title: "Enable country blocking on your theme",
        description:
          "Add the Country Blocker app block to your published theme so blocked visitors see the restriction message.",
        complete: countryBlockLive,
        primaryAction: (
          <Button
            variant="primary"
            onClick={() =>
              openThemeEditor(shopDomain, apiKey, "country_blocker")
            }
          >
            Open theme editor
          </Button>
        ),
        secondaryAction: (
          <Link to="/app/country-blocker">
            <Button>View settings</Button>
          </Link>
        ),
      },
      {
        id: "geo-redirect",
        title: "Create a geo redirect",
        description:
          "Send visitors from selected countries to another URL, language store, or market page. Then enable the redirect popup on your theme.",
        complete: redirectionRuleCount > 0,
        optional: true,
        primaryAction: (
          <Link to="/app/redirection-rules">
            <Button variant="primary">
              {redirectionRuleCount > 0 ? "Manage redirects" : "Create redirect"}
            </Button>
          </Link>
        ),
        secondaryAction: (
          <Button
            onClick={() =>
              openThemeEditor(shopDomain, apiKey, "redirection_popup")
            }
          >
            Enable on theme
          </Button>
        ),
      },
      {
        id: "content-protection",
        title: "Turn on content protection",
        description:
          "Discourage casual copying by blocking right-click and common shortcuts. Turn the setting on, save, then enable the app embed on your theme.",
        complete: contentProtectionEnabled,
        optional: true,
        primaryAction: (
          <Link to="/app/shortcuts">
            <Button variant="primary">
              {contentProtectionEnabled
                ? "Review settings"
                : "Turn on protection"}
            </Button>
          </Link>
        ),
        secondaryAction: (
          <Button
            onClick={() =>
              openThemeEditor(shopDomain, apiKey, "disable_shortcuts")
            }
          >
            Enable on theme
          </Button>
        ),
      },
    ];
  }, [
    apiKey,
    blockedCountryCount,
    contentProtectionEnabled,
    getBlockStatus,
    redirectionRuleCount,
    shopDomain,
  ]);

  const completedCount = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(GUIDE_DISMISSED_KEY) === "true";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || dismissed) return;
    const firstIncomplete = steps.find((step) => !step.complete);
    setExpandedStep(firstIncomplete?.id || steps[0]?.id || null);
  }, [ready, dismissed, steps]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(GUIDE_DISMISSED_KEY, "true");
    } catch {
      // Ignore storage failures in restricted browsers.
    }
    setDismissed(true);
  };

  const handleRestore = () => {
    try {
      localStorage.removeItem(GUIDE_DISMISSED_KEY);
    } catch {
      // Ignore storage failures in restricted browsers.
    }
    setDismissed(false);
    setGuideOpen(true);
  };

  if (!ready) return null;

  if (dismissed) {
    return (
      <Card>
        <InlineStack align="space-between" blockAlign="center" wrap gap="300">
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <Icon
              source={CheckCircleIcon}
              tone={allComplete ? "success" : "base"}
            />
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Setup guide
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {allComplete
                  ? "All setup steps are complete."
                  : `${completedCount} of ${steps.length} steps completed`}
              </Text>
            </BlockStack>
          </InlineStack>
          <Button onClick={handleRestore}>Show guide</Button>
        </InlineStack>
      </Card>
    );
  }

  return (
    <Card padding="0">
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="start" wrap gap="300">
            <BlockStack gap="100">
              <InlineStack gap="200" blockAlign="center" wrap>
                <Text as="h2" variant="headingMd">
                  Welcome to Geoshield
                </Text>
                {allComplete ? (
                  <Badge tone="success">Ready</Badge>
                ) : (
                  <Badge tone="info">Setup</Badge>
                )}
              </InlineStack>
              <Text as="p" variant="bodyMd" tone="subdued">
                Follow these steps to block countries, set redirects, and protect
                your storefront.
              </Text>
            </BlockStack>
            <InlineStack gap="200">
              <Button variant="plain" onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button
                variant="plain"
                onClick={() => setGuideOpen((open) => !open)}
                icon={guideOpen ? ChevronUpIcon : ChevronDownIcon}
              >
                {guideOpen ? "Collapse" : "Expand"}
              </Button>
            </InlineStack>
          </InlineStack>

          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center" wrap gap="200">
              <Text as="p" variant="bodySm" fontWeight="medium">
                {completedCount} of {steps.length} steps completed
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {progress}%
              </Text>
            </InlineStack>
            <ProgressBar progress={progress} size="small" tone="primary" />
          </BlockStack>
        </BlockStack>
      </Box>

      <Collapsible open={guideOpen} id="geoshield-setup-guide">
        <Divider />
        {steps.map((step, index) => (
          <GuideStep
            key={step.id}
            step={step}
            stepNumber={index + 1}
            expanded={expandedStep === step.id}
            onToggle={() =>
              setExpandedStep((current) =>
                current === step.id ? null : step.id,
              )
            }
            showDivider={index < steps.length - 1}
          />
        ))}
      </Collapsible>
    </Card>
  );
}
