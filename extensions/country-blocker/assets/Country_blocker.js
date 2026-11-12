(() => {
  const initializeCountryBlocker = async () => {
    const countriesElement = document.getElementById("blocked-countries");
    const blocker = document.getElementById("blocker-div");
    if (!countriesElement || !blocker) return;

    let blockedCountries = [];
    try {
      const value = JSON.parse(countriesElement.dataset.countries || "[]");
      blockedCountries = Array.isArray(value) ? value : [];
    } catch {
      return;
    }

    const blockedCountryCodes = blockedCountries
      .map((country) => (typeof country === "string" ? country : country?.code))
      .filter(Boolean)
      .map((countryCode) => countryCode.toUpperCase());
    const visitorCountry = await window.CountryBlockerCountryDetection.getCountry(
      countriesElement.dataset.country,
    );
    countriesElement.dataset.country = visitorCountry;

    if (blockedCountryCodes.includes(visitorCountry)) {
      blocker.style.display = "flex";
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCountryBlocker, { once: true });
  } else {
    initializeCountryBlocker();
  }
})();
