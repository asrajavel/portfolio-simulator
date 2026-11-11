# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run deploy       # Manual deploy to GitHub Pages (normally automatic on push to main via .github/workflows/deploy.yml)

# Run a single test file
npx jest src/utils/calculations/sipRollingXirr/__tests__/basic.test.ts
```

The dev server serves under the base path: `http://localhost:5173/portfolio-simulator/<route>` (not `/<route>`). Commits go straight to `main`.

## Architecture Overview

This is a **no-backend, client-only React + TypeScript app** hosted on GitHub Pages. All data is fetched at runtime from external APIs.

### Tabs / Pages

Four tabs rendered in `App.tsx` via React Router, each kept mounted (shown/hidden with `display: none`) to preserve state:

| Route | Tab | Purpose |
|---|---|---|
| `/lumpsum` | `LumpsumSimulatorTab` | One-time investment comparison |
| `/sip` | `SipSimulatorTab` | Monthly SIP comparison with rebalancing |
| `/historical` | `HistoricalValuesTab` | Raw NAV history for a single asset |
| `/tracker` | `TrackerTab` | Portfolio tracker with goals and XIRR |

`/tracker` is not in the nav menu; it is reached by URL only.

### Asset Types

All investable assets share the `Asset` union type (`src/types/asset.ts`):
- `mutual_fund` — fetched via `api.mfapi.in`
- `index_fund` — fetched from `raw.githubusercontent.com/asrajavel/mf-index-data`
- `yahoo_finance` — fetched from Yahoo Finance via the `CORS_PROXY_URL` proxy (for stocks, ETFs)
- `fixed_return` — synthetic NAV computed from a fixed annual percentage
- `gov_scheme` — synthetic NAV for PPF/EPF using historical rate tables
- `inflation` — synthetic NAV for CPI inflation data

### Data Flow

1. User selects assets and parameters in controls
2. NAV data is fetched from external APIs (see `src/services/`)
3. Calculations run client-side; the SIP calc uses a web worker (`sipRollingXirr/worker.ts`) and takes a few seconds. Timings are logged in the console.
4. Results are displayed via Highcharts

For SIP and Lumpsum tabs, portfolios and query params are two-way synced via `src/utils/browser/queryParams.ts` — state is URL-shareable.

### Core Calculation Engine

`src/utils/calculations/sipRollingXirr/` — the most complex part of the codebase:

- **Optimized path** (`calculateTransactionsForDate`): Skips nil transactions for performance, used for the main chart
- **Nil path** (`calculateTransactionsForDateWithNil`): Includes daily nil transactions, used only when viewing transaction details in the modal (`TransactionModal`)
- `recalculateTransactionsForDate` is called on-demand when a user opens the transaction modal for a specific rolling date
- Volatility is computed as a separate pass over daily portfolio values

Lumpsum equivalent lives in `src/utils/calculations/lumpSumRollingXirr/`.

### Tracker Module

`src/tracker/` is largely self-contained:
- Portfolio data (goals + holdings + transactions) is stored in `localStorage` as JSON
- `portfolioCalculator.ts` fetches NAVs for all holdings and computes daily snapshots, XIRR, and summaries
- The JSON editor modal (`JsonEditorModal`) uses Monaco Editor and validates against `src/tracker/validation.ts`
- `data/portfolio-demo.json` is the demo data loaded for new users

### UI Framework

Uses **Base Web** (`baseui`) with Styletron for styling. Avoid custom CSS — use Base Web's component props and overrides. Refer to Base Web docs for available components.

### Mobile / Responsive

The site must fit a 375px-wide phone with no horizontal page scroll.

- Phone breakpoint is **600px**. Prefer Base Web responsive arrays on `Block` props: `[phone, phone, desktop]` — index 1 applies from 320px, index 2 from 600px, so repeat the phone value. For style overrides use `'@media (max-width: 599px)'`.
- No fixed widths wider than a phone. Use `flexWrap` on rows, `minWidth: 'min(Npx, 100%)'`, and wrap tables in an `overflowX: 'auto'` box.
- Charts: use `CHART_SPACING` from `src/constants` for side spacing; never give a chart a fixed pixel width.
- When checking a UI change on mobile, also open: the transaction modal (click a point on a rolling chart), the help drawer, and the Tracker with data (`/tracker#src=<gist-url>` — ask the user for a sample gist).

### External APIs

| API | Used for | Constant |
|---|---|---|
| `api.mfapi.in/mf/{schemeCode}` | Mutual fund NAV | `API_ENDPOINTS.MFAPI_BASE` |
| `api.mfapi.in/mf` | Fund list search (via `CORS_PROXY_URL`) | `API_ENDPOINTS.MFAPI_BASE` |
| `raw.githubusercontent.com/asrajavel/mf-index-data` | Index data (Nifty, Sensex, etc.) | `API_ENDPOINTS.INDEX_DATA_BASE` |
| `query1.finance.yahoo.com/v8/finance/chart/{symbol}` | Yahoo Finance stock data (via `CORS_PROXY_URL`) | — |
| `cors-proxy-lake-omega.vercel.app/api/proxy` | CORS proxy for Yahoo Finance and the fund list | `CORS_PROXY_URL` |

### Help System

`src/components/help/helpContent.ts` contains all help text as a flat map keyed by topic ID. The `HelpContext` / `HelpDrawer` pattern makes `openHelp(topicId)` available anywhere via context. When adding new features that need documentation, add a new entry in `helpContent.ts`.

## Testing Guidelines

- Keep tests **minimal and focused** on critical functionality and edge cases
- **Assert exact values**, not approximations — run a quick dummy test to capture actual outputs first, then use those as exact assertions
- Combine related assertions in a single test when logical; avoid granular per-assertion tests
- Test files for calculations live alongside the code: `src/utils/calculations/sipRollingXirr/__tests__/`
