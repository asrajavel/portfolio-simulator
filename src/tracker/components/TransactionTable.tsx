import React, { useMemo, useState } from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall } from 'baseui/typography';
import { Table } from 'baseui/table-semantic';
import { Button, KIND, SIZE } from 'baseui/button';
import { DailyGoalSnapshot, DailyHoldingSnapshot } from '../../types/tracker';
import { formatNumber } from '../../utils/numberFormat';

interface TransactionTableProps {
  dailySnapshots: DailyGoalSnapshot[];
  holdingTimeSeries: Record<string, DailyHoldingSnapshot[]>;
  holdingNames: string[];
}

const MAX_ALL_DAYS_ROWS = 500;

const right: React.CSSProperties = { textAlign: 'right', display: 'block' };

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const formatXirr = (v: number): string =>
  isNaN(v) || !isFinite(v) ? 'N/A' : `${(v * 100).toFixed(2)}%`;

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const TransactionTable: React.FC<TransactionTableProps> = ({
  dailySnapshots,
  holdingTimeSeries,
  holdingNames,
}) => {
  const [, theme] = useStyletron();
  const [showAllDays, setShowAllDays] = useState(false);

  const transactionDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const name of holdingNames) {
      for (const snap of holdingTimeSeries[name] ?? []) {
        if (snap.todayInv > 0) keys.add(toDateKey(snap.date));
      }
    }
    return keys;
  }, [holdingNames, holdingTimeSeries]);

  const filteredSnapshots = useMemo(() => {
    const reversed = [...dailySnapshots].reverse();
    if (showAllDays) return reversed.slice(0, MAX_ALL_DAYS_ROWS);
    return reversed.filter((s) => transactionDateKeys.has(toDateKey(s.date)));
  }, [dailySnapshots, showAllDays, transactionDateKeys]);

  const isCapped = showAllDays && dailySnapshots.length > MAX_ALL_DAYS_ROWS;

  const columns = useMemo(
    () => ['Date', 'Invested', 'Value', 'XIRR', ...holdingNames],
    [holdingNames],
  );

  const tableData = useMemo(() => {
    const positiveColor = theme.colors.positive;
    const negativeColor = theme.colors.negative;

    return filteredSnapshots.map((s) => {
      const isTxnDay = transactionDateKeys.has(toDateKey(s.date));
      const xirrColor = isNaN(s.xirr) || !isFinite(s.xirr)
        ? undefined
        : s.xirr >= 0 ? positiveColor : negativeColor;

      return [
        <span key="d" style={{ fontWeight: isTxnDay ? 600 : 400 }}>
          {formatDate(s.date)}
          {isTxnDay && <span style={{ marginLeft: 6, fontSize: 10, color: '#007bff' }}>●</span>}
        </span>,
        <span key="i" style={right}>{formatNumber(Math.round(s.totalInv))}</span>,
        <span key="v" style={{ ...right, fontWeight: isTxnDay ? 600 : 400 }}>
          {formatNumber(Math.round(s.totalValue))}
        </span>,
        <span key="x" style={{ ...right, color: xirrColor, fontWeight: 600 }}>
          {formatXirr(s.xirr)}
        </span>,
        ...holdingNames.map((name) => (
          <span key={name} style={right}>
            {formatNumber(Math.round(s.holdingValues[name] ?? 0))}
          </span>
        )),
      ];
    });
  }, [filteredSnapshots, transactionDateKeys, holdingNames, theme.colors]);

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
            Showing latest {MAX_ALL_DAYS_ROWS} of {dailySnapshots.length} days
          </LabelSmall>
        </Block>
      )}

      {filteredSnapshots.length === 0 ? (
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
