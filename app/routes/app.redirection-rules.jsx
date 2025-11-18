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
    const countriesToUse = searchQuery.trim() ? filterCountriesBySearch(continent) : availableCountriesInContinent(continent);
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
          label="Search Countries"
          placeholder="Search by country name or code..."
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
          const filteredCountriesSelected = filteredCountries.every(country => isCountrySelected(country.code));
          const filteredCountriesPartiallySelected = filteredCountries.some(country => isCountrySelected(country.code)) && !filteredCountriesSelected;

          const continentFullySelected = searchQuery.trim() ? filteredCountriesSelected : isContinentSelected(continent);
          const continentPartiallySelected = searchQuery.trim() ? filteredCountriesPartiallySelected : (availableCountries.some(c => 
            selectedCountries.some(sel => sel.code === c.code)
          ) && !isContinentSelected(continent));

          return (
            <Box key={continent} borderWidth="1" borderColor="border" borderRadius="200" overflow="hidden">
              <button
                onClick={() => toggleContinent(continent)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: expandedContinents[continent] ? '#f3f3f3' : '#fafafa',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                <InlineStack gap="200" align="center">
                  <Text variant="bodySm" fontWeight="semibold">{continent}</Text>
                  {continentFullySelected && <Badge tone="success">All selected</Badge>}
                  {continentPartiallySelected && <Badge tone="info">Partially selected</Badge>}
                </InlineStack>
                <Text variant="bodySm">{expandedContinents[continent] ? '−' : '+'}</Text>
              </button>
              
              {expandedContinents[continent] && (
                <Box paddingBlock="200" paddingInline="200" background="bg-surface">
                  <BlockStack gap="100">
                    <Box 
                      paddingBlock="100" 
                      paddingInline="100"
                      background={continentFullySelected ? '#e8f5e9' : '#f5f5f5'}
                      borderRadius="100"
                    >
                      <button
                        onClick={() => handleSelectContinent(continent)}
                        style={{
                          width: '100%',
                          padding: '8px 0',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          color: continentFullySelected ? '#2e7d32' : '#333',
                        }}
                      >
                        {continentFullySelected ? '✓ Select All' : 'Select All'}
                      </button>
                    </Box>
                    {filterCountriesBySearch(continent).map((country) => {
                      const isSelected = isCountrySelected(country.code);
                      
                      return (
                        <button
                          key={country.code}
                          onClick={() => handleCountryToggle(country.name, country.code)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: isSelected ? '#e3f2fd' : 'transparent',
                            border: isSelected ? '1px solid #1e88e5' : 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                          }}
                        >
                          <InlineStack gap="200" align="center">
                            <Text variant="bodySm">
                              {isSelected && '✓'} {country.name}
                            </Text>
                            <Badge tone="subdued">{country.code}</Badge>
                          </InlineStack>
                        </button>
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
    const { admin } = await authenticate.admin(request);
    const countryCodeToName = getCountryNameMap();

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

    return json({ redirectionRules, markets });
  } catch (error) {
    console.error("Loader Error:", error);
    return json({ redirectionRules: [], markets: [] });
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
            💡 Tip: You can recreate this rule later if needed.
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
  const { redirectionRules: initialRules, markets: initialMarkets } = useLoaderData();
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
      
      setTimeout(() => {
        setBannerMessage('');
        setBannerError('');
      }, 3000);
    } catch (error) {
      setBannerError('Error saving redirection rules');
      setTimeout(() => setBannerError(''), 3000);
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

  return (
    <Page title="Redirection Rules" fullWidth>
      <BlockStack gap="800">
        {bannerMessage && (
          <Banner title="Success" onDismiss={() => setBannerMessage('')} tone="success">
            <p>{bannerMessage}</p>
          </Banner>
        )}
        {bannerError && (
          <Banner title="Error" onDismiss={() => setBannerError('')} tone="critical">
            <p>{bannerError}</p>
          </Banner>
        )}
        <Layout>
          <Layout.Section>
            <BlockStack gap="600">
              <Box paddingBlockEnd="400">
                <BlockStack gap="200">
                  <Text as="h1" variant="headingLg">
                    Redirection Rules
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Create country-specific redirect URLs for seamless global operations.
                  </Text>
                </BlockStack>
              </Box>

              <Card>
                <BlockStack gap="400">
                  <Box 
                    paddingBlock="400" 
                    paddingInline="400"
                    borderBottomWidth="1"
                    borderColor="border"
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingMd">
                          🔀 Redirection Rules
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Set up country-specific redirect URLs
                        </Text>
                      </BlockStack>
                      <Button
                        primary
                        icon={PlusIcon}
                        onClick={() => setIsAddModalOpen(true)}
                        size="medium"
                      >
                        Add Rule
                      </Button>
                    </InlineStack>
                  </Box>
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

              <Card>
                <BlockStack gap="400">
                  <Box 
                    paddingBlock="400" 
                    paddingInline="400"
                    borderBottomWidth="1"
                    borderColor="border"
                  >
                    <BlockStack gap="200">
                      <Text as="h2" variant="headingMd">
                        🌍 Market Data
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        View all active markets and their associated countries
                      </Text>
                    </BlockStack>
                  </Box>
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