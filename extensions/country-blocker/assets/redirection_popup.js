const countryCodeToName = {
  'AF': 'Afghanistan', 'AX': 'Åland Islands', 'AL': 'Albania', 'DZ': 'Algeria', 'AS': 'American Samoa',
  'AD': 'Andorra', 'AO': 'Angola', 'AI': 'Anguilla', 'AQ': 'Antarctica', 'AG': 'Antigua and Barbuda',
  'AR': 'Argentina', 'AM': 'Armenia', 'AW': 'Aruba', 'AU': 'Australia', 'AT': 'Austria',
  'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados',
  'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin', 'BM': 'Bermuda',
  'BT': 'Bhutan', 'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BV': 'Bouvet Island',
  'BR': 'Brazil', 'IO': 'British Indian Ocean Territory', 'BN': 'Brunei', 'BG': 'Bulgaria', 'BF': 'Burkina Faso',
  'BI': 'Burundi', 'KH': 'Cambodia', 'CM': 'Cameroon', 'CA': 'Canada', 'CV': 'Cape Verde',
  'KY': 'Cayman Islands', 'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile', 'CN': 'China',
  'CX': 'Christmas Island', 'CC': 'Cocos (Keeling) Islands', 'CO': 'Colombia', 'KM': 'Comoros', 'CG': 'Congo',
  'CD': 'Democratic Republic of the Congo', 'CK': 'Cook Islands', 'CR': 'Costa Rica', 'HR': 'Croatia', 'CU': 'Cuba',
  'CY': 'Cyprus', 'CZ': 'Czech Republic', 'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica',
  'DO': 'Dominican Republic', 'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea',
  'ER': 'Eritrea', 'EE': 'Estonia', 'ET': 'Ethiopia', 'FK': 'Falkland Islands', 'FO': 'Faroe Islands',
  'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France', 'GF': 'French Guiana', 'PF': 'French Polynesia',
  'TF': 'French Southern Territories', 'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany',
  'GH': 'Ghana', 'GI': 'Gibraltar', 'GR': 'Greece', 'GL': 'Greenland', 'GD': 'Grenada',
  'GP': 'Guadeloupe', 'GU': 'Guam', 'GT': 'Guatemala', 'GG': 'Guernsey', 'GN': 'Guinea',
  'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HT': 'Haiti', 'HM': 'Heard Island and McDonald Islands', 'VA': 'Holy See',
  'HN': 'Honduras', 'HK': 'Hong Kong', 'HU': 'Hungary', 'IS': 'Iceland', 'IN': 'India',
  'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq', 'IE': 'Ireland', 'IM': 'Isle of Man',
  'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan', 'JE': 'Jersey',
  'JO': 'Jordan', 'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea',
  'KR': 'South Korea', 'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia',
  'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia', 'LY': 'Libya', 'LI': 'Liechtenstein',
  'LT': 'Lithuania', 'LU': 'Luxembourg', 'MO': 'Macao', 'MK': 'Macedonia', 'MG': 'Madagascar',
  'MW': 'Malawi', 'MY': 'Malaysia', 'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta',
  'MH': 'Marshall Islands', 'MQ': 'Martinique', 'MR': 'Mauritania', 'MU': 'Mauritius', 'YT': 'Mayotte',
  'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova', 'MC': 'Monaco', 'MN': 'Mongolia',
  'ME': 'Montenegro', 'MA': 'Morocco', 'MZ': 'Mozambique', 'MM': 'Myanmar', 'NA': 'Namibia',
  'NR': 'Nauru', 'NP': 'Nepal', 'NL': 'Netherlands', 'AN': 'Netherlands Antilles', 'NC': 'New Caledonia',
  'NZ': 'New Zealand', 'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'NU': 'Niue',
  'NF': 'Norfolk Island', 'MP': 'Northern Mariana Islands', 'NO': 'Norway', 'OM': 'Oman', 'PK': 'Pakistan',
  'PW': 'Palau', 'PS': 'Palestine', 'PA': 'Panama', 'PG': 'Papua New Guinea', 'PY': 'Paraguay',
  'PE': 'Peru', 'PH': 'Philippines', 'PN': 'Pitcairn Islands', 'PL': 'Poland', 'PT': 'Portugal',
  'PR': 'Puerto Rico', 'QA': 'Qatar', 'RE': 'Reunion', 'RO': 'Romania', 'RU': 'Russia',
  'RW': 'Rwanda', 'SH': 'Saint Helena', 'KN': 'Saint Kitts and Nevis', 'LC': 'Saint Lucia', 'PM': 'Saint Pierre and Miquelon',
  'VC': 'Saint Vincent and the Grenadines', 'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia',
  'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone', 'SG': 'Singapore',
  'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands', 'SO': 'Somalia', 'ZA': 'South Africa',
  'GS': 'South Georgia and the South Sandwich Islands', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname',
  'SJ': 'Svalbard and Jan Mayen', 'SZ': 'Swaziland', 'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria',
  'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania', 'TH': 'Thailand', 'TL': 'Timor-Leste',
  'TG': 'Togo', 'TK': 'Tokelau', 'TO': 'Tonga', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia',
  'TR': 'Turkey', 'TM': 'Turkmenistan', 'TC': 'Turks and Caicos Islands', 'TV': 'Tuvalu', 'UG': 'Uganda',
  'UA': 'Ukraine', 'AE': 'United Arab Emirates', 'GB': 'United Kingdom', 'US': 'United States', 'UM': 'United States Minor Outlying Islands',
  'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu', 'VE': 'Venezuela', 'VN': 'Vietnam',
  'VG': 'Virgin Islands (British)', 'VI': 'Virgin Islands (U.S.)', 'WF': 'Wallis and Futuna', 'EH': 'Western Sahara', 'YE': 'Yemen',
  'ZM': 'Zambia', 'ZW': 'Zimbabwe'
};

