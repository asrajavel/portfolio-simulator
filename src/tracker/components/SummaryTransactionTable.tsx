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
const deltaColor = (v: number): string => (Math.round(v) >= 0 ? '#048a04' : '#d32f2f');
const monthRowStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.85em', color: '#555',
  display: 'block', background: '#f0f0f0',
  margin: '-8px -12px', padding: '8px 12px',
};

const formatDate = (dateKey: string): string => {
  const d = new Date(dateKey);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const toMonthKey = (dateKey: string): string => dateKey.slice(0, 7);

const formatDelta = (v: number): string => {
  const rounded = Math.round(v);
  return rounded >= 0 ? `+${formatNumber(rounded)}` : `−${formatNumber(Math.abs(rounded))}`;
};

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

  // Per-date, per-goal investment amounts
  const dayInvLookup = useMemo(() => {
    const lookup: Record<string, Record<number, number>> = {};
    goalNames.forEach((_, idx) => {
      for (const series of Object.values(cache[idx]?.holdingTimeSeries ?? {})) {
        for (const snap of series) {
          if (snap.todayInv !== 0) {
            const dk = toDateKey(snap.date);
            if (!lookup[dk]) lookup[dk] = {};
            lookup[dk][idx] = (lookup[dk][idx] ?? 0) + snap.todayInv;
          }
        }
      }
    });
    return lookup;
  }, [goalNames, cache]);

  const transactionDateKeys = useMemo(
    () => new Set(Object.keys(dayInvLookup)),
    [dayInvLookup],
  );

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

  const tableData = useMemo(() => {
    const rows: React.ReactNode[][] = [];
    let lastMonth = '';

    for (const dateKey of filteredDateKeys) {
      const month = toMonthKey(dateKey);
      if (month !== lastMonth) {
        lastMonth = month;
        const monthDates = filteredDateKeys.filter((dk) => toMonthKey(dk) === month);
        const monthPerGoal: Record<number, number> = {};
        let monthTotal = 0;
        for (const dk of monthDates) {
          const di = dayInvLookup[dk];
          if (di) {
            for (const [idx, val] of Object.entries(di)) {
              monthPerGoal[+idx] = (monthPerGoal[+idx] ?? 0) + val;
            }
            monthTotal += Object.values(di).reduce((a, b) => a + b, 0);
          }
        }
        const monthLabel = new Date(month + '-15').toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
        });
        rows.push([
          <span key="m" style={monthRowStyle}>{monthLabel}</span>,
          <span key="mi" style={{ ...right, ...monthRowStyle }}>
            {monthTotal !== 0 ? formatDelta(monthTotal) : ' '}
          </span>,
          <span key="mv" style={{ ...right, ...monthRowStyle }}>{' '}</span>,
          ...goalNames.map((_, idx) => {
            const val = monthPerGoal[idx] ?? 0;
            return (
              <span key={idx} style={{ ...right, ...monthRowStyle }}>
                {val !== 0 ? formatDelta(val) : ' '}
              </span>
            );
          }),
        ]);
      }

      const isTxnDay = transactionDateKeys.has(dateKey);
      const goalSnaps = goalDateMaps.map((map) => map.get(dateKey));
      const totalInv = goalSnaps.reduce((sum, s) => sum + (s?.totalInv ?? 0), 0);
      const totalValue = goalSnaps.reduce((sum, s) => sum + (s?.totalValue ?? 0), 0);
      const dayInvestments = dayInvLookup[dateKey];

      rows.push([
        <span key="d" style={{ fontWeight: isTxnDay ? 600 : 400 }}>
          {formatDate(dateKey)}
          {isTxnDay && <span style={{ marginLeft: 6, fontSize: 10, color: '#007bff' }}>●</span>}
        </span>,
        <span key="i" style={right}>
          {formatNumber(Math.round(totalInv))}
        </span>,
        <span key="v" style={{ ...right, fontWeight: isTxnDay ? 600 : 400 }}>
          {formatNumber(Math.round(totalValue))}
        </span>,
        ...goalSnaps.map((s, idx) => {
          const goalDayInv = dayInvestments?.[idx] ?? 0;
          return (
            <span key={idx} style={right}>
              {formatNumber(Math.round(s?.totalValue ?? 0))}
              {goalDayInv !== 0 && (
                <><br /><span style={{ fontSize: '0.8em', fontWeight: 400, color: deltaColor(goalDayInv) }}>{formatDelta(goalDayInv)}</span></>
              )}
            </span>
          );
        }),
      ]);
    }

    return rows;
  }, [filteredDateKeys, transactionDateKeys, goalDateMaps, dayInvLookup, goalNames.length]);

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
        <Table
            columns={columns}
            data={tableData}
            divider="grid"
            size="compact"
            overrides={{
              Root: { style: { maxHeight: '70vh', overflow: 'auto' } },
              TableHeadCell: { style: { position: 'sticky', top: '0', zIndex: 1, backgroundColor: '#fff' } },
              TableBodyRow: { style: { ':hover': { backgroundColor: 'unset' } } },
            }}
          />
      )}
    </Block>
  );
};
