import { Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Divider,
  Box,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

const FAQ_SECTIONS = [
  {
    title: "Getting started",
    items: [
      {
        question: "What does Geoshield do?",
        answer:
          "Geoshield helps you restrict storefront access by country, send visitors to another URL with geo redirects, and discourage casual content copying.",
      },
      {
        question: "How does country blocking work?",
        answer:
          "Country blocking compares your selected countries with the country Shopify provides for the visitor's storefront localization. VPNs or proxy services may affect the country Shopify detects.",
      },
      {
        question: "Why don't my settings appear on the storefront yet?",
        answer:
          "Settings save in the app, but each feature also needs its matching app embed enabled on your published theme. Use Open theme editor on each feature page to finish setup.",
      },
    ],
  },
  {
    title: "Plans and features",
    items: [
      {
        question: "Can I change country restrictions at any time?",
        answer:
          "Yes. Update your country list, then save with the save bar. Storefront behavior also depends on the Country Blocker app embed being enabled.",
      },
      {
        question: "Which features need the Growth plan?",
        answer:
          "Content protection (right-click and shortcut blocking) is available on the Growth plan. Essential includes country blocking with a limited country allowance.",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        question: "How can I get help?",
        answer:
          "Email support at ventosupport@gmail.com and include the affected feature plus steps to reproduce the issue.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <Page
      title="Help"
      subtitle="Answers to common setup and feature questions."
      backAction={{
        content: "Home",
        url: "/app",
      }}
    >
      <Layout>
        {FAQ_SECTIONS.map((section) => (
          <Layout.Section key={section.title}>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  {section.title}
                </Text>
                <BlockStack gap="300">
                  {section.items.map((item) => (
                    <BlockStack key={item.question} gap="100">
                      <Text as="h3" variant="headingSm">
                        {item.question}
                      </Text>
                      <Text as="p" variant="bodyMd">
                        {item.answer}
                      </Text>
                    </BlockStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        ))}

        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <InlineStack
                align="space-between"
                blockAlign="center"
                wrap
                gap="300"
              >
                <BlockStack gap="100">
                  <Text as="h2" variant="headingSm">
                    Privacy policy
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Review how Geoshield handles store data.
                  </Text>
                </BlockStack>
                <Link to="/app/privacy-policy">
                  <Button>View privacy policy</Button>
                </Link>
              </InlineStack>
            </Box>
            <Divider />
            <Box
              padding="300"
              paddingInline="400"
              background="bg-surface-secondary"
            >
              <Text as="p" variant="bodySm" tone="subdued">
                Tip: After saving settings, confirm each feature shows as live
                on theme from the Home page.
              </Text>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
