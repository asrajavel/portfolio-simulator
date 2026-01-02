import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { Provider as StyletronProvider } from 'styletron-react';
import { Client as Styletron } from 'styletron-engine-atomic';
import { BaseProvider, LightTheme } from 'baseui';
import Highcharts from 'highcharts/highstock';
import 'normalize.css';
import { initializeAnalytics } from './utils/analytics';

// Initialize Google Analytics
initializeAnalytics();

// Suppress known warnings
// 1. BaseWeb defaultProps warning (until they fully migrate to React 18)
// 2. BaseWeb aria-hidden warnings (known BaseWeb Select component issue)
// 3. React Router future flags (we've opted in, warnings are informational)
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
  if (
    message.includes('Support for defaultProps will be removed') ||
    message.includes('aria-hidden') ||
    message.includes('React Router Future Flag Warning')
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
  if (
    message.includes('React Router Future Flag Warning') ||
    message.includes('v7_startTransition') ||
    message.includes('v7_relativeSplatPath')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Disable Highcharts accessibility warning
// Can enable accessibility module if needed for better screen reader support
Highcharts.setOptions({
  accessibility: {
    enabled: false
  }
});

const engine = new Styletron();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StyletronProvider value={engine}>
    <BaseProvider theme={LightTheme}>
      <React.StrictMode>
        <BrowserRouter 
          basename="/portfolio-simulator"
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </React.StrictMode>
    </BaseProvider>
  </StyletronProvider>
);