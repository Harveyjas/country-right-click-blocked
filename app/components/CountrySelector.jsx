import { useState } from "react";
import {
  BlockStack,
  Text,
  InlineStack,
  Tag,
  Box,
  Checkbox,
  Collapsible,
  Badge,
  Button,
  Divider,
  Card,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";

const continents = {
  Africa: [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "DJ",
    "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE", "LS",
    "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW",
    "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW",
  ],
  Asia: [
    "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "CY", "GE", "IN", "ID",
    "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB", "MY", "MV", "MN",
    "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA", "SA", "SG", "KR", "LK", "SY",
    "TW", "TJ", "TH", "TL", "TM", "AE", "UZ", "VN", "YE",
  ],
  Europe: [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "MD", "MC",
    "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES",
    "SE", "CH", "UA", "GB", "VA",
  ],
  "North America": [
    "AG", "BS", "BB", "BZ", "CA", "CR", "CU", "DM", "DO", "SV", "GD", "GT", "HT",
    "HN", "JM", "MX", "NI", "PA", "KN", "LC", "VC", "TT", "US",
  ],
  "South America": [
    "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE",
  ],
  Oceania: [
    "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO", "TV", "VU",
  ],
};

const countryLabels = {
  DZ: "Algeria", AO: "Angola", BJ: "Benin", BW: "Botswana", BF: "Burkina Faso",
  BI: "Burundi", CM: "Cameroon", CV: "Cape Verde", CF: "Central African Republic",
  TD: "Chad", KM: "Comoros", CG: "Congo", DJ: "Djibouti", EG: "Egypt",
  GQ: "Equatorial Guinea", ER: "Eritrea", SZ: "Eswatini", ET: "Ethiopia",
  GA: "Gabon", GM: "Gambia", GH: "Ghana", GN: "Guinea", GW: "Guinea-Bissau",
  CI: "Ivory Coast", KE: "Kenya", LS: "Lesotho", LR: "Liberia", LY: "Libya",
  MG: "Madagascar", MW: "Malawi", ML: "Mali", MR: "Mauritania", MU: "Mauritius",
  MA: "Morocco", MZ: "Mozambique", NA: "Namibia", NE: "Niger", NG: "Nigeria",
  RW: "Rwanda", ST: "Sao Tome and Principe", SN: "Senegal", SC: "Seychelles",
  SL: "Sierra Leone", SO: "Somalia", ZA: "South Africa", SS: "South Sudan",
  SD: "Sudan", TZ: "Tanzania", TG: "Togo", TN: "Tunisia", UG: "Uganda",
  ZM: "Zambia", ZW: "Zimbabwe", AF: "Afghanistan", AM: "Armenia", AZ: "Azerbaijan",
  BH: "Bahrain", BD: "Bangladesh", BT: "Bhutan", BN: "Brunei", KH: "Cambodia",
  CN: "China", CY: "Cyprus", GE: "Georgia", IN: "India", ID: "Indonesia",
  IR: "Iran", IQ: "Iraq", IL: "Israel", JP: "Japan", JO: "Jordan", KZ: "Kazakhstan",
  KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos", LB: "Lebanon", MY: "Malaysia",
  MV: "Maldives", MN: "Mongolia", MM: "Myanmar", NP: "Nepal", KP: "North Korea",
  OM: "Oman", PK: "Pakistan", PS: "Palestine", PH: "Philippines", QA: "Qatar",
  SA: "Saudi Arabia", SG: "Singapore", KR: "South Korea", LK: "Sri Lanka",
  SY: "Syria", TW: "Taiwan", TJ: "Tajikistan", TH: "Thailand", TL: "Timor-Leste",
  TM: "Turkmenistan", AE: "United Arab Emirates", UZ: "Uzbekistan", VN: "Vietnam",
  YE: "Yemen", AL: "Albania", AD: "Andorra", AT: "Austria", BY: "Belarus",
  BE: "Belgium", BA: "Bosnia and Herzegovina", BG: "Bulgaria", HR: "Croatia",
  CZ: "Czech Republic", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
  DE: "Germany", GR: "Greece", HU: "Hungary", IS: "Iceland", IE: "Ireland",
  IT: "Italy", LV: "Latvia", LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg",
  MT: "Malta", MD: "Moldova", MC: "Monaco", ME: "Montenegro", NL: "Netherlands",
  MK: "North Macedonia", NO: "Norway", PL: "Poland", PT: "Portugal", RO: "Romania",
  RU: "Russia", SM: "San Marino", RS: "Serbia", SK: "Slovakia", SI: "Slovenia",
  ES: "Spain", SE: "Sweden", CH: "Switzerland", UA: "Ukraine", GB: "United Kingdom",
  VA: "Vatican City", AG: "Antigua and Barbuda", BS: "Bahamas", BB: "Barbados",
  BZ: "Belize", CA: "Canada", CR: "Costa Rica", CU: "Cuba", DM: "Dominica",
  DO: "Dominican Republic", SV: "El Salvador", GD: "Grenada", GT: "Guatemala",
  HT: "Haiti", HN: "Honduras", JM: "Jamaica", MX: "Mexico", NI: "Nicaragua",
  PA: "Panama", KN: "Saint Kitts and Nevis", LC: "Saint Lucia",
  VC: "Saint Vincent and the Grenadines", TT: "Trinidad and Tobago",
  US: "United States", AR: "Argentina", BO: "Bolivia", BR: "Brazil", CL: "Chile",
  CO: "Colombia", EC: "Ecuador", GY: "Guyana", PY: "Paraguay", PE: "Peru",
  SR: "Suriname", UY: "Uruguay", VE: "Venezuela", AU: "Australia", FJ: "Fiji",
  KI: "Kiribati", MH: "Marshall Islands", FM: "Micronesia", NR: "Nauru",
  NZ: "New Zealand", PW: "Palau", PG: "Papua New Guinea", WS: "Samoa",
  SB: "Solomon Islands", TO: "Tonga", TV: "Tuvalu", VU: "Vanuatu",
};

function applyLimit(selection, countryLimit) {
  if (!countryLimit) return selection;
  return selection.slice(0, countryLimit);
}

export default function CountrySelector({
  disabled = false,
  selectedCountries = [],
  onChange,
  countryLimit = null,
  limitReached = false,
}) {
  const [expandedContinents, setExpandedContinents] = useState({});
  const [showAllCountries, setShowAllCountries] = useState(false);
  const interactive = !disabled;

  const emitChange = (next) => {
    if (!interactive || !onChange) return;
    onChange(applyLimit(next, countryLimit));
  };

  const isContinentFullySelected = (continentName) => {
    const codes = continents[continentName] || [];
    return codes.length > 0 && codes.every((code) => selectedCountries.includes(code));
  };

  const isContinentPartiallySelected = (continentName) => {
    const codes = continents[continentName] || [];
    const selectedCount = codes.filter((code) => selectedCountries.includes(code)).length;
    return selectedCount > 0 && selectedCount < codes.length;
  };

  const handleContinentToggle = (continentName, checked) => {
    if (!interactive) return;

    let next;
    if (continentName === "Select All") {
      next = checked ? Object.values(continents).flat() : [];
    } else {
      const continentCountries = continents[continentName] || [];
      if (checked) {
        const toAdd = continentCountries.filter((code) => !selectedCountries.includes(code));
        next = [...selectedCountries, ...toAdd];
      } else {
        next = selectedCountries.filter((code) => !continentCountries.includes(code));
      }
    }

    emitChange(next);
  };

  const handleCountryToggle = (countryCode, checked) => {
    if (!interactive) return;

    if (checked) {
      if (limitReached && !selectedCountries.includes(countryCode)) return;
      emitChange([...selectedCountries, countryCode]);
    } else {
      emitChange(selectedCountries.filter((code) => code !== countryCode));
    }
  };

  const removeCountry = (code) => {
    if (!interactive) return;
    emitChange(selectedCountries.filter((value) => value !== code));
  };

  const handleClearAll = () => {
    if (!interactive) return;
    emitChange([]);
  };

  const countriesByContinent = Object.keys(continents).reduce((acc, continent) => {
    acc[continent] = selectedCountries
      .filter((code) => continents[continent].includes(code))
      .map((code) => ({ code, label: countryLabels[code] || code }));
    return acc;
  }, {});

  return (
    <BlockStack gap="400">
      <div style={{ opacity: interactive ? 1 : 0.5 }}>
        <BlockStack gap="400">
          <Box background="bg-surface-secondary" padding="300" borderRadius="200">
            <InlineStack align="space-between" blockAlign="center" wrap gap="300">
              <BlockStack gap="050">
                <Text variant="headingSm" as="h4">
                  Quick select
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Apply or clear every country in one step
                </Text>
              </BlockStack>
              <InlineStack gap="200" wrap>
                <Button
                  onClick={() => handleContinentToggle("Select All", true)}
                  disabled={!interactive || limitReached}
                  size="slim"
                  variant="primary"
                >
                  Select all
                </Button>
                <Button
                  onClick={handleClearAll}
                  disabled={!interactive || selectedCountries.length === 0}
                  size="slim"
                  icon={DeleteIcon}
                >
                  Clear all
                </Button>
              </InlineStack>
            </InlineStack>
          </Box>

          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingSm" as="h4">
                Browse by region
              </Text>
              <Text variant="bodySm" as="p" tone="subdued">
                {countryLimit
                  ? `${selectedCountries.length}/${countryLimit} selected`
                  : `${selectedCountries.length} selected`}
              </Text>
            </InlineStack>

            <div
              style={{
                maxHeight: "360px",
                overflowY: "auto",
                overflowX: "hidden",
                border: "1px solid var(--p-color-border, #e1e3e5)",
                borderRadius: "12px",
                backgroundColor: "var(--p-color-bg-surface, #ffffff)",
              }}
            >
              <BlockStack gap="0">
                {Object.keys(continents).map((continentName, index) => {
                  const isFullySelected = isContinentFullySelected(continentName);
                  const isPartiallySelected = isContinentPartiallySelected(continentName);
                  const continentCountries = continents[continentName];
                  const selectedCount = continentCountries.filter((code) =>
                    selectedCountries.includes(code),
                  ).length;
                  const isExpanded = expandedContinents[continentName];
                  const isLast = index === Object.keys(continents).length - 1;

                  return (
                    <div key={continentName}>
                      <Box
                        padding="300"
                        background={isExpanded ? "bg-surface-secondary" : undefined}
                      >
                        <BlockStack gap="300">
                          <InlineStack
                            gap="300"
                            align="space-between"
                            blockAlign="center"
                            wrap={false}
                          >
                            <Checkbox
                              label={
                                <InlineStack gap="200" blockAlign="center" wrap>
                                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                                    {continentName}
                                  </Text>
                                  <Badge
                                    tone={
                                      selectedCount > 0
                                        ? isFullySelected
                                          ? "success"
                                          : "info"
                                        : undefined
                                    }
                                    size="small"
                                  >
                                    {`${selectedCount}/${continentCountries.length}`}
                                  </Badge>
                                </InlineStack>
                              }
                              checked={isFullySelected}
                              indeterminate={isPartiallySelected}
                              onChange={(checked) =>
                                handleContinentToggle(continentName, checked)
                              }
                              disabled={!interactive}
                            />
                            <Button
                              onClick={() =>
                                setExpandedContinents((prev) => ({
                                  ...prev,
                                  [continentName]: !prev[continentName],
                                }))
                              }
                              variant="plain"
                              size="slim"
                              icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                              accessibilityLabel={
                                isExpanded
                                  ? `Collapse ${continentName}`
                                  : `Expand ${continentName}`
                              }
                            >
                              {isExpanded ? "Hide" : "View"}
                            </Button>
                          </InlineStack>

                          <Collapsible open={isExpanded}>
                            <Box
                              padding="300"
                              paddingBlockStart="100"
                              background="bg-surface"
                              borderRadius="200"
                            >
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fill, minmax(180px, 1fr))",
                                  gap: "8px 16px",
                                }}
                              >
                                {continentCountries.map((countryCode) => (
                                  <Checkbox
                                    key={countryCode}
                                    label={countryLabels[countryCode] || countryCode}
                                    checked={selectedCountries.includes(countryCode)}
                                    onChange={(checked) =>
                                      handleCountryToggle(countryCode, checked)
                                    }
                                    disabled={
                                      !interactive ||
                                      (limitReached &&
                                        !selectedCountries.includes(countryCode))
                                    }
                                  />
                                ))}
                              </div>
                            </Box>
                          </Collapsible>
                        </BlockStack>
                      </Box>
                      {!isLast && <Divider />}
                    </div>
                  );
                })}
              </BlockStack>
            </div>
          </BlockStack>
        </BlockStack>
      </div>

      {selectedCountries.length > 0 ? (
        <Card padding="0">
          <Box padding="400" paddingBlockEnd="300">
            <InlineStack align="space-between" blockAlign="center" wrap gap="200">
              <BlockStack gap="050">
                <Text variant="headingMd" as="h2">
                  Blocked countries
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  Save your changes with the save bar before they apply on the storefront
                </Text>
              </BlockStack>
              <Badge tone="info">{`${selectedCountries.length} selected`}</Badge>
            </InlineStack>
          </Box>
          <Divider />
          <Box padding="400">
            <BlockStack gap="400">
              {Object.keys(countriesByContinent).map((continent) => {
                const continentCountries = countriesByContinent[continent];
                if (continentCountries.length === 0) return null;

                const displayedCountries = showAllCountries
                  ? continentCountries
                  : continentCountries.slice(0, 5);

                return (
                  <BlockStack key={continent} gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingSm" as="h3" fontWeight="semibold">
                        {continent}
                      </Text>
                      <Badge size="small">{String(continentCountries.length)}</Badge>
                    </InlineStack>
                    <InlineStack gap="200" wrap>
                      {displayedCountries.map((country) => (
                        <Tag
                          key={country.code}
                          onRemove={
                            interactive ? () => removeCountry(country.code) : undefined
                          }
                          disabled={!interactive}
                        >
                          {country.label}
                        </Tag>
                      ))}
                      {!showAllCountries && continentCountries.length > 5 && (
                        <Box paddingInline="100" paddingBlock="050">
                          <Text variant="bodySm" as="span" tone="subdued">
                            +{continentCountries.length - 5} more
                          </Text>
                        </Box>
                      )}
                    </InlineStack>
                  </BlockStack>
                );
              })}

              {selectedCountries.length > 15 && (
                <InlineStack align="start">
                  <Button
                    onClick={() => setShowAllCountries((value) => !value)}
                    variant="plain"
                    size="slim"
                  >
                    {showAllCountries ? "Show less" : "Show all countries"}
                  </Button>
                </InlineStack>
              )}
            </BlockStack>
          </Box>
        </Card>
      ) : (
        interactive && (
          <Box background="bg-surface-secondary" padding="500" borderRadius="200">
            <BlockStack gap="200" inlineAlign="center">
              <Text as="p" variant="bodyMd" fontWeight="semibold" alignment="center">
                No countries blocked yet
              </Text>
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Expand a region above and select the countries you want to restrict.
              </Text>
            </BlockStack>
          </Box>
        )
      )}
    </BlockStack>
  );
}
