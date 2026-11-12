(() => {
  function readRedirectRules(root) {
    try {
      const rulesElement = root.querySelector('#auto-redirect-rules');
      return rulesElement?.textContent ? JSON.parse(rulesElement.textContent) : {};
    } catch (error) {
      console.error('Unable to read country redirect rules:', error);
      return {};
    }
  }

  async function detectVisitorCountry(fallbackCountry) {
    return window.CountryBlockerCountryDetection.getCountry(fallbackCountry);
  }

  async function runAutoRedirect() {
    const root = document.getElementById('country-blocker-auto-redirect');
    if (!root || window.Shopify?.designMode) return;

    const countryCode = await detectVisitorCountry(root.dataset.country);
    if (!countryCode) return;

    const redirectRules = readRedirectRules(root);
    const finalCountryCode = countryCode === 'HK' && redirectRules.CN ? 'CN' : countryCode;
    const redirectUrl = redirectRules[finalCountryCode];

    if (redirectUrl) {
      const destination = new URL(redirectUrl, window.location.href);
      const currentPage = new URL(window.location.href);
      destination.hash = '';
      currentPage.hash = '';
      if (destination.href !== currentPage.href) {
        window.location.replace(destination.href);
      }
      return;
    }

    const form = root.querySelector('form');
    const countryCodeInput = form?.querySelector('input[name="country_code"]');
    if (form && countryCodeInput && countryCodeInput.value !== finalCountryCode) {
      countryCodeInput.value = finalCountryCode;
      form.submit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAutoRedirect, { once: true });
  } else {
    runAutoRedirect();
  }
})();
