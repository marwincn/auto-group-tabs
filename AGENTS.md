# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-04
**Context:** Chrome Extension (Manifest V3)

## OVERVIEW
Chrome extension that automatically groups tabs based on domain or custom rules. Built with **React 17** and **Ant Design**. Core logic runs in the background service worker, while UI handles configuration.

## STRUCTURE
```
.
├── public/
│   ├── background/    # Core logic (Service Worker)
│   │   ├── strategy.js      # Grouping algorithms (domain/config based)
│   │   └── background.js    # Event listeners & state management
│   └── manifest.json  # Manifest V3 configuration
├── src/
│   ├── popup/         # Extension popup UI
│   ├── options/       # Options page UI
│   ├── i18n/          # Localization (en_US, zh_CN)
│   └── index.js       # React entry point
└── build/             # Production output
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Grouping Logic** | `public/background/strategy.js` | Contains `domainStrategy`, `secDomainStrategy`, `configStrategy` |
| **Event Handling** | `public/background/background.js` | Listens to `chrome.tabs.onUpdated` |
| **UI Routing** | `src/index.js` | HashRouter setup for Popup vs Options |
| **Permissions** | `public/manifest.json` | Requires `tabs`, `tabGroups`, `storage` |

## CONVENTIONS
- **React**: Uses React 17 (older version).
- **Globals**: `chrome` API is globally available (defined in `.eslintrc`).
- **Styles**: CSS files co-located with components (e.g., `OptionsPage.css`).
- **State**: `chrome.storage.sync` used for persisting user preferences.

## COMMANDS
```bash
npm install     # Install dependencies
npm start       # Dev server (hot reload for UI, not background)
npm run build   # Build for production (output to build/)
npm test        # Run tests
```

## NOTES
- **Manifest V3**: Uses `service_worker` in `background` field.
- **Build**: Output directory `build/` is what you load into Chrome "Unpacked Extension".
- **i18n**: Uses `react-intl` for UI strings.
