import React, { useMemo, useState } from 'react';
import { Block } from 'baseui/block';
import { LabelSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
import { Select } from 'baseui/select';
import { DailyGoalSnapshot, DailyHoldingSnapshot } from '../../types/tracker';
import { formatNumber } from '../../utils/numberFormat';

interface TransactionTableProps {
  dailySnapshots: DailyGoalSnapshot[];
  holdingTimeSeries: Record<string, DailyHoldingSnapshot[]>;
  holdingNames: string[];
}

const MAX_ALL_DAYS_ROWS = 500;

type ViewMode = 'monthly' | 'transactions' | 'daily';
const VIEW_OPTIONS = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'transactions', label: 'Transaction Days' },
  { id: 'daily', label: 'Daily' },
];

const right: React.CSSProperties = { textAlign: 'right', display: 'block' };
const deltaColor = (v: number): string => (Math.round(v) >= 0 ? '#048a04' : '#d32f2f');
const monthRowStyle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.85em', color: '#555',
  display: 'block', background: '#f0f0f0',
  margin: '-8px -12px', padding: '8px 12px',
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const formatXirr = (v: number): string =>
  isNaN(v) || !isFinite(v) ? 'N/A' : `${(v * 100).toFixed(2)}%`;

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);
const toMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

const formatDelta = (v: number): string => {
  const rounded = Math.round(v);
  return rounded >= 0 ? `+${formatNumber(rounded)}` : `−${formatNumber(Math.abs(rounded))}`;
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  dailySnapshots,
  holdingTimeSeries,
  holdingNames,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  const todayInvLookup = useMemo(() => {
    const lookup: Record<string, Record<string, number>> = {};
    for (const name of holdingNames) {
      for (const snap of holdingTimeSeries[name] ?? []) {
        if (snap.todayInv !== 0) {
          const dk = toDateKey(snap.date);
          if (!lookup[dk]) lookup[dk] = {};
          lookup[dk][name] = snap.todayInv;
        }
      }
    }
    return lookup;
  }, [holdingNames, holdingTimeSeries]);

  const transactionDateKeys = useMemo(
    () => new Set(Object.keys(todayInvLookup)),
    [todayInvLookup],
  );

  const filteredSnapshots = useMemo(() => {
    const reversed = [...dailySnapshots].reverse();
    if (viewMode === 'daily') return reversed.slice(0, MAX_ALL_DAYS_ROWS);
    if (viewMode === 'monthly') return [];
    return reversed.filter((s) => transactionDateKeys.has(toDateKey(s.date)));
  }, [dailySnapshots, viewMode, transactionDateKeys]);

  const isCapped = viewMode === 'daily' && dailySnapshots.length > MAX_ALL_DAYS_ROWS;

  const columns = useMemo(
    () => ['Date', 'Invested', 'Value', 'XIRR', ...holdingNames],
    [holdingNames],
  );

  const tableData = useMemo(() => {
    const rows: React.ReactNode[][] = [];
    let lastMonth = '';

    if (viewMode === 'monthly') {
      const reversed = [...dailySnapshots].reverse();
      const months: string[] = [];
      const seen = new Set<string>();
      for (const s of reversed) {
        const m = toMonthKey(s.date);
        if (!seen.has(m)) { seen.add(m); months.push(m); }
      }
      for (const month of months) {
        const monthPerHolding: Record<string, number> = {};
        let monthTotal = 0;
        for (const snap of dailySnapshots) {
          if (toMonthKey(snap.date) !== month) continue;
          const di = todayInvLookup[toDateKey(snap.date)];
          if (di) {
            for (const [name, val] of Object.entries(di)) {
              monthPerHolding[name] = (monthPerHolding[name] ?? 0) + val;
            }
            monthTotal += Object.values(di).reduce((a, b) => a + b, 0);
          }
        }
        const monthLabel = new Date(month + '-15').toLocaleDateString('en-IN', {
          month: 'long', year: 'numeric',
        });
        rows.push([
          <span key="m" style={monthRowStyle}>{monthLabel}</span>,
          <span key="mi" style={{ ...right, ...monthRowStyle }}>
            {monthTotal !== 0 ? formatDelta(monthTotal) : ' '}
          </span>,
          <span key="mv" style={{ ...right, ...monthRowStyle }}>{' '}</span>,
          <span key="mx" style={{ ...right, ...monthRowStyle }}>{' '}</span>,
          ...holdingNames.map((name) => {
            const val = monthPerHolding[name] ?? 0;
            return (
              <span key={name} style={{ ...right, ...monthRowStyle }}>
                {val !== 0 ? formatDelta(val) : ' '}
              </span>
            );
          }),
        ]);
      }
      return rows;
    }

    for (const s of filteredSnapshots) {
      const dk = toDateKey(s.date);
      const month = toMonthKey(s.date);

      if (month !== lastMonth) {
        lastMonth = month;
        const monthSnaps = filteredSnapshots.filter((snap) => toMonthKey(snap.date) === month);
        const monthPerHolding: Record<string, number> = {};
        let monthTotal = 0;
        for (const snap of monthSnaps) {
          const di = todayInvLookup[toDateKey(snap.date)];
          if (di) {
            for (const [name, val] of Object.entries(di)) {
              monthPerHolding[name] = (monthPerHolding[name] ?? 0) + val;
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
          <span key="mx" style={{ ...right, ...monthRowStyle }}>{' '}</span>,
          ...holdingNames.map((name) => {
            const val = monthPerHolding[name] ?? 0;
            return (
              <span key={name} style={{ ...right, ...monthRowStyle }}>
                {val !== 0 ? formatDelta(val) : ' '}
              </span>
            );
          }),
        ]);
      }

      const isTxnDay = transactionDateKeys.has(dk);
      const dayInvestments = todayInvLookup[dk];

      rows.push([
        <span key="d" style={{ fontWeight: isTxnDay ? 600 : 400 }}>
          {formatDate(s.date)}
          {isTxnDay && <span style={{ marginLeft: 6, fontSize: 10, color: '#007bff' }}>●</span>}
        </span>,
        <span key="i" style={right}>
          {formatNumber(Math.round(s.totalInv))}
        </span>,
        <span key="v" style={{ ...right, fontWeight: isTxnDay ? 600 : 400 }}>
          {formatNumber(Math.round(s.totalValue))}
        </span>,
        <span key="x" style={{ ...right, fontWeight: 600 }}>
          {formatXirr(s.xirr)}
        </span>,
        ...holdingNames.map((name) => {
          const holdingDayInv = dayInvestments?.[name] ?? 0;
          return (
            <span key={name} style={right}>
              {formatNumber(Math.round(s.holdingValues[name] ?? 0))}
              {holdingDayInv !== 0 && (
                <><br /><span style={{ fontSize: '0.8em', fontWeight: 400, color: deltaColor(holdingDayInv) }}>{formatDelta(holdingDayInv)}</span></>
              )}
            </span>
          );
        }),
      ]);
    }

    return rows;
  }, [filteredSnapshots, transactionDateKeys, holdingNames, todayInvLookup, viewMode, dailySnapshots]);

  return (
    <Block>
      <Block
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        paddingLeft="scale400"
        paddingRight="scale400"
        paddingTop="scale300"
        paddingBottom="scale300"
      >
        <Block width="200px">
          <Select
            size="mini"
            clearable={false}
            searchable={false}
            options={VIEW_OPTIONS}
            value={[{ id: viewMode }]}
            onChange={({ value }) => setViewMode(value[0].id as ViewMode)}
          />
        </Block>
      </Block>

      {isCapped && (
        <Block paddingLeft="scale400" paddingBottom="scale200">
          <LabelSmall color="contentSecondary">
            Showing latest {MAX_ALL_DAYS_ROWS} of {dailySnapshots.length} days
          </LabelSmall>
        </Block>
      )}

      {tableData.length === 0 ? (
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
