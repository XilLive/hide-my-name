// Service worker - keeps the extension lifecycle alive and handles install.
chrome.runtime.onInstalled.addListener(() => {
  // Set sensible defaults on first install.
  chrome.storage.sync.get(null, (data) => {
    if (!data.displayName) {
      chrome.storage.sync.set({
        displayName: "Anon",
        rules: [],
        enabled: true,
      });
    }
  });
});
