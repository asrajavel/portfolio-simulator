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

// Suppress known BaseWeb warnings
// 1. defaultProps warning (until they fully migrate to React 18)
const originalError = console.error;

console.error = (...args: any[]) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '');
  if (
    message.includes('Support for defaultProps will be removed') ||
    message.includes('aria-hidden')
  ) {
    return;
  }
  originalError.apply(console, args);
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
        <BrowserRouter basename="/portfolio-simulator">
          <App />
        </BrowserRouter>
      </React.StrictMode>
    </BaseProvider>
  </StyletronProvider>
);