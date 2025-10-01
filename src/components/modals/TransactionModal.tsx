import React, { useRef, useEffect } from 'react';
import {
  StatefulDataTable,
  StringColumn,
  CategoricalColumn,
  NumericalColumn,
  NUMERICAL_FORMATS,
} from "baseui/data-table";
import { useStyletron } from 'baseui';

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: { fundIdx: number; nav: number; when: Date; units: number; amount: number; type: 'buy' | 'sell'; allocationPercentage?: number }[];
  date: string;
  xirr: number;
  portfolioName: string;
  funds: Array<{ schemeName: string; type: 'mutual_fund' | 'index_fund' }>;
}

// Define the row data type for the DataTable
type TransactionRowDataT = [string, string, string, number, number, number, string];

export const TransactionModal: React.FC<TransactionModalProps> = ({ visible, onClose, transactions, date, xirr, portfolioName, funds }) => {
  const [css] = useStyletron();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [visible, onClose]);

  // Sort transactions by date, then by type (buy, rebalance, sell), then by fund name
  const typeOrder = { buy: 0, rebalance: 1, sell: 2 };
  const transactionTypeDisplay = {
    buy: 'Buy',
    sell: 'Sell',
    rebalance: 'Rebalance'
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

  // Convert transactions to DataTable format
  const rows = sortedTxs.map((tx, idx) => {
    const fundName = funds[tx.fundIdx]?.schemeName || `Fund ${tx.fundIdx + 1}`;
    const allocationText = ((tx.type as string) === 'buy' || (tx.type as string) === 'rebalance') && tx.allocationPercentage !== undefined 
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
        allocationText,
      ] as TransactionRowDataT,
    };
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatNav = (num: number) => {
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

  // Define columns for the DataTable
  const columns = [
    StringColumn({
      title: "Fund",
      mapDataToValue: (data: TransactionRowDataT) => data[0],
      cellBlockAlign: 'start',
    }),
    CategoricalColumn({
      title: "Type",
      mapDataToValue: (data: TransactionRowDataT) => data[1],
      cellBlockAlign: 'start',
    }),
    StringColumn({
      title: "Date",
      mapDataToValue: (data: TransactionRowDataT) => data[2],
      cellBlockAlign: 'start',
    }),
    NumericalColumn({
      title: "NAV",
      format: formatNav,
      mapDataToValue: (data: TransactionRowDataT) => data[3],
      cellBlockAlign: 'end',
    }),
    NumericalColumn({
      title: "Units",
      format: formatUnits,
      mapDataToValue: (data: TransactionRowDataT) => data[4],
      cellBlockAlign: 'end',
    }),
    NumericalColumn({
      title: "Amount",
      format: formatNumber,
      mapDataToValue: (data: TransactionRowDataT) => data[5],
      cellBlockAlign: 'end',
    }),
    StringColumn({
      title: "Allocation %",
      mapDataToValue: (data: TransactionRowDataT) => data[6],
      cellBlockAlign: 'end',
    }),
  ];

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 1000
    }}>
      <div
        ref={modalRef}
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          width: '90vw',
          maxWidth: '1200px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '22px',
            color: '#888',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          &times;
        </button>
        
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
          {portfolioName} - {date}
        </h3>
        
        <div style={{ marginBottom: '0.5rem' }}>
          XIRR: <strong>{(xirr * 100).toFixed(2)}%</strong>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <strong>Transactions:</strong>
        </div>
        
        <div className={css({
          height: '400px',
          width: '100%',
          '.data-table': {
            width: '100%',
            display: 'table',
            tableLayout: 'fixed'
          }
        })}>
          <StatefulDataTable
            columns={columns}
            rows={rows}
            emptyMessage="No transactions to display"
            loadingMessage="Loading..."
            searchable={false}
            filterable={false}
          />
        </div>
      </div>
    </div>
  );
}; 