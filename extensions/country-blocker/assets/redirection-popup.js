(() => {
  const STORAGE_KEY = 'redirection-popup-dismissed';
  const COUNTRY_STORAGE_KEY = 'selected-market-country';
  const COOKIE_NAME = 'redirection-popup-visited';
  const COOKIE_DAYS = 30;

  class RedirectionPopup {
    constructor() {
      this.popup = document.getElementById('redirection-popup-overlay');
      this.modal = document.getElementById('redirection-popup-modal');
      this.closeBtn = document.getElementById('popup-close-btn');
      this.redirectBtn = document.getElementById('redirect-btn');
      this.continueBtn = document.getElementById('continue-btn');
      this.countryButton = document.getElementById('country-button');
      this.countryList = document.getElementById('CountryList');
      this.localizationForm = document.querySelector('localization-form');
      this.selectedCountrySpan = document.getElementById('selected-country');
      this.settings = this.getBlockSettings();
      this.selectedCountryData = { code: '', type: '', redirectUrl: '' };
      this.enableAutoRedirect = this.popup?.getAttribute('data-enable-auto-redirect') === 'true';
      this.autoRedirectDelay = parseInt(this.popup?.getAttribute('data-auto-redirect-delay') || 500, 10);
      
      this.init();
    }

    init() {
      if (!this.popup) return;

      this.applyThemeSettings();
      this.addMetafieldCountriesToList();
      this.attachEventListeners();
      this.checkAutoShowPopup();
      this.handleAutoDetectCountry();
    }

    attachEventListeners() {
      const popupType = this.popup?.getAttribute('data-show-on-load');
      const contentDiv = document.querySelector('.redirection-popup-content');
      const type = contentDiv?.getAttribute('data-popup-type');

      this.closeBtn?.addEventListener('click', () => this.closePopup());
      this.redirectBtn?.addEventListener('click', () => this.handleRedirect());
      this.continueBtn?.addEventListener('click', () => this.closePopup());
      
      if (type === 'location_confirmation') {
        const confirmBtn = document.getElementById('confirm-location-btn');
        const changeBtn = document.getElementById('change-location-btn');
        const backBtn = document.getElementById('back-to-confirmation-btn');
        const locationCountryBtn = document.getElementById('location-country-button');
        const locationSearch = document.getElementById('location-country-search');
        confirmBtn?.addEventListener('click', () => this.handleLocationConfirm());
        changeBtn?.addEventListener('click', () => this.toggleLocationSelector());
        backBtn?.addEventListener('click', () => this.toggleLocationSelector());
        locationCountryBtn?.addEventListener('click', () => this.toggleLocationCountryList());
        locationSearch?.addEventListener('input', (e) => this.handleCountrySearch(e, 'LocationCountryList'));
        document.addEventListener('click', (e) => this.handleLocationCountrySelection(e));
      } else if (type === 'simple_selector') {
        const shopNowBtn = document.getElementById('shop-now-btn');
        const simpleSearch = document.getElementById('country-search');
        this.countryButton?.addEventListener('click', () => this.toggleCountryList());
        simpleSearch?.addEventListener('input', (e) => this.handleCountrySearch(e, 'CountryList'));
        document.addEventListener('click', (e) => this.handleCountrySelection(e));
        shopNowBtn?.addEventListener('click', () => this.handleShopNow());
      } else if (type === 'dropdown') {
        const dropdownSearch = document.getElementById('country-search-dropdown');
        this.countryButton?.addEventListener('click', () => this.toggleCountryList());
        dropdownSearch?.addEventListener('input', (e) => this.handleCountrySearch(e, 'CountryList'));
        document.addEventListener('click', (e) => this.handleCountrySelection(e));
      } else if (type === 'button_grid' || type === 'cards' || type === 'horizontal') {
        const gridSearch = document.getElementById('country-search-grid');
        gridSearch?.addEventListener('input', (e) => this.handleGridCountrySearch(e));
        document.addEventListener('click', (e) => this.handleButtonCountrySelection(e));
      } else if (type === 'radio') {
        document.addEventListener('change', (e) => this.handleRadioSelection(e));
      } else if (type === 'tabs') {
        document.addEventListener('click', (e) => this.handleTabSelection(e));
      }

      document.addEventListener('keydown', (e) => this.handleKeyboard(e));
      
      const form = this.localizationForm?.querySelector('form');
      if (form) {
        form.addEventListener('submit', () => this.handleFormSubmit());
      }
    }

    getBlockSettings() {
      try {
        const settingsElement = document.getElementById('redirection-popup-settings');
        if (settingsElement?.textContent) {
          return JSON.parse(settingsElement.textContent);
        }
      } catch (error) {
        console.error('Error parsing block settings:', error);
      }
      return {};
    }

    getCountryNameForSorting(countryCode, countryNameMap) {
      return (countryNameMap.get(countryCode) || (typeof countrydataJson !== 'undefined' && countrydataJson[countryCode]?.country) || countryCode).toLowerCase();
    }

    insertCountryAtSortedPosition(newElement, targetList, countryCode, countryNameMap, isGridButton = false) {
      const newCountryName = this.getCountryNameForSorting(countryCode, countryNameMap);
      const selector = isGridButton ? 'button[data-country]' : 'a[data-country], button[data-country]';
      const existingItems = targetList.querySelectorAll(selector);
      
      let inserted = false;
      for (let item of existingItems) {
        const itemCountryCode = item.getAttribute('data-country');
        const itemCountryName = this.getCountryNameForSorting(itemCountryCode, countryNameMap);
        
        if (newCountryName.localeCompare(itemCountryName) < 0) {
          if (isGridButton) {
            targetList.insertBefore(newElement, item);
          } else {
            item.closest('li, button').parentNode.insertBefore(newElement, item.closest('li, button'));
          }
          inserted = true;
          break;
        }
      }
      
      if (!inserted) {
        targetList.appendChild(newElement);
      }
    }

    addMetafieldCountriesToList() {
      try {
        const metafieldElement = document.getElementById('metafield-redirect-rules');
        if (!metafieldElement?.textContent) return;

        const redirectRules = JSON.parse(metafieldElement.textContent);
        const contentDiv = document.querySelector('.redirection-popup-content');
        const popupType = contentDiv?.getAttribute('data-popup-type');
        
        const allCountryElements = document.querySelectorAll('[data-country]');
        const existingCountries = new Map();
        const countryNameMap = new Map();
        
        allCountryElements.forEach(el => {
          existingCountries.set(el.getAttribute('data-country'), el);
          const countryCode = el.getAttribute('data-country');
          const countryName = el.querySelector('.country-option-name')?.textContent || el.querySelector('.country-name')?.textContent || countryCode;
          countryNameMap.set(countryCode, countryName);
        });

        const sortedMetafieldEntries = Object.entries(redirectRules).sort((a, b) => {
          const nameA = this.getCountryNameForSorting(a[0], countryNameMap);
          const nameB = this.getCountryNameForSorting(b[0], countryNameMap);
          return nameA.localeCompare(nameB);
        });

        sortedMetafieldEntries.forEach(([countryCode, redirectUrl]) => {
          if (existingCountries.has(countryCode)) {
            const existingElement = existingCountries.get(countryCode);
            existingElement.setAttribute('data-type', 'custom');
            existingElement.setAttribute('data-redirect-url', redirectUrl);
          } else if (popupType === 'dropdown' || popupType === 'location_confirmation' || popupType === 'simple_selector') {
            const targetListId = popupType === 'location_confirmation' ? 'LocationCountryList' : 'CountryList';
            const targetList = document.getElementById(targetListId);
            if (!targetList) return;
            
            const li = document.createElement('li');
            li.className = 'disclosure__item';
            li.setAttribute('tabindex', '-1');

            const a = document.createElement('a');
            a.href = '#';
            a.className = popupType === 'location_confirmation' ? 'location-country-option' : 'country-option';
            a.setAttribute('data-value', countryCode);
            a.setAttribute('data-country', countryCode);
            a.setAttribute('data-type', 'custom');
            a.setAttribute('data-redirect-url', redirectUrl);

            const img = document.createElement('img');
            img.src = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/${countryCode.toLowerCase()}.png`;
            img.alt = '';
            img.className = 'country-flag-small';
            img.loading = 'lazy';
            img.onerror = function() { this.src = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`; };

            const span = document.createElement('span');
            span.className = 'country-info';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'country-option-name';
            const countryName = countryNameMap.get(countryCode) || (typeof countrydataJson !== 'undefined' && countrydataJson[countryCode]?.country) || countryCode;
            nameSpan.textContent = countryName;
            span.appendChild(nameSpan);
            a.appendChild(img);
            a.appendChild(span);
            li.appendChild(a);
            this.insertCountryAtSortedPosition(li, targetList, countryCode, countryNameMap, false);
          } else if (popupType === 'button_grid') {
            const targetList = document.getElementById('CountryList');
            if (!targetList) return;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'country-grid-btn';
            button.setAttribute('data-value', countryCode);
            button.setAttribute('data-country', countryCode);
            button.setAttribute('data-type', 'custom');
            button.setAttribute('data-redirect-url', redirectUrl);

            const img = document.createElement('img');
            img.src = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/${countryCode.toLowerCase()}.png`;
            img.alt = '';
            img.className = 'country-flag-small';
            img.loading = 'lazy';
            img.onerror = function() { this.src = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`; };

            const span = document.createElement('span');
            const countryName = countryNameMap.get(countryCode) || (typeof countrydataJson !== 'undefined' && countrydataJson[countryCode]?.country) || countryCode;
            span.textContent = countryName;

            button.appendChild(img);
            button.appendChild(span);
            this.insertCountryAtSortedPosition(button, targetList, countryCode, countryNameMap, true);
          }
        });
      } catch (error) {
        console.error('Error loading metafield countries:', error);
      }
    }

    setCookie(name, value, days = 30) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      const expiresStr = `expires=${expires.toUTCString()}`;
      document.cookie = `${name}=${encodeURIComponent(value)}; ${expiresStr}; path=/`;
    }

    getCookie(name) {
      const nameEQ = `${name}=`;
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    }

    applyThemeSettings() {
      if (!this.settings) return;
      
      const root = document.documentElement;
      const settings = this.settings;
      
      if (settings.popup_bg_color) {
        this.modal.style.backgroundColor = settings.popup_bg_color;
      }
      
      if (settings.overlay_opacity !== undefined) {
        root.style.setProperty('--redirection-overlay-opacity', settings.overlay_opacity / 100);
      }
      
      if (settings.button_bg_color) {
        if (this.redirectBtn) {
          this.redirectBtn.style.backgroundColor = settings.button_bg_color;
          this.redirectBtn.style.color = settings.button_text_color || '#ffffff';
        }
        
        if (this.continueBtn) {
          this.continueBtn.style.color = settings.button_bg_color;
          this.continueBtn.style.borderColor = settings.button_bg_color;
        }
        
        const confirmBtn = document.getElementById('confirm-location-btn');
        const shopNowBtn = document.getElementById('shop-now-btn');
        if (confirmBtn) {
          confirmBtn.style.backgroundColor = settings.button_bg_color;
          confirmBtn.style.color = settings.button_text_color || '#ffffff';
        }
        if (shopNowBtn) {
          shopNowBtn.style.backgroundColor = settings.button_bg_color;
          shopNowBtn.style.color = settings.button_text_color || '#ffffff';
        }
      }
    }

    checkAutoShowPopup() {
      const isDismissed = sessionStorage.getItem(STORAGE_KEY);
      const hasCookie = this.getCookie(COOKIE_NAME);
      const showOnLoad = this.popup?.getAttribute('data-show-on-load') === 'true';
      
      if (!isDismissed && !hasCookie && showOnLoad) {
        if (this.enableAutoRedirect) {
          this.handleAutoRedirect();
        } else {
          setTimeout(() => this.showPopup(), 500);
        }
      }
    }

    handleAutoDetectCountry() {
      const enableGeo = this.popup?.getAttribute('data-enable-geolocation') === 'true';
      
      if (enableGeo && !this.enableAutoRedirect) {
        this.detectUserCountry();
      }
    }

    handleAutoRedirect() {
      fetch('https://api.country.is/')
        .then(response => response.json())
        .then(data => {
          const userCountry = data.country;
          this.performAutoRedirect(userCountry);
        })
        .catch(error => {
          console.error('Error detecting country for auto-redirect:', error);
          this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
        });
    }

    performAutoRedirect(countryCode) {
      if (!countryCode) {
        console.warn('Country code not detected');
        this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
        return;
      }

      setTimeout(() => {
        const redirectRules = this.getRedirectRules();
        const form = this.localizationForm?.querySelector('form');
        const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');

        if (redirectRules[countryCode]) {
          window.location.href = redirectRules[countryCode];
        } else if (form && countryCodeInput) {
          countryCodeInput.value = countryCode;
          this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
          form.submit();
        } else {
          console.warn('Unable to perform auto-redirect');
          this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
        }
      }, this.autoRedirectDelay);
    }

    getRedirectRules() {
      try {
        const metafieldElement = document.getElementById('metafield-redirect-rules');
        if (metafieldElement?.textContent) {
          return JSON.parse(metafieldElement.textContent);
        }
      } catch (error) {
        console.error('Error parsing redirect rules:', error);
      }
      return {};
    }

    detectUserCountry() {
      fetch('https://api.country.is/')
        .then(response => response.json())
        .then(data => {
          const userCountry = data.country;
          this.setAutoDetectedCountry(userCountry);
        })
        .catch(error => console.error('Error detecting country:', error));
    }

    setAutoDetectedCountry(countryCode) {
      const contentDiv = document.querySelector('.redirection-popup-content');
      const popupType = contentDiv?.getAttribute('data-popup-type');
      
      if (popupType === 'location_confirmation') {
        this.autoSelectLocationCountry(countryCode);
      } else if (popupType === 'simple_selector') {
        this.autoSelectSimpleCountry(countryCode);
      } else {
        this.autoSelectDefaultCountry(countryCode);
      }
    }

    autoSelectLocationCountry(countryCode) {
      const locationCountryList = document.getElementById('LocationCountryList');
      if (!locationCountryList) return;
      
      const countryItem = Array.from(locationCountryList.querySelectorAll('a')).find(
        el => el.getAttribute('data-country') === countryCode
      );
      
      if (countryItem) {
        const countryName = countryItem.querySelector('.country-option-name')?.textContent || countryCode;
        const currencyInfo = countryItem.querySelector('.country-currency')?.textContent || '';
        
        const locationCountryName = document.getElementById('location-country-name');
        if (locationCountryName) {
          locationCountryName.textContent = countryName;
        }
        
        const flagImg = document.getElementById('location-selected-country-flag');
        if (flagImg) {
          flagImg.src = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/${countryCode.toLowerCase()}.png`;
          flagImg.onerror = function() { this.src = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`; };
        }
        
        const selectedCountrySpan = document.getElementById('location-selected-country');
        if (selectedCountrySpan) {
          selectedCountrySpan.innerHTML = `${countryName} ${currencyInfo}`;
        }
        
        const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
        if (countryCodeInput) {
          countryCodeInput.value = countryCode;
        }
        
        if (countryCode) {
          sessionStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
        }
      }
    }

    autoSelectSimpleCountry(countryCode) {
      const countryList = document.getElementById('CountryList');
      if (!countryList) return;
      
      const countryItem = Array.from(countryList.querySelectorAll('a')).find(
        el => el.getAttribute('data-country') === countryCode
      );
      
      if (countryItem) {
        const countryName = countryItem.querySelector('.country-option-name')?.textContent || countryCode;
        const currencyInfo = countryItem.querySelector('.country-currency')?.textContent || '';
        const countryType = countryItem.getAttribute('data-type');
        const redirectUrl = countryItem.getAttribute('data-redirect-url');
        
        this.selectedCountryData = { code: countryCode, type: countryType, redirectUrl: redirectUrl };
        
        const flagImg = document.getElementById('selected-country-flag');
        if (flagImg) {
          flagImg.src = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/${countryCode.toLowerCase()}.png`;
          flagImg.onerror = function() { this.src = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`; };
        }
        
        const selectedCountrySpan = document.getElementById('selected-country');
        if (selectedCountrySpan) {
          selectedCountrySpan.innerHTML = `${countryName} ${currencyInfo}`;
        }
        
        const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
        if (countryCodeInput) {
          countryCodeInput.value = countryCode;
        }
        
        if (countryCode) {
          sessionStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
        }
      }
    }

    autoSelectDefaultCountry(countryCode) {
      if (!this.countryList) return;
      
      const countryItem = Array.from(this.countryList.querySelectorAll('a')).find(
        el => el.getAttribute('data-country')?.includes(countryCode)
      );
      
      if (countryItem) {
        const countryName = countryItem.textContent;
        const countryType = countryItem.getAttribute('data-type');
        const redirectUrl = countryItem.getAttribute('data-redirect-url');
        
        this.selectedCountrySpan.textContent = countryName;
        
        const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
        if (countryCodeInput) {
          countryCodeInput.value = countryCode;
        }
        
        if (this.redirectBtn) {
          if (countryType === 'custom' && redirectUrl) {
            this.redirectBtn.dataset.redirectUrl = redirectUrl;
            this.redirectBtn.dataset.isCustom = 'true';
          } else {
            delete this.redirectBtn.dataset.redirectUrl;
            this.redirectBtn.dataset.isCustom = 'false';
          }
          
          this.redirectBtn.disabled = false;
        }
      }
    }

    toggleCountryList() {
      const isExpanded = this.countryButton.getAttribute('aria-expanded') === 'true';
      this.countryButton.setAttribute('aria-expanded', !isExpanded);
      this.countryList.hidden = isExpanded;
      
      const searchInput = document.getElementById('country-search') || document.getElementById('country-search-dropdown');
      if (searchInput) {
        searchInput.hidden = isExpanded;
        if (!isExpanded) {
          searchInput.value = '';
          this.handleCountrySearch({ target: searchInput }, this.countryList.id);
          setTimeout(() => searchInput.focus(), 50);
        }
      }
    }

    handleCountrySearch(e, listId) {
      const searchTerm = e.target.value.toLowerCase();
      const countryList = document.getElementById(listId);
      if (!countryList) return;

      const items = countryList.querySelectorAll('li, button');
      let hasVisibleItems = false;

      items.forEach(item => {
        const link = item.querySelector('a') || item;
        const nameElement = link.querySelector('.country-option-name') || link.querySelector('span');
        const countryName = (nameElement?.textContent || link.textContent).toLowerCase();
        const countryCode = (link.getAttribute('data-value') || link.getAttribute('data-country') || '').toLowerCase();

        const isMatch = countryName.includes(searchTerm) || countryCode.includes(searchTerm);
        
        if (isMatch && searchTerm.length > 0) {
          item.style.display = '';
          hasVisibleItems = true;
        } else if (searchTerm.length === 0) {
          item.style.display = '';
          hasVisibleItems = true;
        } else {
          item.style.display = 'none';
        }
      });
    }

    handleGridCountrySearch(e) {
      const searchTerm = e.target.value.toLowerCase();
      const gridContainer = document.getElementById('CountryList');
      if (!gridContainer) return;

      const buttons = gridContainer.querySelectorAll('button[data-country]');

      buttons.forEach(button => {
        const countryName = (button.querySelector('span')?.textContent || button.textContent).toLowerCase();
        const countryCode = (button.getAttribute('data-value') || button.getAttribute('data-country') || '').toLowerCase();

        const isMatch = countryName.includes(searchTerm) || countryCode.includes(searchTerm);
        
        button.style.display = (isMatch || searchTerm.length === 0) ? '' : 'none';
      });
    }

    toggleLocationSelector() {
      const contentDiv = document.querySelector('.redirection-popup-content');
      const type = contentDiv?.getAttribute('data-popup-type');
      
      if (type === 'location_confirmation') {
        const confirmationWrapper = document.querySelector('.location-confirmation-wrapper');
        const selectorWrapper = document.querySelector('.location-country-selector-wrapper');
        
        if (confirmationWrapper && selectorWrapper) {
          confirmationWrapper.style.display = confirmationWrapper.style.display === 'none' ? 'block' : 'none';
          selectorWrapper.style.display = selectorWrapper.style.display === 'none' ? 'block' : 'none';
          
          if (selectorWrapper.style.display === 'block') {
            const locationCountryBtn = document.getElementById('location-country-button');
            locationCountryBtn?.setAttribute('aria-expanded', false);
            const locationCountryList = document.getElementById('LocationCountryList');
            if (locationCountryList) locationCountryList.hidden = true;
          }
        }
      }
    }

    toggleLocationCountryList() {
      const locationCountryBtn = document.getElementById('location-country-button');
      const isExpanded = locationCountryBtn.getAttribute('aria-expanded') === 'true';
      locationCountryBtn.setAttribute('aria-expanded', !isExpanded);
      const locationCountryList = document.getElementById('LocationCountryList');
      if (locationCountryList) locationCountryList.hidden = isExpanded;
      
      const locationSearch = document.getElementById('location-country-search');
      if (locationSearch) {
        locationSearch.hidden = isExpanded;
        if (!isExpanded) {
          locationSearch.value = '';
          this.handleCountrySearch({ target: locationSearch }, 'LocationCountryList');
          setTimeout(() => locationSearch.focus(), 50);
        }
      }
    }

    handleLocationCountrySelection(e) {
      const link = e.target.closest('.location-country-option');
      if (link) {
        e.preventDefault();
        
        const countryCode = link.getAttribute('data-value');
        const countryName = link.querySelector('.country-option-name')?.textContent || link.textContent;
        const currencyInfo = link.querySelector('.country-currency')?.textContent || '';
        
        const flagImg = document.getElementById('location-selected-country-flag');
        if (flagImg && countryCode) {
          flagImg.src = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/${countryCode.toLowerCase()}.png`;
          flagImg.onerror = function() { this.src = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`; };
        }
        
        const selectedCountrySpan = document.getElementById('location-selected-country');
        if (selectedCountrySpan) {
          selectedCountrySpan.innerHTML = `${countryName} ${currencyInfo}`;
        }
        
        const locationCountryName = document.getElementById('location-country-name');
        if (locationCountryName) {
          locationCountryName.textContent = countryName;
        }
        
        const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
        if (countryCodeInput) {
          countryCodeInput.value = countryCode;
        }
        
        const locationCountryBtn = document.getElementById('location-country-button');
        locationCountryBtn?.setAttribute('aria-expanded', false);
        const locationCountryList = document.getElementById('LocationCountryList');
        if (locationCountryList) locationCountryList.hidden = true;
        
        if (countryCode) {
          sessionStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
        }
      } else if (!e.target.closest('.disclosure')) {
        const locationCountryBtn = document.getElementById('location-country-button');
        if (locationCountryBtn?.getAttribute('aria-expanded') === 'true') {
          locationCountryBtn.setAttribute('aria-expanded', false);
          const locationCountryList = document.getElementById('LocationCountryList');
          if (locationCountryList) locationCountryList.hidden = true;
          const locationSearch = document.getElementById('location-country-search');
          if (locationSearch) locationSearch.hidden = true;
        }
      }
    }

    handleLocationConfirm() {
      this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
      this.closePopup();
    }

    handleShopNow() {
      const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
      const form = this.localizationForm?.querySelector('form');
      
      if (!countryCodeInput || !countryCodeInput.value) {
        console.warn('No country selected');
        return;
      }
      
      this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
      this.closePopup();
      
      if (this.selectedCountryData.type === 'custom' && this.selectedCountryData.redirectUrl) {
        window.location.href = this.selectedCountryData.redirectUrl;
      } else if (form) {
        form.submit();
      }
    }

    handleCountrySelection(e) {
      if (e.target.closest('.country-option')) {
        e.preventDefault();
        
        const link = e.target.closest('a');
        const countryCode = link.getAttribute('data-value');
        const countryType = link.getAttribute('data-type');
        const redirectUrl = link.getAttribute('data-redirect-url');
        const countryName = link.querySelector('.country-option-name')?.textContent || link.textContent;
        const currencyInfo = link.querySelector('.country-currency')?.textContent || '';

        this.selectedCountryData = { code: countryCode, type: countryType, redirectUrl: redirectUrl };

        const flagImg = document.getElementById('selected-country-flag');
        if (flagImg && countryCode) {
          flagImg.src = `https://raw.githubusercontent.com/hampusborgos/country-flags/main/png100px/${countryCode.toLowerCase()}.png`;
          flagImg.onerror = function() { this.src = `https://flagcdn.com/${countryCode.toLowerCase()}.svg`; };
        }

        this.selectedCountrySpan.innerHTML = `${countryName} ${currencyInfo}`;
        
        const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
        if (countryCodeInput) {
          countryCodeInput.value = countryCode;
        }
        
        if (this.redirectBtn) {
          if (countryCode && countryType === 'custom' && redirectUrl) {
            this.redirectBtn.dataset.redirectUrl = redirectUrl;
            this.redirectBtn.dataset.isCustom = 'true';
          } else {
            delete this.redirectBtn.dataset.redirectUrl;
            this.redirectBtn.dataset.isCustom = 'false';
          }
          
          this.redirectBtn.disabled = !countryCode;
        }
        
        this.countryButton.setAttribute('aria-expanded', false);
        this.countryList.hidden = true;
        const searchInput = document.getElementById('country-search') || document.getElementById('country-search-dropdown');
        if (searchInput) searchInput.hidden = true;
        
        if (countryCode) {
          sessionStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
        }
      } else if (!e.target.closest('.disclosure') && !e.target.classList.contains('country-search-input')) {
        this.countryButton.setAttribute('aria-expanded', false);
        this.countryList.hidden = true;
        const searchInput = document.getElementById('country-search') || document.getElementById('country-search-dropdown');
        if (searchInput) searchInput.hidden = true;
      }
    }

    handleKeyboard(e) {
      if (e.key === 'Escape') {
        this.closePopup();
      }
    }

    handleButtonCountrySelection(e) {
      const btn = e.target.closest('[data-country]:not(.disclosure__button)');
      if (!btn) return;

      e.preventDefault();
      const countryCode = btn.getAttribute('data-value');
      const countryType = btn.getAttribute('data-type');
      const redirectUrl = btn.getAttribute('data-redirect-url');
      
      this.updateCountrySelection(countryCode, countryType, redirectUrl, btn);
    }

    handleRadioSelection(e) {
      if (e.target.type !== 'radio' || !e.target.hasAttribute('data-country')) return;

      const countryCode = e.target.value;
      const countryType = e.target.getAttribute('data-type');
      const redirectUrl = e.target.getAttribute('data-redirect-url');

      this.updateCountrySelection(countryCode, countryType, redirectUrl, e.target);
    }

    handleTabSelection(e) {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      e.preventDefault();
      const countryCode = btn.getAttribute('data-value');
      const countryType = btn.getAttribute('data-type');
      const redirectUrl = btn.getAttribute('data-redirect-url');

      this.updateCountrySelection(countryCode, countryType, redirectUrl, btn);
    }

    updateCountrySelection(countryCode, countryType, redirectUrl, element) {
      if (!countryCode) return;

      document.querySelectorAll('[data-country]').forEach(el => el.classList.remove('active'));
      element.classList.add('active');

      const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
      if (countryCodeInput) {
        countryCodeInput.value = countryCode;
      }

      if (this.redirectBtn) {
        if (countryType === 'custom' && redirectUrl) {
          this.redirectBtn.dataset.redirectUrl = redirectUrl;
          this.redirectBtn.dataset.isCustom = 'true';
        } else {
          delete this.redirectBtn.dataset.redirectUrl;
          this.redirectBtn.dataset.isCustom = 'false';
        }

        this.redirectBtn.disabled = !countryCode;
      }

      if (countryCode) {
        sessionStorage.setItem(COUNTRY_STORAGE_KEY, countryCode);
      }
    }

    handleRedirect() {
      const countryCodeInput = this.localizationForm?.querySelector('input[name="country_code"]');
      const form = this.localizationForm?.querySelector('form');
      const isCustom = this.redirectBtn.dataset.isCustom === 'true';
      const redirectUrl = this.redirectBtn.dataset.redirectUrl;
      
      if (!countryCodeInput) {
        console.warn('Country code input not found');
        return;
      }

      const countryCode = countryCodeInput.value;
      
      if (!countryCode) {
        console.warn('No country selected');
        return;
      }

      this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
      this.closePopup();
      
      if (isCustom && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        if (!form) {
          console.warn('Localization form not found');
          return;
        }
        form.submit();
      }
    }

    handleFormSubmit() {
      this.setCookie(COOKIE_NAME, 'true', COOKIE_DAYS);
      this.closePopup();
    }

    showPopup() {
      if (this.popup) {
        this.popup.style.display = 'flex';
      }
    }

    closePopup() {
      if (this.popup) {
        this.popup.style.display = 'none';
        sessionStorage.setItem(STORAGE_KEY, 'true');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new RedirectionPopup();
    });
  } else {
    new RedirectionPopup();
  }
})();
