(function () {
  "use strict";

  let rules = [];
  let displayName = "";
  let enabled = true;
  let ready = false;

  // Hide the page immediately to prevent any flash of real content.
  // A <style> injected at document_start will block rendering of matching text.
  const hideStyle = document.createElement("style");
  hideStyle.textContent = "body { visibility: hidden !important; }";
  (document.head || document.documentElement).appendChild(hideStyle);

  // Load settings from storage, then begin processing.
  chrome.storage.sync.get(
    { rules: [], displayName: "Anon", enabled: true },
    (data) => {
      rules = data.rules || [];
      displayName = data.displayName || "Anon";
      enabled = data.enabled;
      ready = true;

      if (!enabled || rules.length === 0) {
        hideStyle.remove();
        return;
      }

      // Process anything already in the DOM.
      processNode(document.documentElement);

      // Reveal the page now that the initial DOM has been scrubbed.
      hideStyle.remove();

      // Watch for future DOM changes.
      startObserver();
    }
  );

  // Listen for setting changes while the page is open.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;

    if (changes.rules) rules = changes.rules.newValue || [];
    if (changes.displayName) displayName = changes.displayName.newValue || "Anon";
    if (changes.enabled !== undefined) enabled = changes.enabled.newValue;

    // Re-process the whole page with updated rules.
    if (enabled && rules.length > 0) {
      processNode(document.documentElement);
      startObserver();
    }
  });

  // ---- Text replacement logic ------------------------------------------------

  // Build a single regex that matches any of the rule phrases as whole words.
  function buildRegex(ruleList) {
    if (!ruleList || ruleList.length === 0) return null;
    // Sort by length descending so longer phrases match first.
    const sorted = ruleList
      .map((r) => r.phrase)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    if (sorted.length === 0) return null;
    const escaped = sorted.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // Use word boundaries for whole-word matching.
    return new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");
  }

  function getReplacement(matched) {
    // Find the rule whose phrase matches (case-insensitive).
    const lower = matched.toLowerCase();
    for (const rule of rules) {
      if (rule.phrase && rule.phrase.toLowerCase() === lower) {
        return rule.replacement || displayName;
      }
    }
    return displayName;
  }

  // Tags we should never descend into or modify.
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "CODE",
    "PRE",
  ]);

  function processNode(root) {
    if (!enabled || rules.length === 0) return;
    const regex = buildRegex(rules);
    if (!regex) return;

    // Use a TreeWalker to find all text nodes efficiently.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (SKIP_TAGS.has(node.parentElement?.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (const node of textNodes) {
      replaceTextInNode(node, regex);
    }

    // Also handle placeholder / value / title / alt attributes.
    replaceAttributes(root, regex);
  }

  function replaceTextInNode(textNode, regex) {
    const original = textNode.nodeValue;
    if (!regex.test(original)) return;
    // Reset lastIndex after test.
    regex.lastIndex = 0;
    textNode.nodeValue = original.replace(regex, (match) =>
      getReplacement(match)
    );
  }

  function replaceAttributes(root, regex) {
    const attrNames = ["placeholder", "value", "title", "alt", "aria-label"];
    const els = root.querySelectorAll
      ? root.querySelectorAll("*")
      : [];
    for (const el of els) {
      if (SKIP_TAGS.has(el.tagName)) continue;
      for (const attr of attrNames) {
        const val = el.getAttribute(attr);
        if (val && regex.test(val)) {
          regex.lastIndex = 0;
          el.setAttribute(
            attr,
            val.replace(regex, (match) => getReplacement(match))
          );
        }
      }
      // Handle input / textarea values directly (displayed text).
      if (
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        el.value &&
        regex.test(el.value)
      ) {
        regex.lastIndex = 0;
        el.value = el.value.replace(regex, (match) => getReplacement(match));
      }
    }
  }

  // ---- MutationObserver -------------------------------------------------------

  let observer = null;
  let processing = false;

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      if (processing) return;
      if (!enabled || rules.length === 0) return;
      const regex = buildRegex(rules);
      if (!regex) return;

      processing = true;
      for (const mutation of mutations) {
        // New nodes added to the DOM.
        for (const added of mutation.addedNodes) {
          if (added.nodeType === Node.TEXT_NODE) {
            if (!SKIP_TAGS.has(added.parentElement?.tagName)) {
              replaceTextInNode(added, regex);
            }
          } else if (added.nodeType === Node.ELEMENT_NODE) {
            processNode(added);
          }
        }
        // Text content changed in place.
        if (
          mutation.type === "characterData" &&
          mutation.target.nodeType === Node.TEXT_NODE
        ) {
          if (!SKIP_TAGS.has(mutation.target.parentElement?.tagName)) {
            replaceTextInNode(mutation.target, regex);
          }
        }
      }
      processing = false;
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function safeProcess(node) {
    processing = true;
    processNode(node);
    processing = false;
  }
})();
