if (!window.CountryBlockerCountryDetection) {
  window.CountryBlockerCountryDetection = (() => {
    const STORAGE_KEY = 'country-blocker-detected-country-v1';
    let detectionRequest;

    async function getCountry(fallbackCountry) {
      const fallback = fallbackCountry?.toUpperCase() || '';

      try {
        let cachedCountry = '';
        try {
          cachedCountry = sessionStorage.getItem(STORAGE_KEY) || '';
        } catch {}
        if (cachedCountry) return cachedCountry;

        detectionRequest ||= (async () => {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch('https://api.country.is/', {
              headers: { Accept: 'application/json' },
              cache: 'no-store',
              signal: controller.signal,
            });
            if (!response.ok) throw new Error(`Country API returned ${response.status}`);

            const data = await response.json();
            const country = typeof data.country === 'string' ? data.country.toUpperCase() : '';
            if (!/^[A-Z]{2}$/.test(country)) throw new Error('Country API returned no valid country code');
            return country;
          } finally {
            window.clearTimeout(timeoutId);
          }
        })();

        const detectedCountry = await detectionRequest;
        try {
          sessionStorage.setItem(STORAGE_KEY, detectedCountry);
        } catch {}
        return detectedCountry;
      } catch (error) {
        console.warn('Could not detect visitor country; using the storefront country.', error);
        return fallback;
      }
    }

    return { getCountry };
  })();
}
