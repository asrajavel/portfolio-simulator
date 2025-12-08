import React from 'react';
import {
  StatefulDataTable,
  StringColumn,
  CategoricalColumn,
  NumericalColumn,
} from "baseui/data-table";
import { Modal, ModalHeader, ModalBody, SIZE } from 'baseui/modal';
import { HeadingSmall, LabelMedium, LabelLarge } from 'baseui/typography';
import { Block } from 'baseui/block';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: { 
    fundIdx: number; 
    nav: number; 
    when: Date; 
    units: number; 
    amount: number; 
    type: 'buy' | 'sell' | 'rebalance' | 'nil'; 
    cumulativeUnits: number; 
    currentValue: number; 
    allocationPercentage?: number 
  }[];
  date: string;
  xirr: number;
  strategyName: string;
  funds: Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' | 'yahoo_finance' | 'fixed_return' }>;
  sipAmount: number;
}

type TransactionRowDataT = [string, string, string, number, number, number, number, number, string];

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  visible, 
  onClose, 
  transactions, 
  date, 
  xirr, 
  strategyName, 
  funds 
}) => {
  // Sort transactions
  const typeOrder = { buy: 0, rebalance: 1, sell: 2, nil: 3 };
  const transactionTypeDisplay = {
    buy: 'Buy',
    sell: 'Sell',
    rebalance: 'Rebalance',
    nil: 'Nil'
  };
  
  const sortedTxs = [...transactions].sort((a, b) => {
    const dateA = a.when.getTime();
    const dateB = b.when.getTime();
    if (dateA !== dateB) return dateA - dateB;

    const typeAOrder = typeOrder[a.type];
    const typeBOrder = typeOrder[b.type];
    if (typeAOrder !== typeBOrder) return typeAOrder - typeBOrder;

    const fundA = funds[a.fundIdx]?.schemeName || `Fund ${a.fundIdx + 1}`;
    const fundB = funds[b.fundIdx]?.schemeName || `Fund ${b.fundIdx + 1}`;
    return fundA.localeCompare(fundB);
  });

  // Convert to table rows
  const rows = sortedTxs.map((tx, idx) => {
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
  });

  // Formatters
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

  // Define columns
  const columns = [
    StringColumn({
      title: "Fund",
      mapDataToValue: (data: TransactionRowDataT) => data[0],
    }),
    CategoricalColumn({
      title: "Type",
      mapDataToValue: (data: TransactionRowDataT) => data[1],
    }),
    StringColumn({
      title: "Date",
      mapDataToValue: (data: TransactionRowDataT) => data[2],
    }),
    NumericalColumn({
      title: "NAV",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[3],
    }),
    NumericalColumn({
      title: "Units",
      format: formatUnits,
      mapDataToValue: (data: TransactionRowDataT) => data[4],
    }),
    NumericalColumn({
      title: "Amount",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[5],
    }),
    NumericalColumn({
      title: "Cumulative Units",
      format: formatUnits,
      mapDataToValue: (data: TransactionRowDataT) => data[6],
    }),
    NumericalColumn({
      title: "Current Value",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[7],
    }),
    StringColumn({
      title: "Allocation %",
      mapDataToValue: (data: TransactionRowDataT) => data[8],
    }),
  ];

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
        <HeadingSmall margin={0}>
          {strategyName} - {date}
        </HeadingSmall>
      </ModalHeader>
      
      <ModalBody>
        {/* XIRR Info */}
        <Block marginBottom="scale800">
          <LabelMedium>
            XIRR: <LabelLarge as="span" $style={{ fontWeight: 600 }}>{(xirr * 100).toFixed(2)}%</LabelLarge>
          </LabelMedium>
        </Block>
        
        {/* Table */}
        <Block height="500px">
          <StatefulDataTable
            columns={columns}
            rows={rows}
            emptyMessage="No transactions to display"
            loadingMessage="Loading..."
            searchable={false}
            filterable={false}
          />
        </Block>
      </ModalBody>
    </Modal>
  );
};
