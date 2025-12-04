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
 * Group transactions by date key
 */
function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  
  for (const tx of transactions) {
    const dateKey = tx.when.toISOString().split('T')[0];
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)!.push(tx);
  }
  
  return map;
}

/**
 * Calculate total portfolio value from transactions on a single date
 */
function calculateTotalValue(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.currentValue, 0);
}

/**
 * Calculate net cash flow from transactions on a single date
 */
function calculateCashFlow(transactions: Transaction[]): number {
  return transactions
    .filter(tx => tx.type === 'buy')
    .reduce((sum, tx) => sum + tx.amount, 0); // amount is negative for buy
}

