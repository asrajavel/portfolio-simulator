import xirr from 'xirr';
import { Transaction } from '../types';
import { toDateKey } from './helpers';

/**
 * Calculate XIRR from a list of transactions
 * 
 * @param transactions - Array of transactions (buy, sell, rebalance, nil)
 * @param currentDate - Current date for error logging
 * @returns XIRR value or null if calculation fails
 */
export function calculateXirrFromTransactions(
  transactions: Transaction[],
  currentDate: Date
): number | null {
  const cashflows = aggregateCashflows(transactions);
  return calculateXirr(cashflows, currentDate);
}

// ────────────── Private Helpers ────────────── //

function aggregateCashflows(transactions: Transaction[]): Array<{ amount: number; when: Date }> {
  const cashflowsMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === 'nil') continue; // Skip nil transactions (amount: 0, just overhead)

    const dateKey = toDateKey(tx.when);
    const currentAmount = cashflowsMap.get(dateKey) || 0;
    cashflowsMap.set(dateKey, currentAmount + tx.amount);
  }

  const cashflows = Array.from(cashflowsMap.entries()).map(([dateStr, amount]) => ({
    amount,
    when: new Date(dateStr),
  }));

  cashflows.sort((a, b) => a.when.getTime() - b.when.getTime());

  return cashflows;
}

function calculateXirr(cashflows: Array<{ amount: number; when: Date }>, currentDate: Date): number | null {
  try {
    return xirr(cashflows);
  } catch (error) {
    console.warn(`XIRR calculation failed for date ${currentDate.toISOString()}:`, error);
    return null;
  }
}

