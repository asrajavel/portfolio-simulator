import { CHART_STYLES } from '../constants';

/**
 * Shared stock chart configurations for consistent styling across all charts
 */

export const STOCK_CHART_NAVIGATOR = {
  enabled: true,
  height: 40,
  margin: 10,
  maskFill: 'rgba(107, 114, 128, 0.1)',
  outlineColor: CHART_STYLES.colors.line,
  outlineWidth: 1,
  handles: {
    backgroundColor: CHART_STYLES.colors.background,
    borderColor: '#d1d5db'
  },
  xAxis: {
    gridLineColor: CHART_STYLES.colors.gridLine,
    labels: { style: { color: '#6b7280', fontSize: '11px' } }
  },
  series: { lineColor: '#6b7280', fillOpacity: 0.05 }
} as const;

export const STOCK_CHART_SCROLLBAR = {
  enabled: true,
  barBackgroundColor: CHART_STYLES.colors.gridLine,
  barBorderColor: CHART_STYLES.colors.line,
  buttonBackgroundColor: CHART_STYLES.colors.background,
  buttonBorderColor: '#d1d5db',
  rifleColor: '#6b7280',
  trackBackgroundColor: '#f9fafb',
  trackBorderColor: CHART_STYLES.colors.line
} as const;

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Get all unique dates from SIP XIRR data, sorted
 */
export const getAllDates = (sipStrategyXirrData: Record<string, any[]>): string[] => {
  const allDates = Object.values(sipStrategyXirrData).flatMap(arr =>
    Array.isArray(arr) ? arr.map(row => formatDate(row.date)) : []
  );
  return Array.from(new Set(allDates)).sort();
};

