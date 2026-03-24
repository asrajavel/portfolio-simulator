import { useState, useEffect, useMemo } from 'react';
import { inflationService } from '../services/inflationService';

export type InflationSource = 'cpi' | 'custom';

export interface YearlyValue {
  year: number;
  value: number;
}

const CUSTOM_START_YEAR = 1950;
const CUSTOM_END_YEAR = 2050;

export function useInflationCalculator(
  source: InflationSource,
  customRate: number,
  amount: number,
  selectedYear: number
) {
  const [cpiRates, setCpiRates] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (source !== 'cpi') return;
    let cancelled = false;
    setLoading(true);
    inflationService.fetchInflationRates('IND').then(rates => {
      if (!cancelled) {
        setCpiRates(rates);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [source]);

  const yearRange = useMemo<{ start: number; end: number }>(() => {
    if (source === 'custom') {
      return { start: CUSTOM_START_YEAR, end: CUSTOM_END_YEAR };
    }
    if (cpiRates.size === 0) return { start: 1960, end: new Date().getFullYear() };
    const years = Array.from(cpiRates.keys()).sort((a, b) => a - b);
    return { start: years[0], end: years[years.length - 1] };
  }, [source, cpiRates]);

  const data = useMemo<YearlyValue[]>(() => {
    if (source === 'cpi' && cpiRates.size === 0) return [];
    if (amount <= 0) return [];

    const { start, end } = yearRange;
    const result: YearlyValue[] = [];

    if (source === 'custom') {
      for (let y = start; y <= end; y++) {
        result.push({
          year: y,
          value: amount * Math.pow(1 + customRate / 100, y - selectedYear),
        });
      }
    } else {
      const anchorIdx = selectedYear - start;
      const values = new Array(end - start + 1);
      values[anchorIdx] = amount;

      for (let i = anchorIdx + 1; i < values.length; i++) {
        const y = start + i;
        const rate = cpiRates.get(y) ?? 0;
        values[i] = values[i - 1] * (1 + rate / 100);
      }
      for (let i = anchorIdx - 1; i >= 0; i--) {
        const y = start + i + 1;
        const rate = cpiRates.get(y) ?? 0;
        values[i] = values[i + 1] / (1 + rate / 100);
      }

      for (let i = 0; i < values.length; i++) {
        result.push({ year: start + i, value: values[i] });
      }
    }

    return result;
  }, [source, cpiRates, amount, selectedYear, customRate, yearRange]);

  return { data, loading, yearRange };
}
