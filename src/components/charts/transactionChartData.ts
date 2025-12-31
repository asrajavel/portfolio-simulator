import { Transaction } from '../../utils/calculations/sipRollingXirr/types';

export type ChartPoint = { date: Date; cumulativeInvestment: number; currentValue: number; isRebalance?: boolean; isAnnualAdjustment?: boolean };
export type FundSeries = { fundIdx: number; data: ChartPoint[] };

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Build chart-friendly data structures from raw transactions.
 * Handles buys/sells/rebalances/annual_adjustments per day and returns totals, per-fund data, and plotLines for adjustment days.
 */
export function buildTransactionChartData(transactions: Transaction[]) {
  let totalInvestment = 0;

  const fundDateMap = new Map<number, Map<string, ChartPoint>>();
  const fundInvestments = new Map<number, number>();
  const dateInvestmentMap = new Map<string, number>();
  const dateFundValueMap = new Map<string, { date: Date; perFund: Map<number, number> }>();
  const rebalanceDates = new Set<string>();
  const annualAdjustmentDates = new Set<string>();

  const chronologicalTxs = [...transactions].sort((a, b) => a.when.getTime() - b.when.getTime());

  for (const tx of chronologicalTxs) {
    const dateKey = formatDate(tx.when);

    if (tx.type === 'rebalance') rebalanceDates.add(dateKey);
    if (tx.type === 'annual_adjustment') annualAdjustmentDates.add(dateKey);

    // Buys add to investment. Rebalance/annual_adjustment can add (negative amount) or remove (positive amount).
    if (tx.type === 'buy') {
      const investAmount = Math.abs(tx.amount);
      totalInvestment += investAmount;
      fundInvestments.set(tx.fundIdx, (fundInvestments.get(tx.fundIdx) ?? 0) + investAmount);
    } else if (tx.type === 'rebalance' || tx.type === 'annual_adjustment') {
      const adjustmentFlow = tx.amount; // negative = buy, positive = sell
      const absFlow = Math.abs(adjustmentFlow);
      if (adjustmentFlow < 0) {
        totalInvestment += absFlow;
        fundInvestments.set(tx.fundIdx, (fundInvestments.get(tx.fundIdx) ?? 0) + absFlow);
      } else if (adjustmentFlow > 0) {
        totalInvestment = Math.max(0, totalInvestment - absFlow);
        fundInvestments.set(tx.fundIdx, Math.max(0, (fundInvestments.get(tx.fundIdx) ?? 0) - absFlow));
      }
    }

    // Track latest cumulative investment for the day
    dateInvestmentMap.set(dateKey, totalInvestment);

    // Capture per-fund value for the date (overwrite to avoid double-counting multiple tx on same day)
    const existingFundValues = dateFundValueMap.get(dateKey) ?? { date: tx.when, perFund: new Map<number, number>() };
    existingFundValues.date = tx.when;
    existingFundValues.perFund.set(tx.fundIdx, tx.currentValue);
    dateFundValueMap.set(dateKey, existingFundValues);

    // Per fund
    const perFundMap = fundDateMap.get(tx.fundIdx) ?? new Map<string, ChartPoint>();
    perFundMap.set(dateKey, {
      date: tx.when,
      cumulativeInvestment: fundInvestments.get(tx.fundIdx) ?? 0,
      currentValue: tx.currentValue // latest value for the day
    });
    fundDateMap.set(tx.fundIdx, perFundMap);
  }

  // Build totals from per-day fund values (summing latest values per fund for that date)
  const totals: ChartPoint[] = Array.from(dateFundValueMap.entries())
    .map(([dateKey, { date, perFund }]) => ({
      date,
      cumulativeInvestment: dateInvestmentMap.get(dateKey) ?? totalInvestment,
      currentValue: Array.from(perFund.values()).reduce((sum, val) => sum + val, 0),
      isRebalance: rebalanceDates.has(dateKey),
      isAnnualAdjustment: annualAdjustmentDates.has(dateKey)
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const perFund: FundSeries[] = Array.from(fundDateMap.entries()).map(([fundIdx, map]) => ({
    fundIdx,
    data: Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }));

  // Build vertical lines for rebalance and annual adjustment days to keep visible when zoomed out
  const rebalancePlotLines = (() => {
    const lines: any[] = [];
    const seen = new Set<number>();
    totals.forEach(d => {
      const x = d.date.getTime();
      if (seen.has(x)) return;
      
      if (d.isRebalance) {
        seen.add(x);
        lines.push({
          value: x,
          color: '#9CA3AF',
          width: 1,
          dashStyle: 'ShortDot',
          zIndex: 3
        });
      } else if (d.isAnnualAdjustment) {
        seen.add(x);
        lines.push({
          value: x,
          color: '#F59E0B', // Orange for annual adjustments
          width: 1,
          dashStyle: 'Dash',
          zIndex: 3
        });
      }
    });
    return lines;
  })();

  return { totals, perFund, rebalancePlotLines };
}

