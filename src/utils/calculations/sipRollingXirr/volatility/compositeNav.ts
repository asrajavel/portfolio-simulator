import { Transaction } from '../types';

export interface DailySipPortfolioValue {
  date: Date;
  totalValue: number;
  cashFlow: number; // Net cash flow on this day (negative for buy, positive for sell)
}

/**
 * Calculate daily portfolio values from transactions
 * Uses total portfolio value (sum of currentValue across all funds)
 * Includes nil and buy transactions to capture market movements on buy days
 * Tracks cash flows for accurate return calculation
 * 
 * @param transactions - All transactions
 */
export function calculateDailySipPortfolioValue(
  transactions: Transaction[]
): DailySipPortfolioValue[] {
  // Include nil and buy transactions (exclude sell and rebalance)
  const relevantTransactions = transactions.filter(
    tx => tx.type === 'nil' || tx.type === 'buy'
  );

  if (relevantTransactions.length === 0) {
    return [];
  }

  // Group transactions by date
  const transactionsByDate = groupTransactionsByDate(relevantTransactions);

  // Calculate total value and cash flow for each date
  const dailyValues: DailySipPortfolioValue[] = [];

  for (const [dateKey, txs] of transactionsByDate.entries()) {
    const totalValue = calculateTotalValue(txs);
    const cashFlow = calculateCashFlow(txs);
    
    if (totalValue > 0) {
      dailyValues.push({
        date: txs[0].when,
        totalValue,
        cashFlow
      });
    }
  }

  // Sort by date
  dailyValues.sort((a, b) => a.date.getTime() - b.date.getTime());

  return dailyValues;
}

/**
 * Group transactions by date (using date string as key)
 */
function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const dateKey = toDateKey(tx.when);
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(tx);
  }

  return grouped;
}

/**
 * Calculate total portfolio value for a set of transactions on the same date
 * Total Value = Σ(currentValue) - Sum of all fund positions' current values
 */
function calculateTotalValue(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    return 0;
  }

  // Calculate total portfolio value by summing currentValue of all funds
  let totalValue = 0;
  for (const tx of transactions) {
    totalValue += tx.currentValue;
  }

  return totalValue;
}

/**
 * Calculate net cash flow for a set of transactions on the same date
 * Cash Flow = Σ(amount) where negative = money invested, positive = money withdrawn
 */
function calculateCashFlow(transactions: Transaction[]): number {
  let netCashFlow = 0;
  for (const tx of transactions) {
    // amount is negative for buy (money out), positive for sell (money in)
    netCashFlow += tx.amount;
  }
  return netCashFlow;
}

/**
 * Convert date to string key (YYYY-MM-DD)
 */
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

