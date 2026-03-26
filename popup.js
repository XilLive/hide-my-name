(function () {
  "use strict";

  const enableToggle = document.getElementById("enableToggle");
  const displayNameInput = document.getElementById("displayName");
  const saveDisplayNameBtn = document.getElementById("saveDisplayName");
  const newPhraseInput = document.getElementById("newPhrase");
  const newReplacementInput = document.getElementById("newReplacement");
  const addRuleBtn = document.getElementById("addRule");
  const rulesList = document.getElementById("rulesList");
  const emptyMsg = document.getElementById("emptyMsg");

  let rules = [];

  // ---- Load stored data -------------------------------------------------------

  chrome.storage.sync.get(
    { rules: [], displayName: "Anon", enabled: true },
    (data) => {
      rules = data.rules || [];
      displayNameInput.value = data.displayName || "Anon";
      enableToggle.checked = data.enabled !== false;
      renderRules();
    }
  );

  // ---- Blur / reveal ----------------------------------------------------------

  const rulesContent = document.getElementById("rulesContent");
  const toggleRevealBtn = document.getElementById("toggleReveal");
  const showBtn = document.getElementById("showBtn");

  function reveal() {
    rulesContent.classList.remove("blurred");
    toggleRevealBtn.textContent = "Hide";
  }

  function blur() {
    rulesContent.classList.add("blurred");
    toggleRevealBtn.textContent = "Show";
  }

  toggleRevealBtn.addEventListener("click", () => {
    rulesContent.classList.contains("blurred") ? reveal() : blur();
  });

  showBtn.addEventListener("click", reveal);

  // ---- Event listeners --------------------------------------------------------

  enableToggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: enableToggle.checked });
  });

  saveDisplayNameBtn.addEventListener("click", () => {
    const name = displayNameInput.value.trim();
    if (!name) return;
    chrome.storage.sync.set({ displayName: name });
    flashButton(saveDisplayNameBtn, "Saved!");
  });

  displayNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveDisplayNameBtn.click();
  });

  addRuleBtn.addEventListener("click", addRule);

  newPhraseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRule();
  });
  newReplacementInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addRule();
  });

  // ---- Rule management --------------------------------------------------------

  function addRule() {
    const phrase = newPhraseInput.value.trim();
    if (!phrase) {
      newPhraseInput.focus();
      return;
    }
    const replacement = newReplacementInput.value.trim();
    rules.push({ phrase, replacement });
    saveRules();
    newPhraseInput.value = "";
    newReplacementInput.value = "";
    newPhraseInput.focus();
    renderRules();
  }

  function deleteRule(index) {
    rules.splice(index, 1);
    saveRules();
    renderRules();
  }

  function editRule(index) {
    const rule = rules[index];
    const li = rulesList.children[index];
    if (!li) return;

    li.innerHTML = "";
    li.classList.add("editing");

    const phraseInput = document.createElement("input");
    phraseInput.type = "text";
    phraseInput.className = "edit-input";
    phraseInput.value = rule.phrase;
    phraseInput.spellcheck = false;

    const replInput = document.createElement("input");
    replInput.type = "text";
    replInput.className = "edit-input edit-input-sm";
    replInput.value = rule.replacement || "";
    replInput.placeholder = "replacement";
    replInput.spellcheck = false;

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-small btn-save";
    saveBtn.textContent = "Save";
    saveBtn.title = "Save changes";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-small btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.title = "Cancel editing";

    function save() {
      const newPhrase = phraseInput.value.trim();
      if (!newPhrase) {
        phraseInput.focus();
        return;
      }
      rules[index] = {
        phrase: newPhrase,
        replacement: replInput.value.trim(),
      };
      saveRules();
      renderRules();
    }

    saveBtn.addEventListener("click", save);
    cancelBtn.addEventListener("click", () => renderRules());
    phraseInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") renderRules();
    });
    replInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") save();
      if (e.key === "Escape") renderRules();
    });

    li.append(phraseInput, replInput, saveBtn, cancelBtn);
    phraseInput.focus();
  }

  function saveRules() {
    chrome.storage.sync.set({ rules });
  }

  // ---- Rendering --------------------------------------------------------------

  function renderRules() {
    rulesList.innerHTML = "";
    emptyMsg.style.display = rules.length === 0 ? "block" : "none";

    rules.forEach((rule, i) => {
      const li = document.createElement("li");
      li.className = "rule-item";

      const phraseSpan = document.createElement("span");
      phraseSpan.className = "rule-phrase";
      phraseSpan.textContent = rule.phrase;

      const arrow = document.createElement("span");
      arrow.className = "rule-arrow";
      arrow.textContent = "->";

      const replSpan = document.createElement("span");
      replSpan.className = "rule-replacement";
      replSpan.textContent = rule.replacement || "(display name)";
      if (!rule.replacement) replSpan.classList.add("dimmed");

      const actions = document.createElement("span");
      actions.className = "rule-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-icon";
      editBtn.innerHTML = "&#9998;";
      editBtn.title = "Edit rule";
      editBtn.addEventListener("click", () => editRule(i));

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-icon btn-danger";
      delBtn.innerHTML = "&times;";
      delBtn.title = "Delete rule";
      delBtn.addEventListener("click", () => deleteRule(i));

      actions.append(editBtn, delBtn);
      li.append(phraseSpan, arrow, replSpan, actions);
      rulesList.appendChild(li);
    });
  }

  // ---- Helpers ----------------------------------------------------------------

  function flashButton(btn, text) {
    const orig = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 1000);
  }
})();