function initRedirectionPopup() {
  const popup = document.getElementById('redirection-popup');
  const closeButton = document.querySelector('.redirection-popup-close');
  const confirmButton = document.getElementById('confirm-country-btn');
  const countrySearch = document.getElementById('country-search');
  const countryList = document.getElementById('country-list');
  
  if (!popup) return;

  let redirectionRules = window.redirectionRules || {};
  let marketCountries = window.marketCountries || {};
  let selectedCountryCode = null;

  function populateCountries() {
    const countryCodes = new Set();
    
    Object.keys(redirectionRules).forEach(code => countryCodes.add(code.trim()));
    Object.keys(marketCountries).forEach(code => countryCodes.add(code.trim()));

    if (countryCodes.size === 0) {
      countryList.innerHTML = '<li class="country-list-item--no-results">No countries configured</li>';
      return;
    }

    const countries = Array.from(countryCodes).map(code => {
      const marketData = marketCountries[code];
      return {
        code: code,
        name: marketData ? marketData.country_name : (countryCodeToName[code] || code),
        hasMetafield: !!redirectionRules[code],
        hasMarket: !!marketCountries[code]
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    countryList.innerHTML = '';
    
    countries.forEach(country => {
      const li = document.createElement('li');
      li.className = 'country-list-item';
      li.textContent = country.name;
      li.setAttribute('data-code', country.code);
      li.setAttribute('data-has-metafield', country.hasMetafield);
      li.setAttribute('data-has-market', country.hasMarket);
      li.addEventListener('click', function(e) {
        e.stopPropagation();
        selectCountry(country.code, country.name);
      });
      countryList.appendChild(li);
    });
  }

  function selectCountry(code, name) {
    selectedCountryCode = code;
    
    if (redirectionRules[code]) {
      window.location.href = redirectionRules[code];
    } else if (marketCountries[code]) {
      window.location.href = marketCountries[code].market_url;
    }
  }

  function filterCountries(searchTerm) {
    const items = document.querySelectorAll('.country-list-item');
    const term = searchTerm.toLowerCase();
    let visibleCount = 0;

    items.forEach(item => {
      const code = item.getAttribute('data-code');
      const name = item.textContent;
      const matches = name.toLowerCase().includes(term) || code.toLowerCase().includes(term);
      item.style.display = (matches && searchTerm.length > 0) || searchTerm.length === 0 ? 'block' : 'none';
      if (item.style.display === 'block' && searchTerm.length > 0) visibleCount++;
    });

    if (visibleCount === 0 && searchTerm.length > 0) {
      countryList.innerHTML = '<li class="country-list-item--no-results">No countries found</li>';
    }
  }

  countrySearch.addEventListener('focus', () => {
    populateCountries();
    countryList.classList.add('active');
  });

  countrySearch.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!countryList.classList.contains('active')) {
      populateCountries();
      countryList.classList.add('active');
    }
  });

  countrySearch.addEventListener('input', (e) => {
    if (countryList.classList.contains('active')) {
      filterCountries(e.target.value);
    }
  });

  countrySearch.addEventListener('blur', () => {
    setTimeout(() => countryList.classList.remove('active'), 200);
  });

  confirmButton.style.display = 'none';

  closeButton.addEventListener('click', () => {
    popup.style.display = 'none';
    document.body.style.overflow = '';
  });

  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRedirectionPopup);
} else {
  initRedirectionPopup();
}
