import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  DataTable,
  Badge,
  InlineStack,
  Modal,
  Button,
  TextField,
  FormLayout,
  Box,
  Divider,
  EmptyState,
  Collapsible,
  Checkbox,
  Banner,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DeleteIcon, SearchIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { countryData } from "../utils/countryData";

function getCountryNameMap() {
  const codeToName = {};
  Object.values(countryData).forEach(continent => {
    continent.forEach(country => {
      codeToName[country.code] = country.name;
    });
  });
  return codeToName;
}

function CountrySelector({ selectedCountries, onSelectMultiple, onRemoveMultiple, disabledCountries = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContinents, setExpandedContinents] = useState({
    Africa: false,
    Asia: false,
    Europe: false,
    "North America": false,
    "South America": false,
    Oceania: false,
  });

  const toggleContinent = (continent) => {
    setExpandedContinents(prev => ({
      ...prev,
      [continent]: !prev[continent]
    }));
  };

  const availableCountriesInContinent = (continent) => {
    return countryData[continent].filter(country => !disabledCountries.includes(country.code));
  };

  const filterCountriesBySearch = (continent) => {
    const available = availableCountriesInContinent(continent);
    if (!searchQuery.trim()) return available;
    
    const query = searchQuery.toLowerCase();
    return available.filter(country => 
      country.name.toLowerCase().includes(query) || 
      country.code.toLowerCase().includes(query)
    );
  };

  const hasSearchResults = (continent) => {
    return filterCountriesBySearch(continent).length > 0;
  };

  const isContinentSelected = (continent) => {
    const availableCountries = availableCountriesInContinent(continent);
    return availableCountries.length > 0 && availableCountries.every(country => 
      selectedCountries.some(sel => sel.code === country.code)
    );
  };

  const isCountrySelected = (countryCode) => {
    return selectedCountries.some(country => country.code === countryCode);
  };

  const handleSelectContinent = (continent) => {
    const countriesToUse = availableCountriesInContinent(continent);
    const allSelected = countriesToUse.every(country => isCountrySelected(country.code));

    if (allSelected) {
      const codesToRemove = countriesToUse.map(c => c.code);
      onRemoveMultiple(codesToRemove);
    } else {
      const countriesToAdd = countriesToUse
        .filter(country => !isCountrySelected(country.code))
        .map(country => ({ name: country.name, code: country.code }));
      if (countriesToAdd.length > 0) {
        onSelectMultiple(countriesToAdd);
      }
    }
  };

  const handleCountryToggle = (countryName, countryCode) => {
    if (isCountrySelected(countryCode)) {
      onRemoveMultiple([countryCode]);
    } else {
      onSelectMultiple([{ name: countryName, code: countryCode }]);
    }
  };

  return (
    <Box paddingBlock="300">
      <BlockStack gap="200">
        <TextField
          label="Find a country"
          placeholder="Search by country name or code"
          value={searchQuery}
          onChange={setSearchQuery}
          clearButton
          onClearButtonClick={() => setSearchQuery('')}
        />
        {Object.entries(countryData).map(([continent, countries]) => {
          const availableCountries = availableCountriesInContinent(continent);
          
          if (availableCountries.length === 0) return null;
          
          if (searchQuery.trim() && !hasSearchResults(continent)) return null;
          
          const filteredCountries = searchQuery.trim() ? filterCountriesBySearch(continent) : availableCountries;
          const continentFullySelected = isContinentSelected(continent);
          const continentPartiallySelected = availableCountries.some(c => 
            selectedCountries.some(sel => sel.code === c.code)
          ) && !continentFullySelected;

          return (
            <Box key={continent} borderWidth="1" borderColor="border" borderRadius="300" overflow="hidden">
              <div style={{ display: 'flex', alignItems: 'stretch', background: expandedContinents[continent] ? '#f6f7f7' : '#fff' }}>
              <button
                type="button"
                onClick={() => toggleContinent(continent)}
                aria-expanded={expandedContinents[continent]}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                  font: 'inherit',
                }}
              >
                <InlineStack gap="200" align="center">
                  <Text variant="bodySm" fontWeight="semibold">{continent}</Text>
                  <Text variant="bodySm" tone="subdued">
                    {availableCountries.filter(country => isCountrySelected(country.code)).length} of {availableCountries.length} selected
                  </Text>
                  {continentFullySelected && <Badge tone="success">All selected</Badge>}
                  {continentPartiallySelected && <Badge tone="info">Partially selected</Badge>}
                </InlineStack>
                <Text variant="bodySm">{expandedContinents[continent] ? '−' : '+'}</Text>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <Button
                  size="slim"
                  variant="tertiary"
                  onClick={() => handleSelectContinent(continent)}
                  accessibilityLabel={`${continentFullySelected ? 'Deselect all' : 'Select all'} ${continent} countries`}
                >
                  {continentFullySelected ? 'Deselect all' : 'Select all'}
                </Button>
              </div>
              </div>

              {expandedContinents[continent] && (
                <Box paddingBlock="200" paddingInline="200" background="bg-surface">
                  <BlockStack gap="100">
                    {filterCountriesBySearch(continent).map((country) => {
                      const isSelected = isCountrySelected(country.code);
                      
                      return (
                        <label
                          key={country.code}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            background: isSelected ? '#f0f8f2' : '#fff',
                            border: `1px solid ${isSelected ? '#b7d9c1' : '#e3e5e7'}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: '10px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleCountryToggle(country.name, country.code)}
                            style={{ width: 16, height: 16, margin: 0, accentColor: '#16834a', flexShrink: 0, cursor: 'pointer' }}
                          />
                          <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}>
                            <Text variant="bodySm">{country.name}</Text>
                            <Badge tone="subdued">{country.code}</Badge>
                          </span>
                        </label>
                      );
                    })}
                  </BlockStack>
                </Box>
              )}
            </Box>
          );
        })}
      </BlockStack>
    </Box>
  );
}

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const countryCodeToName = getCountryNameMap();
    const shop = session.shop;

    const metafieldResponse = await admin.graphql(
      `#graphql
      query {
        shop {
          metafield(namespace: "countryblocker", key: "redirection-rules") {
            value
          }
        }
      }`
    );

    const metafieldJson = await metafieldResponse.json();
    
    if (metafieldJson.errors) {
      console.error("GraphQL Error - Metafield Query:", metafieldJson.errors);
      return json({ redirectionRules: [], markets: [] });
    }

    let redirectionRules = [];

    const metafield = metafieldJson.data?.shop?.metafield;
    if (metafield) {
      try {
        const parsedRules = JSON.parse(metafield.value);
        
        const rulesByUrl = {};
        Object.entries(parsedRules).forEach(([code, url]) => {
          if (!rulesByUrl[url]) {
            rulesByUrl[url] = [];
          }
          rulesByUrl[url].push(code);
        });

        redirectionRules = Object.entries(rulesByUrl).map(([url, countryCodes], index) => ({
          id: `rule-${index}-${Date.now()}`,
          name: `Redirect Rule ${index + 1}`,
          url: url,
          countries: countryCodes.map(code => ({ 
            name: countryCodeToName[code] || code, 
            code: code 
          })),
        }));
      } catch (error) {
        console.error("Error parsing redirection rules:", error);
      }
    }

    let marketsMap = {};
    try {
      const marketsResponse = await admin.graphql(
        `#graphql
        query {
          markets(first: 100) {
            edges {
              node {
                id
                name
                enabled
              }
            }
          }
        }`
      );

      const marketsJson = await marketsResponse.json();
      console.log("Markets Query Response:", JSON.stringify(marketsJson, null, 2));
      
      if (marketsJson.errors) {
        console.error("Markets Query GraphQL Errors:", marketsJson.errors);
      }
      
      const marketsData = marketsJson.data?.markets?.edges?.map(edge => edge.node) || [];
      console.log("Markets Data Found:", marketsData.length);
      
      if (marketsData.length > 0) {
        for (const market of marketsData) {
          const countriesResponse = await admin.graphql(
            `#graphql
            query getMarketCountries($id: ID!) {
              market(id: $id) {
                id
                name
                enabled
                regions(first: 100) {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
            }`,
            {
              variables: { id: market.id }
            }
          );

          const countriesJson = await countriesResponse.json();
          console.log(`Countries for market ${market.name}:`, JSON.stringify(countriesJson, null, 2));
          
          if (!marketsMap[market.id]) {
            marketsMap[market.id] = {
              marketId: market.id,
              marketName: market.name,
              countries: [],
              status: market.enabled ? 'Active' : 'Inactive',
            };
          }
          
          if (countriesJson.data?.market?.regions?.edges) {
            const regions = countriesJson.data.market.regions.edges;
            regions.forEach(regionEdge => {
              marketsMap[market.id].countries.push({
                name: regionEdge.node.name,
                code: regionEdge.node.id?.split('/').pop() || 'N/A',
              });
            });
          }
        }
      }
      
      if (Object.keys(marketsMap).length === 0 && marketsData.length > 0) {
        marketsData.forEach(market => {
          marketsMap[market.id] = {
            marketId: market.id,
            marketName: market.name,
            countries: [{ name: 'Multiple Countries', code: 'MULTI' }],
            status: market.enabled ? 'Active' : 'Inactive',
          };
        });
      }
      
      if (Object.keys(marketsMap).length === 0) {
        console.log("No markets found, attempting to fetch shipping zones as alternative...");
        const shippingResponse = await admin.graphql(
          `#graphql
          query {
            shop {
              id
              name
            }
            shippingZones(first: 100) {
              edges {
                node {
                  id
                  name
                  countries(first: 100) {
                    edges {
                      node {
                        code
                        name
                      }
                    }
                  }
                }
              }
            }
          }`
        );
        
        const shippingJson = await shippingResponse.json();
        console.log("Shipping Zones Response:", JSON.stringify(shippingJson, null, 2));
        
        if (shippingJson.data?.shippingZones?.edges) {
          const zones = shippingJson.data.shippingZones.edges;
          zones.forEach((zoneEdge, idx) => {
            const zone = zoneEdge.node;
            if (!marketsMap[zone.id]) {
              marketsMap[zone.id] = {
                marketId: zone.id,
                marketName: zone.name || `Zone ${idx + 1}`,
                countries: [],
                status: 'Active',
              };
            }
            
            if (zone.countries?.edges) {
              zone.countries.edges.forEach(countryEdge => {
                marketsMap[zone.id].countries.push({
                  name: countryEdge.node.name,
                  code: countryEdge.node.code,
                });
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
      marketsMap = {};
    }
    
    const markets = Object.values(marketsMap);

    return json({ redirectionRules, markets, shop, apiKey: process.env.SHOPIFY_API_KEY || "" });
  } catch (error) {
    console.error("Loader Error:", error);
    return json({ redirectionRules: [], markets: [], shop: null });
  }
};

function CountriesCell({ countries }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const countryList = countries || [];
  const showMore = countryList.length > 3;
  const displayedCountries = countryList.slice(0, 4);

  return (
    <>
      <BlockStack gap="100">
        <Text as="p" variant="bodyMd">
          {displayedCountries.join(', ')}
        </Text>
        {showMore && (
          <Button
            size="slim"
            onClick={() => setIsModalOpen(true)}
            variant="secondary"
          >
            View all {countryList.length} countries
          </Button>
        )}
      </BlockStack>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="All Countries"
        primaryAction={{
          content: 'Close',
          onAction: () => setIsModalOpen(false),
        }}
      >
        <Modal.Section>
          <BlockStack gap="200">
            {countryList.map((country, idx) => (
              <Text key={idx} as="p" variant="bodyMd">
                • {country}
              </Text>
            ))}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}

function AddRedirectionModal({ isOpen, onClose, onAdd, existingRules = [] }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [countriesError, setCountriesError] = useState('');

  const disabledCountries = existingRules.flatMap(rule => 
    (rule.countries || []).map(country => country.code)
  );

  const validateUrl = (urlValue) => {
    if (!urlValue.trim()) {
      return 'Redirection URL is required';
    }
    if (!urlValue.startsWith('http://') && !urlValue.startsWith('https://')) {
      return 'URL must start with http:// or https://';
    }
    return '';
  };

  const validateName = (nameValue) => {
    if (!nameValue.trim()) {
      return 'Rule Name is required';
    }
    return '';
  };

  const validateCountries = () => {
    if (selectedCountries.length === 0) {
      return 'Please select at least one country';
    }
    return '';
  };

  const handleAdd = () => {
    const nameErr = validateName(name);
    const urlErr = validateUrl(url);
    const countriesErr = validateCountries();

    setNameError(nameErr);
    setUrlError(urlErr);
    setCountriesError(countriesErr);

    if (!nameErr && !urlErr && !countriesErr) {
      onAdd({
        name: name.trim(),
        url: url.trim(),
        countries: selectedCountries,
      });
      setName('');
      setUrl('');
      setSelectedCountries([]);
      setNameError('');
      setUrlError('');
      setCountriesError('');
    }
  };

  const handleModalClose = () => {
    setName('');
    setUrl('');
    setSelectedCountries([]);
    setNameError('');
    setUrlError('');
    setCountriesError('');
    onClose();
  };

  const handleNameChange = (value) => {
    setName(value);
    setNameError('');
  };

  const handleUrlChange = (value) => {
    setUrl(value);
    setUrlError('');
  };

  const handleCountriesSelect = (countries) => {
    handleSelectMultiple(countries);
    setCountriesError('');
  };

  const handleSelectMultiple = (countries) => {
    setSelectedCountries(prev => {
      const newCountries = [...prev];
      countries.forEach(country => {
        if (!newCountries.some(c => c.code === country.code)) {
          newCountries.push(country);
        }
      });
      return newCountries;
    });
  };

  const handleRemoveMultiple = (countryCodes) => {
    setSelectedCountries(prev => 
      prev.filter(c => !countryCodes.includes(c.code))
    );
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleModalClose}
      title="Create New Redirection Rule"
      primaryAction={{
        content: 'Create Rule',
        onAction: handleAdd,
        disabled: !!nameError || !!urlError || !!countriesError || (!name.trim() && !url.trim() && selectedCountries.length === 0),
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleModalClose,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Rule Name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g., US Market Redirect"
            helpText="Give this rule a descriptive name"
            requiredIndicator
            error={nameError}
          />
          <TextField
            label="Redirection URL"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            helpText="The URL customers will be redirected to"
            type="url"
            requiredIndicator
            error={urlError}
          />
          <BlockStack gap="200">
            <Box>
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="semibold">
                  Select Countries <span style={{ color: '#d32f2f' }}>*</span>
                </Text>
                {countriesError && (
                  <Box background="bg-surface-critical" paddingBlock="200" paddingInline="200" borderRadius="200">
                    <Text variant="bodySm" tone="critical">
                      {countriesError}
                    </Text>
                  </Box>
                )}
                {selectedCountries.length > 0 && (
                  <Box background="bg-surface-success" paddingBlock="200" paddingInline="200" borderRadius="200">
                    <BlockStack gap="100">
                      <InlineStack gap="100" wrap>
                        {selectedCountries.map((country) => (
                          <Badge 
                            key={country.code}
                            tone="success"
                            onRemove={() => {
                              handleRemoveMultiple([country.code]);
                              setCountriesError('');
                            }}
                          >
                            ✓ {country.name}
                          </Badge>
                        ))}
                      </InlineStack>
                      {selectedCountries.length > 0 && (
                        <Button
                          size="slim"
                          variant="tertiary"
                          onClick={() => {
                            setSelectedCountries([]);
                            setCountriesError('');
                          }}
                        >
                          Clear All
                        </Button>
                      )}
                    </BlockStack>
                  </Box>
                )}
                <Text variant="bodySm" tone="subdued">
                  Choose individual countries, or expand a continent and select all of its available countries.
                </Text>
              </BlockStack>
            </Box>
            <CountrySelector 
              selectedCountries={selectedCountries}
              onSelectMultiple={handleCountriesSelect}
              onRemoveMultiple={(codes) => {
                handleRemoveMultiple(codes);
                setCountriesError('');
              }}
              disabledCountries={disabledCountries}
            />
          </BlockStack>
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, rule }) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Delete Redirection Rule?"
      primaryAction={{
        content: 'Delete Rule',
        onAction: onConfirm,
        tone: 'critical',
      }}
      secondaryActions={[
        {
          content: 'Keep Rule',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              Are you sure you want to delete this redirection rule? This action cannot be undone.
            </Text>
            <Box 
              paddingBlock="300" 
              paddingInline="300" 
              background="bg-surface-warning"
              borderRadius="200"
              borderWidth="1"
              borderColor="border-warning"
            >
              <BlockStack gap="100">
                <Text as="p" variant="bodySm" fontWeight="semibold">
                  Rule: {rule?.name}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  URL: {rule?.url}
                </Text>
                <BlockStack gap="50">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Countries:
                  </Text>
                  <InlineStack gap="100" wrap>
                    {(rule?.countries || []).map((country) => (
                      <Badge key={country.code} tone="info">
                        {country.name}
                      </Badge>
                    ))}
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Box>
          </BlockStack>
          <Text as="p" variant="bodySm" tone="subdued">
            You can create this rule again later if needed.
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

function EditRedirectionModal({ isOpen, onClose, onSave, rule, allRules = [] }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [countriesError, setCountriesError] = useState('');

  const disabledCountries = allRules
    .filter(r => r.id !== rule?.id)
    .flatMap(r => (r.countries || []).map(country => country.code));

  useEffect(() => {
    if (isOpen && rule) {
      setName(rule.name || '');
      setUrl(rule.url || '');
      if (rule.countries && Array.isArray(rule.countries)) {
        setSelectedCountries(rule.countries);
      } else if (rule.country) {
        setSelectedCountries([{ name: rule.country, code: rule.country }]);
      } else {
        setSelectedCountries([]);
      }
      setNameError('');
      setUrlError('');
      setCountriesError('');
    }
  }, [isOpen, rule]);

  const validateUrl = (urlValue) => {
    if (!urlValue.trim()) {
      return 'Redirection URL is required';
    }
    if (!urlValue.startsWith('http://') && !urlValue.startsWith('https://')) {
      return 'URL must start with http:// or https://';
    }
    return '';
  };

  const validateName = (nameValue) => {
    if (!nameValue.trim()) {
      return 'Rule Name is required';
    }
    return '';
  };

  const validateCountries = () => {
    if (selectedCountries.length === 0) {
      return 'Please select at least one country';
    }
    return '';
  };

  const handleSave = () => {
    const nameErr = validateName(name);
    const urlErr = validateUrl(url);
    const countriesErr = validateCountries();

    setNameError(nameErr);
    setUrlError(urlErr);
    setCountriesError(countriesErr);

    if (!nameErr && !urlErr && !countriesErr) {
      onSave({
        ...rule,
        name: name.trim(),
        url: url.trim(),
        countries: selectedCountries,
      });
    }
  };

  const handleNameChange = (value) => {
    setName(value);
    setNameError('');
  };

  const handleUrlChange = (value) => {
    setUrl(value);
    setUrlError('');
  };

  const handleCountriesSelect = (countries) => {
    handleSelectMultiple(countries);
    setCountriesError('');
  };

  const handleSelectMultiple = (countries) => {
    setSelectedCountries(prev => {
      const newCountries = [...prev];
      countries.forEach(country => {
        if (!newCountries.some(c => c.code === country.code)) {
          newCountries.push(country);
        }
      });
      return newCountries;
    });
  };

  const handleRemoveMultiple = (countryCodes) => {
    setSelectedCountries(prev => 
      prev.filter(c => !countryCodes.includes(c.code))
    );
  };

  const handleModalClose = () => {
    setNameError('');
    setUrlError('');
    setCountriesError('');
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleModalClose}
      title="Edit Redirection Rule"
      primaryAction={{
        content: 'Save Changes',
        onAction: handleSave,
        disabled: !!nameError || !!urlError || !!countriesError,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleModalClose,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <TextField
            label="Rule Name"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g., US Market Redirect"
            helpText="Update the rule name if needed"
            requiredIndicator
            error={nameError}
          />
          <TextField
            label="Redirection URL"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            helpText="Update the target URL"
            type="url"
            requiredIndicator
            error={urlError}
          />
          <BlockStack gap="200">
            <Box>
              <BlockStack gap="200">
                <Text variant="bodyMd" fontWeight="semibold">
                  Select Countries <span style={{ color: '#d32f2f' }}>*</span>
                </Text>
                {countriesError && (
                  <Box background="bg-surface-critical" paddingBlock="200" paddingInline="200" borderRadius="200">
                    <Text variant="bodySm" tone="critical">
                      {countriesError}
                    </Text>
                  </Box>
                )}
                {selectedCountries.length > 0 && (
                  <Box background="bg-surface-success" paddingBlock="200" paddingInline="200" borderRadius="200">
                    <BlockStack gap="100">
                      <InlineStack gap="100" wrap>
                        {selectedCountries.map((country) => (
                          <Badge 
                            key={country.code}
                            tone="success"
                            onRemove={() => {
                              handleRemoveMultiple([country.code]);
                              setCountriesError('');
                            }}
                          >
                            ✓ {country.name}
                          </Badge>
                        ))}
                      </InlineStack>
                      {selectedCountries.length > 0 && (
                        <Button
                          size="slim"
                          variant="tertiary"
                          onClick={() => {
                            setSelectedCountries([]);
                            setCountriesError('');
                          }}
                        >
                          Clear All
                        </Button>
                      )}
                    </BlockStack>
                  </Box>
                )}
                <Text variant="bodySm" tone="subdued">
                  Click "Select All" to select an entire continent, or click individual countries
                </Text>
              </BlockStack>
            </Box>
            <CountrySelector 
              selectedCountries={selectedCountries}
              onSelectMultiple={handleCountriesSelect}
              onRemoveMultiple={(codes) => {
                handleRemoveMultiple(codes);
                setCountriesError('');
              }}
              disabledCountries={disabledCountries}
            />
          </BlockStack>
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}

export default function RedirectionRules() {
  const { redirectionRules: initialRules, markets: initialMarkets, shop, apiKey } = useLoaderData();
  const [redirections, setRedirections] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerError, setBannerError] = useState('');

  useEffect(() => {
    if (initialRules && initialRules.length > 0) {
      setRedirections(initialRules);
    }
    if (initialMarkets && initialMarkets.length > 0) {
      setMarkets(initialMarkets);
    }
  }, []);

  const saveToMetafield = async (updatedRules) => {
    try {
      const response = await fetch('/api/redirection-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectionRules: updatedRules }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBannerMessage('Redirection rules saved successfully!');
      } else {
        setBannerError(data.error || 'Failed to save redirection rules');
      }
      
    } catch {
      setBannerError('Error saving redirection rules');
    }
  };

  const handleAddRedirection = (newRule) => {
    const updatedRules = [...redirections, { ...newRule, id: Date.now() }];
    setRedirections(updatedRules);
    saveToMetafield(updatedRules);
    setIsAddModalOpen(false);
  };

  const handleDeleteRedirection = (rule) => {
    setRuleToDelete(rule);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      const updatedRules = redirections.filter(rule => rule.id !== ruleToDelete.id);
      setRedirections(updatedRules);
      saveToMetafield(updatedRules);
      setIsDeleteModalOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleEditRedirection = (rule) => {
    setEditingRule(rule);
    setIsEditModalOpen(true);
  };

  const handleSaveRedirection = (updatedRule) => {
    const updatedRules = redirections.map(rule => rule.id === updatedRule.id ? updatedRule : rule);
    setRedirections(updatedRules);
    saveToMetafield(updatedRules);
    setIsEditModalOpen(false);
    setEditingRule(null);
  };

  const redirectionRows = redirections.map((rule) => [
    <Text key={`name-${rule.id}`} as="p" variant="bodyMd" fontWeight="semibold">
      {rule.name}
    </Text>,
    <Text 
      key={`url-${rule.id}`} 
      as="p" 
      variant="bodySm" 
      tone="subdued"
      monospaced
    >
      {rule.url}
    </Text>,
    <InlineStack key={`country-${rule.id}`} gap="100" wrap>
      {(rule.countries || (rule.country ? [{ name: rule.country, code: rule.country }] : [])).map((country) => (
        <Badge key={country.code} tone="info">
          {country.name}
        </Badge>
      ))}
    </InlineStack>,
    <InlineStack key={`actions-${rule.id}`} gap="200" wrap={false}>
      <Button
        size="slim"
        icon={EditIcon}
        onClick={() => handleEditRedirection(rule)}
        variant="tertiary"
        accessibilityLabel="Edit rule"
      >
        Edit
      </Button>
      <Button
        size="slim"
        icon={DeleteIcon}
        destructive
        onClick={() => handleDeleteRedirection(rule)}
        variant="tertiary"
        accessibilityLabel="Delete rule"
      >
        Delete
      </Button>
    </InlineStack>,
  ]);

  const marketsRows = markets.map((market, idx) => [
    <Text key={`market-name-${market.marketId}-${idx}`} as="p" variant="bodyMd" fontWeight="semibold">
      {market.marketName}
    </Text>,
    <InlineStack key={`countries-${market.marketId}-${idx}`} gap="100" wrap>
      {(market.countries || []).map((country) => (
        <Badge key={`${market.marketId}-${country.code}`} tone="info">
          {country.name}
        </Badge>
      ))}
    </InlineStack>,
    <Badge 
      key={`status-${market.marketId}-${idx}`}
      tone={market.status === 'Active' ? 'success' : 'warning'}
    >
      {market.status}
    </Badge>,
  ]);

  const pageBanner = bannerError
    ? { tone: "critical", message: bannerError, onDismiss: () => setBannerError("") }
    : bannerMessage
      ? { tone: "success", message: bannerMessage, onDismiss: () => setBannerMessage("") }
      : null;

  const openThemeEmbed = (embedHandle) => {
    if (!shop) return;
    const shopName = shop.replace(".myshopify.com", "");
    const embedUrl = `https://admin.shopify.com/store/${shopName}/themes/current/editor?context=apps&template=index&activateAppId=${apiKey}/${embedHandle}`;
    window.open(embedUrl, "_blank");
  };

  return (
    <Page
      title="Geo redirects"
      subtitle="Create a more relevant storefront experience for every market."
      backAction={{ content: "Home", url: "/app" }}
      fullWidth
    >
      <BlockStack gap="500">
        {pageBanner && (
          <Banner tone={pageBanner.tone} onDismiss={pageBanner.onDismiss}>
            <p>{pageBanner.message}</p>
          </Banner>
        )}
        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <Card padding="0">
                <BlockStack gap="0">
                  <Box padding="500" background="bg-surface-secondary">
                    <InlineStack align="space-between" blockAlign="center" wrap gap="400">
                      <BlockStack gap="200">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h2" variant="headingLg">Your redirect rules</Text>
                          <Badge tone={redirections.length ? "success" : "subdued"}>
                            {redirections.length} {redirections.length === 1 ? "rule" : "rules"}
                          </Badge>
                        </InlineStack>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Guide visitors to the right destination based on where they shop from.
                        </Text>
                      </BlockStack>
                      <Button variant="primary" icon={PlusIcon} onClick={() => setIsAddModalOpen(true)}>
                        Create rule
                      </Button>
                    </InlineStack>
                  </Box>
                  <Divider />
                  <Box paddingBlock="400" paddingInline="400">
                    {redirections.length === 0 ? (
                      <EmptyState
                        heading="No redirection rules yet"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-tasks.png"
                      >
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Create your first redirection rule to direct customers from specific countries to custom URLs.
                        </Text>
                      </EmptyState>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <DataTable
                          columnContentTypes={['text', 'text', 'text', 'text']}
                          headings={['Rule Name', 'Redirection URL', 'Countries', 'Actions']}
                          rows={redirectionRows}
                        />
                      </div>
                    )}
                  </Box>
                </BlockStack>
              </Card>

              <Card padding="0">
                <BlockStack gap="0">
                  <Box padding="400">
                    <InlineStack align="space-between" blockAlign="center" wrap gap="300">
                      <BlockStack gap="100">
                        <Text as="h2" variant="headingMd">Markets</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Countries and availability from your Shopify Markets setup.
                        </Text>
                      </BlockStack>
                      <Badge tone="info">{markets.length} {markets.length === 1 ? "market" : "markets"}</Badge>
                    </InlineStack>
                  </Box>
                  <Divider />
                  <Box paddingBlock="400" paddingInline="400">
                    {markets.length === 0 ? (
                      <EmptyState
                        heading="No market data available"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-tasks.png"
                      >
                        <Text as="p" variant="bodyMd" tone="subdued">
                          No markets have been set up for this store yet.
                        </Text>
                      </EmptyState>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <DataTable
                          columnContentTypes={['text', 'text', 'text']}
                          headings={['Market Name', 'Country', 'Status']}
                          rows={marketsRows}
                        />
                      </div>
                    )}
                  </Box>
                </BlockStack>
              </Card>

              <Card padding="0">
                <Box padding="400">
                  <InlineStack align="space-between" blockAlign="center" wrap gap="400">
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingMd">Connect your theme</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Choose one embed for your storefront: the Popup or Auto Redirect.
                      </Text>
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="attention">Setup required</Badge>
                        <Text as="p" variant="bodySm" tone="subdued">Takes about a minute</Text>
                      </InlineStack>
                    </BlockStack>
                    <InlineStack gap="200" wrap>
                      <Button variant="primary" onClick={() => openThemeEmbed("redirection_popup")}>
                        Configure popup
                      </Button>
                      <Button onClick={() => openThemeEmbed("auto_redirect")}>
                        Configure Auto Redirect
                      </Button>
                    </InlineStack>
                  </InlineStack>
                </Box>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>

        <AddRedirectionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddRedirection}
          existingRules={redirections}
        />
        <EditRedirectionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRedirection}
          rule={editingRule}
          allRules={redirections}
        />
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setRuleToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          rule={ruleToDelete}
        />
      </BlockStack>
    </Page>
  );
}
