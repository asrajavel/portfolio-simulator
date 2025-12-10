import { Transaction } from '../../utils/calculations/sipRollingXirr/types';

export type ChartPoint = { date: Date; cumulativeInvestment: number; currentValue: number; isRebalance?: boolean };
export type FundSeries = { fundIdx: number; data: ChartPoint[] };

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Build chart-friendly data structures from raw transactions.
 * Handles buys/sells/rebalances per day and returns totals, per-fund data, and plotLines for rebalance days.
 */
export function buildTransactionChartData(transactions: Transaction[]) {
  let totalInvestment = 0;

  const fundDateMap = new Map<number, Map<string, ChartPoint>>();
  const fundInvestments = new Map<number, number>();
  const dateInvestmentMap = new Map<string, number>();
  const dateFundValueMap = new Map<string, { date: Date; perFund: Map<number, number> }>();
  const rebalanceDates = new Set<string>();

  const chronologicalTxs = [...transactions].sort((a, b) => a.when.getTime() - b.when.getTime());

  for (const tx of chronologicalTxs) {
    const dateKey = formatDate(tx.when);

    if (tx.type === 'rebalance') rebalanceDates.add(dateKey);

    // Buys add to investment. Rebalance can add (negative amount) or remove (positive amount).
    if (tx.type === 'buy') {
      const investAmount = Math.abs(tx.amount);
      totalInvestment += investAmount;
      fundInvestments.set(tx.fundIdx, (fundInvestments.get(tx.fundIdx) ?? 0) + investAmount);
    } else if (tx.type === 'rebalance') {
      const rebalanceFlow = tx.amount; // negative = buy, positive = sell
      const absFlow = Math.abs(rebalanceFlow);
      if (rebalanceFlow < 0) {
        totalInvestment += absFlow;
        fundInvestments.set(tx.fundIdx, (fundInvestments.get(tx.fundIdx) ?? 0) + absFlow);
      } else if (rebalanceFlow > 0) {
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
      isRebalance: rebalanceDates.has(dateKey)
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const perFund: FundSeries[] = Array.from(fundDateMap.entries()).map(([fundIdx, map]) => ({
    fundIdx,
    data: Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
  }));

  // Build vertical lines for rebalance days to keep visible when zoomed out
  const rebalancePlotLines = (() => {
    const lines: any[] = [];
    const seen = new Set<number>();
    totals.forEach(d => {
      if (!d.isRebalance) return;
      const x = d.date.getTime();
      if (seen.has(x)) return;
      seen.add(x);
      lines.push({
        value: x,
        color: '#9CA3AF',
        width: 1,
        dashStyle: 'ShortDot',
        zIndex: 3
      });
    });
    return lines;
  })();

  return { totals, perFund, rebalancePlotLines };
}

