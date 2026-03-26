---
description: publish formatting and packaging rules for the extension
---

When the user asks to package up an extension, re-zip it, or make it ready for the final repo upload, ALWAYS follow these steps:

1. Check for any hardcoded sensitive information.
2. Open `manifest.json` and bump the `"version"` number (e.g. from 1.0.0 to 1.0.1) so that the Chrome Web Store accepts the uploaded package.
3. Once the code goes up to GitHub, commit these changes with a message like `"Bump version to X.X.X for release"`.
4. Zip the extension securely (excluding `.git` and development artifacts like `.agents` directory). Do this by explicitly zipping the required extension files, for example using PowerShell:
   `Compress-Archive -Path manifest.json, content.js, popup.html, popup.js, popup.css, background.js, icons, README.md, PRIVACY.md -DestinationPath hide-my-name.zip -Update`
