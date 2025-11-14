import { useState, useEffect } from "react";
import {
  Card,
  Button,
  BlockStack,
  Text,
  InlineStack,
  Tag,
  Select,
  Banner,
  Spinner,
  Divider,
  Box,
  Checkbox,
  Collapsible,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import styles from "../routes/_index/styles.module.css";

// Define continents and their countries
const continents = {
  "Africa": [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "DJ", 
    "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE", "LS", 
    "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", 
    "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW"
  ],
  "Asia": [
    "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "CY", "GE", "IN", "ID", 
    "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB", "MY", "MV", "MN", 
    "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA", "SA", "SG", "KR", "LK", "SY", 
    "TW", "TJ", "TH", "TL", "TM", "AE", "UZ", "VN", "YE"
  ],
  "Europe": [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", 
    "DE", "GR", "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "MD", "MC", 
    "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", 
    "SE", "CH", "UA", "GB", "VA"
  ],
  "North America": [
    "AG", "BS", "BB", "BZ", "CA", "CR", "CU", "DM", "DO", "SV", "GD", "GT", "HT", 
    "HN", "JM", "MX", "NI", "PA", "KN", "LC", "VC", "TT", "US"
  ],
  "South America": [
    "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"
  ],
  "Oceania": [
    "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO", "TV", "VU"
  ]
};

// Create a flat list of countries with continent information
const countries = [
  // Special options for selecting all countries or all countries in a continent
  { label: "Select All Countries", value: "ALL_COUNTRIES", group: "Special" },
  { label: "─────────────────", value: "", group: "Special", disabled: true },
  { label: "All Africa", value: "ALL_AFRICA", group: "Special" },
  { label: "All Asia", value: "ALL_ASIA", group: "Special" },
  { label: "All Europe", value: "ALL_EUROPE", group: "Special" },
  { label: "All North America", value: "ALL_NORTH_AMERICA", group: "Special" },
  { label: "All South America", value: "ALL_SOUTH_AMERICA", group: "Special" },
  { label: "All Oceania", value: "ALL_OCEANIA", group: "Special" },
  { label: "─────────────────", value: "", group: "Special", disabled: true },
  
  // Africa
  { label: "Algeria", value: "DZ", group: "Africa" },
  { label: "Angola", value: "AO", group: "Africa" },
  { label: "Benin", value: "BJ", group: "Africa" },
  { label: "Botswana", value: "BW", group: "Africa" },
  { label: "Burkina Faso", value: "BF", group: "Africa" },
  { label: "Burundi", value: "BI", group: "Africa" },
  { label: "Cameroon", value: "CM", group: "Africa" },
  { label: "Cape Verde", value: "CV", group: "Africa" },
  { label: "Central African Republic", value: "CF", group: "Africa" },
  { label: "Chad", value: "TD", group: "Africa" },
  { label: "Comoros", value: "KM", group: "Africa" },
  { label: "Congo", value: "CG", group: "Africa" },
  { label: "Djibouti", value: "DJ", group: "Africa" },
  { label: "Egypt", value: "EG", group: "Africa" },
  { label: "Equatorial Guinea", value: "GQ", group: "Africa" },
  { label: "Eritrea", value: "ER", group: "Africa" },
  { label: "Eswatini", value: "SZ", group: "Africa" },
  { label: "Ethiopia", value: "ET", group: "Africa" },
  { label: "Gabon", value: "GA", group: "Africa" },
  { label: "Gambia", value: "GM", group: "Africa" },
  { label: "Ghana", value: "GH", group: "Africa" },
  { label: "Guinea", value: "GN", group: "Africa" },
  { label: "Guinea-Bissau", value: "GW", group: "Africa" },
  { label: "Ivory Coast", value: "CI", group: "Africa" },
  { label: "Kenya", value: "KE", group: "Africa" },
  { label: "Lesotho", value: "LS", group: "Africa" },
  { label: "Liberia", value: "LR", group: "Africa" },
  { label: "Libya", value: "LY", group: "Africa" },
  { label: "Madagascar", value: "MG", group: "Africa" },
  { label: "Malawi", value: "MW", group: "Africa" },
  { label: "Mali", value: "ML", group: "Africa" },
  { label: "Mauritania", value: "MR", group: "Africa" },
  { label: "Mauritius", value: "MU", group: "Africa" },
  { label: "Morocco", value: "MA", group: "Africa" },
  { label: "Mozambique", value: "MZ", group: "Africa" },
  { label: "Namibia", value: "NA", group: "Africa" },
  { label: "Niger", value: "NE", group: "Africa" },
  { label: "Nigeria", value: "NG", group: "Africa" },
  { label: "Rwanda", value: "RW", group: "Africa" },
  { label: "Sao Tome and Principe", value: "ST", group: "Africa" },
  { label: "Senegal", value: "SN", group: "Africa" },
  { label: "Seychelles", value: "SC", group: "Africa" },
  { label: "Sierra Leone", value: "SL", group: "Africa" },
  { label: "Somalia", value: "SO", group: "Africa" },
  { label: "South Africa", value: "ZA", group: "Africa" },
  { label: "South Sudan", value: "SS", group: "Africa" },
  { label: "Sudan", value: "SD", group: "Africa" },
  { label: "Tanzania", value: "TZ", group: "Africa" },
  { label: "Togo", value: "TG", group: "Africa" },
  { label: "Tunisia", value: "TN", group: "Africa" },
  { label: "Uganda", value: "UG", group: "Africa" },
  { label: "Zambia", value: "ZM", group: "Africa" },
  { label: "Zimbabwe", value: "ZW", group: "Africa" },
  
  // Asia
  { label: "Afghanistan", value: "AF", group: "Asia" },
  { label: "Armenia", value: "AM", group: "Asia" },
  { label: "Azerbaijan", value: "AZ", group: "Asia" },
  { label: "Bahrain", value: "BH", group: "Asia" },
  { label: "Bangladesh", value: "BD", group: "Asia" },
  { label: "Bhutan", value: "BT", group: "Asia" },
  { label: "Brunei", value: "BN", group: "Asia" },
  { label: "Cambodia", value: "KH", group: "Asia" },
  { label: "China", value: "CN", group: "Asia" },
  { label: "Cyprus", value: "CY", group: "Asia" },
  { label: "Georgia", value: "GE", group: "Asia" },
  { label: "India", value: "IN", group: "Asia" },
  { label: "Indonesia", value: "ID", group: "Asia" },
  { label: "Iran", value: "IR", group: "Asia" },
  { label: "Iraq", value: "IQ", group: "Asia" },
  { label: "Israel", value: "IL", group: "Asia" },
  { label: "Japan", value: "JP", group: "Asia" },
  { label: "Jordan", value: "JO", group: "Asia" },
  { label: "Kazakhstan", value: "KZ", group: "Asia" },
  { label: "Kuwait", value: "KW", group: "Asia" },
  { label: "Kyrgyzstan", value: "KG", group: "Asia" },
  { label: "Laos", value: "LA", group: "Asia" },
  { label: "Lebanon", value: "LB", group: "Asia" },
  { label: "Malaysia", value: "MY", group: "Asia" },
  { label: "Maldives", value: "MV", group: "Asia" },
  { label: "Mongolia", value: "MN", group: "Asia" },
  { label: "Myanmar", value: "MM", group: "Asia" },
  { label: "Nepal", value: "NP", group: "Asia" },
  { label: "North Korea", value: "KP", group: "Asia" },
  { label: "Oman", value: "OM", group: "Asia" },
  { label: "Pakistan", value: "PK", group: "Asia" },
  { label: "Palestine", value: "PS", group: "Asia" },
  { label: "Philippines", value: "PH", group: "Asia" },
  { label: "Qatar", value: "QA", group: "Asia" },
  { label: "Saudi Arabia", value: "SA", group: "Asia" },
  { label: "Singapore", value: "SG", group: "Asia" },
  { label: "South Korea", value: "KR", group: "Asia" },
  { label: "Sri Lanka", value: "LK", group: "Asia" },
  { label: "Syria", value: "SY", group: "Asia" },
  { label: "Taiwan", value: "TW", group: "Asia" },
  { label: "Tajikistan", value: "TJ", group: "Asia" },
  { label: "Thailand", value: "TH", group: "Asia" },
  { label: "Timor-Leste", value: "TL", group: "Asia" },
  { label: "Turkmenistan", value: "TM", group: "Asia" },
  { label: "United Arab Emirates", value: "AE", group: "Asia" },
  { label: "Uzbekistan", value: "UZ", group: "Asia" },
  { label: "Vietnam", value: "VN", group: "Asia" },
  { label: "Yemen", value: "YE", group: "Asia" },
  
  // Europe
  { label: "Albania", value: "AL", group: "Europe" },
  { label: "Andorra", value: "AD", group: "Europe" },
  { label: "Austria", value: "AT", group: "Europe" },
  { label: "Belarus", value: "BY", group: "Europe" },
  { label: "Belgium", value: "BE", group: "Europe" },
  { label: "Bosnia and Herzegovina", value: "BA", group: "Europe" },
  { label: "Bulgaria", value: "BG", group: "Europe" },
  { label: "Croatia", value: "HR", group: "Europe" },
  { label: "Czech Republic", value: "CZ", group: "Europe" },
  { label: "Denmark", value: "DK", group: "Europe" },
  { label: "Estonia", value: "EE", group: "Europe" },
  { label: "Finland", value: "FI", group: "Europe" },
  { label: "France", value: "FR", group: "Europe" },
  { label: "Germany", value: "DE", group: "Europe" },
  { label: "Greece", value: "GR", group: "Europe" },
  { label: "Hungary", value: "HU", group: "Europe" },
  { label: "Iceland", value: "IS", group: "Europe" },
  { label: "Ireland", value: "IE", group: "Europe" },
  { label: "Italy", value: "IT", group: "Europe" },
  { label: "Latvia", value: "LV", group: "Europe" },
  { label: "Liechtenstein", value: "LI", group: "Europe" },
  { label: "Lithuania", value: "LT", group: "Europe" },
  { label: "Luxembourg", value: "LU", group: "Europe" },
  { label: "Malta", value: "MT", group: "Europe" },
  { label: "Moldova", value: "MD", group: "Europe" },
  { label: "Monaco", value: "MC", group: "Europe" },
  { label: "Montenegro", value: "ME", group: "Europe" },
  { label: "Netherlands", value: "NL", group: "Europe" },
  { label: "North Macedonia", value: "MK", group: "Europe" },
  { label: "Norway", value: "NO", group: "Europe" },
  { label: "Poland", value: "PL", group: "Europe" },
  { label: "Portugal", value: "PT", group: "Europe" },
  { label: "Romania", value: "RO", group: "Europe" },
  { label: "Russia", value: "RU", group: "Europe" },
  { label: "San Marino", value: "SM", group: "Europe" },
  { label: "Serbia", value: "RS", group: "Europe" },
  { label: "Slovakia", value: "SK", group: "Europe" },
  { label: "Slovenia", value: "SI", group: "Europe" },
  { label: "Spain", value: "ES", group: "Europe" },
  { label: "Sweden", value: "SE", group: "Europe" },
  { label: "Switzerland", value: "CH", group: "Europe" },
  { label: "Ukraine", value: "UA", group: "Europe" },
  { label: "United Kingdom", value: "GB", group: "Europe" },
  { label: "Vatican City", value: "VA", group: "Europe" },
  
  // North America
  { label: "Antigua and Barbuda", value: "AG", group: "North America" },
  { label: "Bahamas", value: "BS", group: "North America" },
  { label: "Barbados", value: "BB", group: "North America" },
  { label: "Belize", value: "BZ", group: "North America" },
  { label: "Canada", value: "CA", group: "North America" },
  { label: "Costa Rica", value: "CR", group: "North America" },
  { label: "Cuba", value: "CU", group: "North America" },
  { label: "Dominica", value: "DM", group: "North America" },
  { label: "Dominican Republic", value: "DO", group: "North America" },
  { label: "El Salvador", value: "SV", group: "North America" },
  { label: "Grenada", value: "GD", group: "North America" },
  { label: "Guatemala", value: "GT", group: "North America" },
  { label: "Haiti", value: "HT", group: "North America" },
  { label: "Honduras", value: "HN", group: "North America" },
  { label: "Jamaica", value: "JM", group: "North America" },
  { label: "Mexico", value: "MX", group: "North America" },
  { label: "Nicaragua", value: "NI", group: "North America" },
  { label: "Panama", value: "PA", group: "North America" },
  { label: "Saint Kitts and Nevis", value: "KN", group: "North America" },
  { label: "Saint Lucia", value: "LC", group: "North America" },
  { label: "Saint Vincent and the Grenadines", value: "VC", group: "North America" },
  { label: "Trinidad and Tobago", value: "TT", group: "North America" },
  { label: "United States", value: "US", group: "North America" },
  
  // South America
  { label: "Argentina", value: "AR", group: "South America" },
  { label: "Bolivia", value: "BO", group: "South America" },
  { label: "Brazil", value: "BR", group: "South America" },
  { label: "Chile", value: "CL", group: "South America" },
  { label: "Colombia", value: "CO", group: "South America" },
  { label: "Ecuador", value: "EC", group: "South America" },
  { label: "Guyana", value: "GY", group: "South America" },
  { label: "Paraguay", value: "PY", group: "South America" },
  { label: "Peru", value: "PE", group: "South America" },
  { label: "Suriname", value: "SR", group: "South America" },
  { label: "Uruguay", value: "UY", group: "South America" },
  { label: "Venezuela", value: "VE", group: "South America" },
  
  // Oceania
  { label: "Australia", value: "AU", group: "Oceania" },
  { label: "Fiji", value: "FJ", group: "Oceania" },
  { label: "Kiribati", value: "KI", group: "Oceania" },
  { label: "Marshall Islands", value: "MH", group: "Oceania" },
  { label: "Micronesia", value: "FM", group: "Oceania" },
  { label: "Nauru", value: "NR", group: "Oceania" },
  { label: "New Zealand", value: "NZ", group: "Oceania" },
  { label: "Palau", value: "PW", group: "Oceania" },
  { label: "Papua New Guinea", value: "PG", group: "Oceania" },
  { label: "Samoa", value: "WS", group: "Oceania" },
  { label: "Solomon Islands", value: "SB", group: "Oceania" },
  { label: "Tonga", value: "TO", group: "Oceania" },
  { label: "Tuvalu", value: "TV", group: "Oceania" },
  { label: "Vanuatu", value: "VU", group: "Oceania" }
];

export default function CountrySelector({ 
  disabled, 
  selectedCountries: initialSelectedCountries, 
  onChange,
  countryLimit,
  limitReached,
  planType = "none" // Add planType prop with default value
}) {
  const [selectedCountries, setSelectedCountries] = useState(initialSelectedCountries || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [expandedContinents, setExpandedContinents] = useState({});
  const fetcher = useFetcher();

  // Check if user is on free plan
  const isFreePlan = planType === "free";
  const isPremiumPlan = planType === "premium";
  const hasPlan = isFreePlan || isPremiumPlan;

  useEffect(() => {
    // Always load saved countries from metafield when component mounts
    fetcher.load("/api/metafields");
  }, []);

  // Handle initial countries from props
  useEffect(() => {
    if (initialSelectedCountries && initialSelectedCountries.length > 0) {
      setSelectedCountries(initialSelectedCountries);
      setLoading(false);
    }
  }, [initialSelectedCountries]);

  // Handle countries loaded from metafield
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.error) {
        setError(fetcher.data.error);
        setLoading(false);
      } else if (fetcher.data.allowedCountries) {
        // Only use metafield data if we don't have initialSelectedCountries
        if (!initialSelectedCountries || initialSelectedCountries.length === 0) {
          console.log("Using countries from metafield:", fetcher.data.allowedCountries);
          setSelectedCountries(fetcher.data.allowedCountries);
          
          // Notify parent component if needed
          if (onChange) {
            onChange(fetcher.data.allowedCountries);
          }
        }
        setLoading(false);
      }
    }
  }, [fetcher.data, onChange, initialSelectedCountries]);

  // Helper function to check if all countries in a continent are selected
  const isContinentFullySelected = (continentName) => {
    const continentCountries = continents[continentName] || [];
    return continentCountries.length > 0 &&
           continentCountries.every(country => selectedCountries.includes(country));
  };

  // Helper function to check if some (but not all) countries in a continent are selected
  const isContinentPartiallySelected = (continentName) => {
    const continentCountries = continents[continentName] || [];
    const selectedInContinent = continentCountries.filter(country =>
      selectedCountries.includes(country)
    );
    return selectedInContinent.length > 0 && selectedInContinent.length < continentCountries.length;
  };

  // Handle continent checkbox toggle
  const handleContinentToggle = (continentName, checked) => {
    if (disabled || !hasPlan) return;

    let newSelection;

    if (continentName === "Select All") {
      // Handle select all countries
      if (checked) {
        // Get all country codes
        const allCountryCodes = Object.values(continents).flat();

        // Check limit for free plan
        if (countryLimit && allCountryCodes.length > countryLimit) {
          newSelection = allCountryCodes.slice(0, countryLimit);
        } else {
          newSelection = allCountryCodes;
        }
      } else {
        newSelection = [];
      }
    } else {
      const continentCountries = continents[continentName] || [];

      if (checked) {
        // Add all countries from this continent that aren't already selected
        const countriesToAdd = continentCountries.filter(code => !selectedCountries.includes(code));

        // Check limit for free plan
        if (countryLimit && selectedCountries.length + countriesToAdd.length > countryLimit) {
          const remainingSlots = countryLimit - selectedCountries.length;
          const limitedCountriesToAdd = countriesToAdd.slice(0, remainingSlots);
          newSelection = [...selectedCountries, ...limitedCountriesToAdd];
        } else {
          newSelection = [...selectedCountries, ...countriesToAdd];
        }
      } else {
        // Remove all countries from this continent
        newSelection = selectedCountries.filter(code => !continentCountries.includes(code));
      }
    }

    setSelectedCountries(newSelection);

    if (onChange) {
      onChange(newSelection);
    }

    // Save to metafield
    const formData = new FormData();
    formData.append("countries", JSON.stringify(newSelection));
    fetcher.submit(formData, { method: "POST", action: "/api/metafields" });
  };

  // Handle individual country checkbox toggle
  const handleCountryToggle = (countryCode, checked) => {
    if (disabled || !hasPlan) return;

    let newSelection;

    if (checked) {
      // Check if adding would exceed limit
      if (countryLimit && selectedCountries.length >= countryLimit) {
        return; // Don't add if at limit
      }
      newSelection = [...selectedCountries, countryCode];
    } else {
      newSelection = selectedCountries.filter(code => code !== countryCode);
    }

    setSelectedCountries(newSelection);

    if (onChange) {
      onChange(newSelection);
    }

    // Save to metafield
    const formData = new FormData();
    formData.append("countries", JSON.stringify(newSelection));
    fetcher.submit(formData, { method: "POST", action: "/api/metafields" });
  };

  // Toggle continent expansion
  const toggleContinentExpansion = (continentName) => {
    setExpandedContinents(prev => ({
      ...prev,
      [continentName]: !prev[continentName]
    }));
  };

  const handleCountryChange = (value) => {
    if (disabled || !hasPlan) return;
    
    setSelectedValue(value);
    
    // Handle special selections
    let countriesToAdd = [];
    
    // Handle "Select All Countries" option
    if (value === "ALL_COUNTRIES") {
      // Get all country codes (excluding special options)
      countriesToAdd = countries
        .filter(country => !country.value.startsWith("ALL_") && country.value && !country.disabled)
        .map(country => country.value);
      console.log("Adding all countries:", countriesToAdd.length);
    }
    // Handle continent selections
    else if (value.startsWith("ALL_")) {
      // Convert ALL_NORTH_AMERICA to "North America"
      let continentName = value.replace("ALL_", "");
      
      // Handle special cases for continent names
      if (continentName === "AFRICA") continentName = "Africa";
      else if (continentName === "ASIA") continentName = "Asia";
      else if (continentName === "EUROPE") continentName = "Europe";
      else if (continentName === "NORTH_AMERICA") continentName = "North America";
      else if (continentName === "SOUTH_AMERICA") continentName = "South America";
      else if (continentName === "OCEANIA") continentName = "Oceania";
      
      // Get all countries for the selected continent
      if (continents[continentName]) {
        countriesToAdd = continents[continentName];
        console.log(`Adding all countries from ${continentName}:`, countriesToAdd);
      } else {
        console.log(`Continent not found: ${continentName}`);
      }
    }
    // Handle individual country selection
    else if (value && !selectedCountries.includes(value)) {
      countriesToAdd = [value];
    }
    
    // If no countries to add, just reset the selection
    if (countriesToAdd.length === 0) {
      setSelectedValue("");
      return;
    }
    
    // Filter out countries that are already selected
    countriesToAdd = countriesToAdd.filter(code => !selectedCountries.includes(code));
    
    // Check if adding these countries would exceed the limit
    if (countryLimit) {
      // If already at or over limit, show message and return
      if (selectedCountries.length >= countryLimit) {
        setSelectedValue("");
        return;
      }
      
      // If adding all would exceed limit, only add up to the limit
      if (selectedCountries.length + countriesToAdd.length > countryLimit) {
        const remainingSlots = countryLimit - selectedCountries.length;
        countriesToAdd = countriesToAdd.slice(0, remainingSlots);
      }
    }
    
    // Add the new countries to the selection
    const newSelection = [...selectedCountries, ...countriesToAdd];
    console.log(`Adding ${countriesToAdd.length} countries to selection. New total: ${newSelection.length}`);
    setSelectedCountries(newSelection);
    
    // Call onChange if provided
    if (onChange) {
      onChange(newSelection);
    }
    
    // Save to metafield
    const formData = new FormData();
    formData.append("countries", JSON.stringify(newSelection));
    fetcher.submit(formData, { method: "POST", action: "/api/metafields" });
    
    setSelectedValue("");
  };

  const removeCountry = (valueToRemove) => {
    if (disabled || !hasPlan) return;
    
    const newSelection = selectedCountries.filter(value => value !== valueToRemove);
    setSelectedCountries(newSelection);
    
    // Call onChange if provided
    if (onChange) {
      onChange(newSelection);
    }
    
    // Save to metafield
    const formData = new FormData();
    formData.append("countries", JSON.stringify(newSelection));
    fetcher.submit(formData, { method: "POST", action: "/api/metafields" });
  };

  const handleClearAll = () => {
    if (disabled || !hasPlan) return;
    
    setSelectedCountries([]);
    
    // Call onChange if provided
    if (onChange) {
      onChange([]);
    }
    
    const formData = new FormData();
    formData.append("countries", JSON.stringify([]));
    fetcher.submit(formData, { method: "POST", action: "/api/metafields" });
  };

  if (error) {
    return (
      <Banner status="critical">
        <p>Error: {error}</p>
      </Banner>
    );
  }
  
  // Group selected countries by continent
  const countriesByContinent = {};
  Object.keys(continents).forEach(continent => {
    countriesByContinent[continent] = selectedCountries
      .filter(code => continents[continent].includes(code))
      .map(code => {
        const country = countries.find(c => c.value === code);
        return {
          code,
          label: country ? country.label : code
        };
      });
  });
  
  // Determine if we need to show the "See More" button
  const totalCountries = selectedCountries.length;
  const shouldShowMore = totalCountries > 15;

  // Show plan information banner
  const renderPlanBanner = () => {
    if (!hasPlan) {
      return (
        <Banner status="warning">
          <Text as="p" variant="bodyMd">
            You need to select a subscription plan to use country blocking.
          </Text>
        </Banner>
      );
    } else if (isFreePlan) {
      return (
        <Banner status="info">
          <Text as="p" variant="bodyMd">
            You are on the <strong>Free Plan</strong>. You can block up to 5 countries.
          </Text>
        </Banner>
      );
    } 
    // else if (isPremiumPlan) {
    //   return (
    //     <Banner status="success">
    //       <Text as="p" variant="bodyMd">
    //         You are on the <strong>Premium Plan</strong> with unlimited country blocking.
    //       </Text>
    //     </Banner>
    //   );
    // }
    return null;
  };
  
  return (
    <BlockStack gap="400">
      {loading ? (
        <Spinner accessibilityLabel="Loading countries" size="large" />
      ) : (
        <>
          {renderPlanBanner()}
          
          <div style={{ opacity: hasPlan ? 1 : 0.5 }}>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">Select Countries to Block</Text>

              {/* Quick Select Options */}
              <Card padding="400">
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h4">Quick Select</Text>
                  <InlineStack gap="400">
                    <Button
                      onClick={() => handleContinentToggle("Select All", true)}
                      disabled={disabled || limitReached || !hasPlan}
                      size="slim"
                      variant="primary"
                    >
                      Select All Countries
                    </Button>
                    <Button
                      onClick={handleClearAll}
                      disabled={disabled || selectedCountries.length === 0 || !hasPlan}
                      size="slim"
                      variant="secondary"
                    >
                      Clear All
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>

              {/* Continent Checkboxes */}
              <div style={{
                maxHeight: '250px', // Show exactly 3 continents at a time
                overflowY: 'auto',
                overflowX: 'hidden',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#ffffff',
                scrollbarWidth: 'thin', // Firefox
                scrollbarColor: '#c1c1c1 #f1f1f1' // Firefox
              }}
              className="custom-scrollbar" // For webkit browsers
              >
                <BlockStack gap="300">
                  {Object.keys(continents).map(continentName => {
                    const isFullySelected = isContinentFullySelected(continentName);
                    const isPartiallySelected = isContinentPartiallySelected(continentName);
                    const continentCountries = continents[continentName];
                    const selectedCount = continentCountries.filter(code => selectedCountries.includes(code)).length;
                    const isExpanded = expandedContinents[continentName];

                    return (
                      <Card key={continentName} padding="400">
                        <BlockStack gap="300">
                          <InlineStack gap="300" align="space-between">
                            <Checkbox
                              label={
                                <span style={{
                                  fontWeight: 'bold',
                                  color: '#202223',
                                  fontSize: '16px'
                                }}>
                                  {continentName} ({selectedCount}/{continentCountries.length})
                                </span>
                              }
                              checked={isFullySelected}
                              indeterminate={isPartiallySelected}
                              onChange={(checked) => handleContinentToggle(continentName, checked)}
                              disabled={disabled || !hasPlan}
                            />
                            <Button
                              onClick={() => toggleContinentExpansion(continentName)}
                              plain
                              size="slim"
                              accessibilityLabel={isExpanded ? `Collapse ${continentName}` : `Expand ${continentName}`}
                            >
                              {isExpanded ? "Collapse" : "Expand"}
                            </Button>
                          </InlineStack>

                          <Collapsible open={isExpanded}>
                            <BlockStack gap="200">
                              {continentCountries.map(countryCode => {
                                const country = countries.find(c => c.value === countryCode);
                                if (!country) return null;

                                return (
                                  <Checkbox
                                    key={countryCode}
                                    label={country.label}
                                    checked={selectedCountries.includes(countryCode)}
                                    onChange={(checked) => handleCountryToggle(countryCode, checked)}
                                    disabled={disabled || !hasPlan || (limitReached && !selectedCountries.includes(countryCode))}
                                  />
                                );
                              })}
                            </BlockStack>
                          </Collapsible>
                        </BlockStack>
                      </Card>
                    );
                  })}
                </BlockStack>
              </div>

              {/* Selection Summary */}
              <InlineStack gap="300" align="center">
                {countryLimit && (
                  <Text variant="bodySm" as="p" color="subdued">
                    {selectedCountries.length}/{countryLimit} countries selected
                  </Text>
                )}
                {!countryLimit && (
                  <Text variant="bodySm" as="p" color="subdued">
                    {selectedCountries.length} countries selected
                  </Text>
                )}
              </InlineStack>
            </BlockStack>
          </div>

          {selectedCountries.length > 0 && (
            <Card padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Blocked Countries</Text>
                
                {/* Display countries by continent */}
                {Object.keys(countriesByContinent).map(continent => {
                  const continentCountries = countriesByContinent[continent];
                  if (continentCountries.length === 0) return null;
                  
                  // If we're not showing all countries, limit each continent to 5 countries
                  const displayedCountries = showAllCountries 
                    ? continentCountries 
                    : continentCountries.slice(0, 5);
                  
                  return (
                    <BlockStack key={continent} gap="300">
                      <Box paddingBlockStart="200">
                        <Text variant="headingSm" as="h3" fontWeight="semibold">
                          {continent} ({continentCountries.length})
                        </Text>
                      </Box>
                      <InlineStack gap="200" wrap>
                        {displayedCountries.map(country => (
                          <Tag 
                            key={country.code} 
                            onRemove={disabled || !hasPlan ? undefined : () => removeCountry(country.code)}
                            disabled={disabled || !hasPlan}
                          >
                            {country.label}
                          </Tag>
                        ))}
                        {!showAllCountries && continentCountries.length > 5 && (
                          <Text variant="bodySm" as="span" color="subdued">
                            +{continentCountries.length - 5} more
                          </Text>
                        )}
                      </InlineStack>
                      {continent !== "Oceania" && <Divider />}
                    </BlockStack>
                  );
                })}
                
                {/* Show "See All" button if needed */}
                {shouldShowMore && (
                  <Button 
                    onClick={() => setShowAllCountries(!showAllCountries)} 
                    plain
                    size="slim"
                  >
                    {showAllCountries ? "Show Less" : "Show All Countries"}
                  </Button>
                )}
              </BlockStack>
            </Card>
          )}
        </>
      )}
    </BlockStack>
  );
}