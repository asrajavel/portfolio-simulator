// Application constants
export const DEFAULT_SCHEME_CODE = 120716;
export const DEFAULT_REBALANCING_THRESHOLD = 5;

// API Configuration
export const API_ENDPOINTS = {
  MFAPI_BASE: 'https://api.mfapi.in',
  YAHOO_FINANCE_PROXY: 'https://api.allorigins.win/get?url=',
  INDEX_DATA_BASE: 'https://raw.githubusercontent.com/asrajavel/mf-index-data/main'
} as const;

// UI Configuration
export const COLORS = [
  '#007bff', '#28a745', '#ff9800', '#e91e63', 
  '#9c27b0', '#00bcd4', '#795548', '#607d8b'
] as const;

// Validation
export const ALLOCATION_TOTAL = 100;
export const MIN_ALLOCATION = 0;
export const MAX_ALLOCATION = 100;

// Date calculations
export const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
export const MONTHS_PER_YEAR = 12;

// Chart Styling Configuration
export const CHART_STYLES = {
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  axisTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  axisLabels: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  legend: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  tooltip: {
    fontSize: '12px',
    color: '#ffffff'
  },
  colors: {
    gridLine: '#f3f4f6',
    line: '#e5e7eb',
    tick: '#e5e7eb',
    background: '#ffffff',
    tooltipBackground: '#1f2937'
  }
} as const;
