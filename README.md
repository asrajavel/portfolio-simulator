# Portfolio Simulator

**Backtest Indian mutual fund SIP and lumpsum investments with rolling returns — free, no signup, runs entirely in your browser.**

### [Open the app →](https://asrajavel.github.io/portfolio-simulator/)

If this is useful to you, a ⭐ helps other investors find it.

## Why

A fund's "5-year return" is one number from one start date. Rolling returns show every 5-year period in the fund's history, so you see the good stretches, the bad ones, and how often each happened.

## What you can do

- **Compare portfolios side by side** — mix assets in any proportion (e.g. 70% flexi cap + 30% liquid) and plot them against an index.
- **SIP simulation** — monthly SIP with optional rebalancing and annual step-up, shown as rolling XIRR or final corpus.
- **Lumpsum simulation** — one-time investment across rolling periods.
- **See the transactions behind any point** — click a point on the chart to see every buy, rebalance and the final value.
- **Many asset types in one chart**
  - Mutual funds (all AMFI schemes)
  - Indices as Total Return Index (Nifty 50, Sensex and more)
  - Stocks and ETFs from Yahoo Finance
  - PPF and EPF with historical rates
  - Fixed-return instruments
  - CPI inflation
- **Share by URL** — the whole setup is in the link.
- **Private** — there is no backend. Nothing you enter leaves your browser.

## Run locally

```bash
npm install
npm run dev     # http://localhost:5173/portfolio-simulator/
npm test
```

Built with React, TypeScript, Vite, Base Web and Highcharts. Pushing to `main` deploys to GitHub Pages.

## Data sources

- Mutual fund NAVs: [mfapi.in](https://www.mfapi.in/)
- Index data: [asrajavel/mf-index-data](https://github.com/asrajavel/mf-index-data)
- Stocks and ETFs: Yahoo Finance

## Contributing

Issues and pull requests are welcome.

## License

[AGPL-3.0](LICENSE)

*This is a tool for exploring historical data, not investment advice.*
