import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SITE = 'https://asrajavel.github.io/portfolio-simulator/';

// GitHub Pages serves /sip from sip.html with a 200. Without these copies, deep
// routes only work through 404.html, and crawlers don't index a 404.
const ROUTE_PAGES: Record<string, { title: string; description: string }> = {
  sip: {
    title: 'SIP Simulator - Backtest Mutual Fund SIP Rolling Returns | India',
    description: 'Backtest a monthly SIP in Indian mutual funds, indices, stocks, PPF and EPF. Compare portfolios by rolling XIRR and volatility, with rebalancing and annual step-up.',
  },
  historical: {
    title: 'Historical NAV & Index Values - Mutual Funds, Nifty, Stocks | India',
    description: 'Chart and compare the historical NAV or price of Indian mutual funds, NSE indices, stocks, ETFs, PPF, EPF and inflation.',
  },
};

function routePages(): Plugin {
  return {
    name: 'route-pages',
    apply: 'build',
    closeBundle() {
      const html = readFileSync('dist/index.html', 'utf8');
      // /lumpsum is what the root shows, so it keeps the root's title and canonical.
      writeFileSync('dist/lumpsum.html', html);
      for (const [route, { title, description }] of Object.entries(ROUTE_PAGES)) {
        const replacements: [RegExp, string][] = [
          [/<title>[^<]*<\/title>/, `<title>${title.replace('&', '&amp;')}</title>`],
          [/(<meta name="description" content=")[^"]*/, `$1${description}`],
          [new RegExp(`(<link rel="canonical" href=")${SITE}`), `$1${SITE}${route}`],
          [new RegExp(`(<meta property="og:url" content=")${SITE}`), `$1${SITE}${route}`],
        ];
        let page = html;
        for (const [pattern, replacement] of replacements) {
          if (!pattern.test(page)) throw new Error(`route-pages: ${pattern} not found in index.html`);
          page = page.replace(pattern, replacement);
        }
        writeFileSync(`dist/${route}.html`, page);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), routePages()],
  base: '/portfolio-simulator/',
  server: {
    sourcemapIgnoreList: false
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  worker: {
    format: 'es'
  }
});