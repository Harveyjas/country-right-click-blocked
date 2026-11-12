(() => {
  const initializeCountryBlocker = () => {
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

    if (blockedCountries.includes(countriesElement.dataset.country)) {
      blocker.style.display = "flex";
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCountryBlocker, { once: true });
  } else {
    initializeCountryBlocker();
  }
})();
