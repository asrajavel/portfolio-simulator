import React, { useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
import { Button, KIND, SIZE } from 'baseui/button';
import { ComputedGoalData } from '../../types/tracker';
import { formatNumber } from '../../utils/numberFormat';

interface SummaryTransactionTableProps {
  goalNames: string[];
  cache: Record<number, ComputedGoalData>;
}

const MAX_ALL_DAYS_ROWS = 500;

const right: React.CSSProperties = { textAlign: 'right', display: 'block' };

const formatDate = (dateKey: string): string => {
  const d = new Date(dateKey);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const SummaryTransactionTable: React.FC<SummaryTransactionTableProps> = ({
  goalNames,
  cache,
}) => {
  const [showAllDays, setShowAllDays] = useState(false);

  // Per-goal snapshot maps keyed by date string
  const goalDateMaps = useMemo(
    () =>
      goalNames.map((_, idx) => {
        const map = new Map<string, { totalInv: number; totalValue: number }>();
        for (const snap of cache[idx]?.dailySnapshots ?? []) {
          map.set(toDateKey(snap.date), { totalInv: snap.totalInv, totalValue: snap.totalValue });
        }
        return map;
      }),
    [goalNames, cache],
  );

  // Dates where any holding in any goal had a buy
  const transactionDateKeys = useMemo(() => {
    const keys = new Set<string>();
    goalNames.forEach((_, idx) => {
      for (const series of Object.values(cache[idx]?.holdingTimeSeries ?? {})) {
        for (const snap of series) {
          if (snap.todayInv > 0) keys.add(toDateKey(snap.date));
        }
      }
    });
    return keys;
  }, [goalNames, cache]);

  // All unique dates across all goals, sorted descending
  const allDateKeys = useMemo(() => {
    const keys = new Set<string>();
    goalDateMaps.forEach((map) => map.forEach((_, k) => keys.add(k)));
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [goalDateMaps]);

  const filteredDateKeys = useMemo(() => {
    if (showAllDays) return allDateKeys.slice(0, MAX_ALL_DAYS_ROWS);
    return allDateKeys.filter((k) => transactionDateKeys.has(k));
  }, [allDateKeys, showAllDays, transactionDateKeys]);

  const isCapped = showAllDays && allDateKeys.length > MAX_ALL_DAYS_ROWS;

  const columns = useMemo(
    () => ['Date', 'Invested', 'Total Value', ...goalNames],
    [goalNames],
  );

  const tableData = useMemo(
    () =>
      filteredDateKeys.map((dateKey) => {
        const isTxnDay = transactionDateKeys.has(dateKey);
        const goalSnaps = goalDateMaps.map((map) => map.get(dateKey));
        const totalInv = goalSnaps.reduce((sum, s) => sum + (s?.totalInv ?? 0), 0);
        const totalValue = goalSnaps.reduce((sum, s) => sum + (s?.totalValue ?? 0), 0);

        return [
          <span key="d" style={{ fontWeight: isTxnDay ? 600 : 400 }}>
            {formatDate(dateKey)}
            {isTxnDay && <span style={{ marginLeft: 6, fontSize: 10, color: '#007bff' }}>●</span>}
          </span>,
          <span key="i" style={right}>{formatNumber(Math.round(totalInv))}</span>,
          <span key="v" style={{ ...right, fontWeight: isTxnDay ? 600 : 400 }}>
            {formatNumber(Math.round(totalValue))}
          </span>,
          ...goalSnaps.map((s, idx) => (
            <span key={idx} style={right}>
              {formatNumber(Math.round(s?.totalValue ?? 0))}
            </span>
          )),
        ];
      }),
    [filteredDateKeys, transactionDateKeys, goalDateMaps],
  );

  return (
    <Block>
      <Block
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        paddingLeft="scale400"
        paddingRight="scale400"
        paddingTop="scale300"
        paddingBottom="scale300"
      >
        <HeadingXSmall marginTop="0" marginBottom="0">
          {showAllDays ? 'All Days' : 'Transaction Days'}
        </HeadingXSmall>
        <Button
          size={SIZE.mini}
          kind={KIND.secondary}
          onClick={() => setShowAllDays((v) => !v)}
        >
          {showAllDays ? 'Show Transaction Days Only' : 'Show All Days'}
        </Button>
      </Block>

      {isCapped && (
        <Block paddingLeft="scale400" paddingBottom="scale200">
          <LabelSmall color="contentSecondary">
            Showing latest {MAX_ALL_DAYS_ROWS} of {allDateKeys.length} days
          </LabelSmall>
        </Block>
      )}

      {filteredDateKeys.length === 0 ? (
        <Block padding="scale600">
          <LabelSmall color="contentSecondary">No transactions found.</LabelSmall>
        </Block>
      ) : (
        <Block overrides={{ Block: { style: { overflowX: 'auto' } } }}>
          <Table columns={columns} data={tableData} divider="grid" size="compact" />
        </Block>
      )}
    </Block>
  );
};
