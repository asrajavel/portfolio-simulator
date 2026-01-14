import React, { useState } from 'react';
import {
  StatefulDataTable,
  StringColumn,
  CategoricalColumn,
  NumericalColumn,
} from "baseui/data-table";
import { Modal, ModalHeader, ModalBody, SIZE } from 'baseui/modal';
import { HeadingSmall, LabelMedium, LabelLarge } from 'baseui/typography';
import { Block } from 'baseui/block';
import { Checkbox } from 'baseui/checkbox';
import { TransactionChart } from '../charts/TransactionChart';
import { Transaction } from '../../utils/calculations/sipRollingXirr/types';
import { AssetType } from '../../types/asset';
import { COLORS } from '../../constants';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
  date: string;
  xirr: number;
  portfolioName: string;
  funds: Array<{ schemeName: string; type: AssetType }>;
  chartView: 'xirr' | 'corpus';
}

type TransactionRowDataT = [string, string, string, number, number, number, number, number, string];

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  visible, 
  onClose, 
  transactions, 
  date, 
  xirr, 
  portfolioName, 
  funds,
  chartView,
}) => {
  const [excludeNilTransactions, setExcludeNilTransactions] = useState(true);

  // Extract portfolio color
  const portfolioIdx = parseInt(portfolioName.replace('Portfolio ', '')) - 1;
  const portfolioColor = COLORS[portfolioIdx % COLORS.length];

  // Both SIP and Lumpsum now return the same transaction format
  const isDetailedTransaction = (tx: any): tx is Transaction => {
    return 'type' in tx && 'fundIdx' in tx;
  };
  const hasDetailedTransactions = transactions.length > 0 && isDetailedTransaction(transactions[0]);

  const typeOrder = { buy: 0, sell: 1, rebalance: 2, nil: 3 };
  const transactionTypeDisplay = {
    buy: 'Buy',
    sell: 'Sell',
    rebalance: 'Rebalance',
    nil: 'Nil'
  };
  
  // Sort transactions
  const sortedTxs = hasDetailedTransactions
    ? [...(transactions as Transaction[])].sort((a, b) => {
        const dateA = a.when.getTime();
        const dateB = b.when.getTime();
        if (dateA !== dateB) return dateA - dateB;

        const typeAOrder = typeOrder[a.type];
        const typeBOrder = typeOrder[b.type];
        if (typeAOrder !== typeBOrder) return typeAOrder - typeBOrder;

        const fundA = funds[a.fundIdx]?.schemeName || `Fund ${a.fundIdx + 1}`;
        const fundB = funds[b.fundIdx]?.schemeName || `Fund ${b.fundIdx + 1}`;
        return fundA.localeCompare(fundB);
      })
    : [...transactions].sort((a, b) => a.when.getTime() - b.when.getTime());

  // Filter nil transactions if checkbox is checked
  const filteredTxs = hasDetailedTransactions && excludeNilTransactions
    ? (sortedTxs as Transaction[]).filter(tx => tx.type !== 'nil')
    : sortedTxs;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatUnits = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(num);
  };

  // Columns for all detailed transactions (both SIP and Lumpsum)
  const columns = [
    StringColumn({
      title: "Asset",
      mapDataToValue: (data: TransactionRowDataT) => data[0],
    }),
    CategoricalColumn({
      title: "Action",
      mapDataToValue: (data: TransactionRowDataT) => data[1],
    }),
    StringColumn({
      title: "Date",
      mapDataToValue: (data: TransactionRowDataT) => data[2],
    }),
    NumericalColumn({
      title: "NAV / Price",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[3],
    }),
    NumericalColumn({
      title: "Units / Qty",
      format: formatUnits,
      mapDataToValue: (data: TransactionRowDataT) => data[4],
    }),
    NumericalColumn({
      title: "Cash Flow",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[5],
    }),
    NumericalColumn({
      title: "Total Units / Qty",
      format: formatUnits,
      mapDataToValue: (data: TransactionRowDataT) => data[6],
    }),
    NumericalColumn({
      title: "Value",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[7],
    }),
    StringColumn({
      title: "Allocation %",
      mapDataToValue: (data: TransactionRowDataT) => data[8],
    }),
  ];

  const rows = hasDetailedTransactions
    ? (filteredTxs as Transaction[]).map((tx, idx) => {
        const fundName = funds[tx.fundIdx]?.schemeName || `Fund ${tx.fundIdx + 1}`;
        const allocationText = tx.allocationPercentage !== undefined 
          ? `${tx.allocationPercentage.toFixed(2)}%` 
          : '';
        
        return {
          id: String(idx),
          data: [
            fundName,
            transactionTypeDisplay[tx.type] || '',
            formatDate(tx.when),
            tx.nav,
            tx.units,
            tx.amount,
            tx.cumulativeUnits,
            tx.currentValue,
            allocationText,
          ] as TransactionRowDataT,
        };
      })
    : [];

  return (
    <Modal
      onClose={onClose}
      isOpen={visible}
      size={SIZE.auto}
      overrides={{
        Dialog: {
          style: {
            width: '95vw',
            maxWidth: '1400px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }
        }
      }}
    >
      <ModalHeader>
        <Block display="flex" alignItems="stretch" gridGap="scale400">
          <Block
            $style={{
              width: '4px',
              backgroundColor: portfolioColor,
              borderRadius: '2px',
            }}
          />
          <Block>
            <HeadingSmall margin={0}>
              {portfolioName} - Simulation ending on: {date}
            </HeadingSmall>
            <LabelMedium $style={{ color: '#6b7280', marginTop: '4px' }}>
              XIRR: {(xirr * 100).toFixed(2)}%
            </LabelMedium>
          </Block>
        </Block>
      </ModalHeader>
      
      <ModalBody>
        <Block $style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 150px)' }}>
          {/* Controls row */}
          <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale600">
            {/* Checkbox to exclude nil transactions */}
            {hasDetailedTransactions && (
              <Checkbox
                checked={excludeNilTransactions}
                onChange={e => setExcludeNilTransactions(e.currentTarget.checked)}
              >
                Exclude Non-Transaction Days
              </Checkbox>
            )}
            
            {/* XIRR mode note */}
            {chartView === 'xirr' && (
              <LabelMedium $style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '12px' }}>
                Note: ₹100 is used for simulation purposes.
              </LabelMedium>
            )}
          </Block>

          {/* Table */}
          <Block height="500px" marginBottom="scale800">
            <StatefulDataTable
              columns={columns}
              rows={rows}
              emptyMessage="No transactions to display"
              loadingMessage="Loading..."
              searchable={false}
              filterable={false}
            />
          </Block>

          {/* Chart - Investment vs Value */}
          {hasDetailedTransactions && (
            <TransactionChart 
              transactions={transactions as Transaction[]} 
              portfolioName={portfolioName}
              funds={funds}
            />
          )}
        </Block>
      </ModalBody>
    </Modal>
  );
};
