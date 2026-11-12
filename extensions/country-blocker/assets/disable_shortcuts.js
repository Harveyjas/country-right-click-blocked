(() => {
  const shortcutElement = document.getElementById("keyboard-shortcut");
  if (!shortcutElement) return;

  const shortcutsEnabled = shortcutElement.getAttribute("data-shortcuts") === "true";
  if (!shortcutsEnabled) return;

  const isInteractiveTarget = (target) =>
    !!target?.closest(
      'input, textarea, select, [contenteditable="true"], [data-allow-interaction="true"]',
    );

  const getElementFromNode = (node) => {
    if (!node) return null;
    if (node.nodeType === Node.ELEMENT_NODE) return node;
    if (node.nodeType === Node.DOCUMENT_NODE) return document.activeElement;
    return node.parentElement || null;
  };

  const isEventWithinInteractiveElement = (event) => {
    const targetElement = getElementFromNode(event?.target);
    if (isInteractiveTarget(targetElement)) return true;
    return isInteractiveTarget(document.activeElement);
  };

  const style = document.createElement("style");
  style.textContent = `
    body.geoshield-content-protection {
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    body.geoshield-content-protection :not(input):not(textarea):not(select):not([contenteditable="true"]):not([data-allow-interaction="true"]) {
      -webkit-user-select: none;
      user-select: none;
    }
    body.geoshield-content-protection input,
    body.geoshield-content-protection textarea,
    body.geoshield-content-protection select,
    body.geoshield-content-protection [contenteditable="true"],
    body.geoshield-content-protection [data-allow-interaction="true"] {
      -webkit-user-select: text;
      user-select: text;
      caret-color: auto;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("geoshield-content-protection");

  document.addEventListener("contextmenu", (event) => {
    if (!isEventWithinInteractiveElement(event)) event.preventDefault();
  });

  document.addEventListener("keydown", (event) => {
    if (isEventWithinInteractiveElement(event)) return;

    const key = event.key.toLowerCase();

    if ((event.ctrlKey || event.metaKey) && ["c", "x", "a", "s", "u", "p"].includes(key)) {
      event.preventDefault();
    }

    if (event.key === "F12") event.preventDefault();

    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      ["i", "j"].includes(key)
    ) {
      event.preventDefault();
    }

    if (event.shiftKey && event.key === "F10") event.preventDefault();
  });

  ["copy", "cut", "selectstart"].forEach((evt) => {
    document.addEventListener(
      evt,
      (event) => {
        if (isEventWithinInteractiveElement(event)) return;
        event.preventDefault();
      },
      true,
    );
  });

  ["dragstart", "drop"].forEach((evt) => {
    document.addEventListener(evt, (event) => {
      if (isEventWithinInteractiveElement(event)) return;
      event.preventDefault();
    });
  });
})();
