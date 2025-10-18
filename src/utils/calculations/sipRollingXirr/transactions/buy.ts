import { NavEntry } from '../../../../types/navData';
import { Transaction } from '../types';
import { getInvestmentYear } from '../core/helpers';

interface BuyTransactionsResult {
  transactions: Transaction[];
  portfolioValue: number;
}

interface TransactionState {
  cumulativeUnits: number[];
  unitsPerFund: number[];
}

/**
 * Create buy transactions for a SIP date
 */
export function createBuyTransactions(
  dateKey: string,
  fundDateMaps: Map<string, NavEntry>[],
  allocations: number[],
  state: TransactionState,
  currentDate: Date,
  firstSipDate: Date,
  stepUpEnabled: boolean,
  stepUpPercentage: number,
  sipAmount: number
): BuyTransactionsResult | null {
  // Calculate investment with step-up if enabled
  let totalInvestment = sipAmount;
  
  if (stepUpEnabled && stepUpPercentage > 0) {
    const investmentYear = getInvestmentYear(currentDate, firstSipDate);
    // Apply compound step-up: Year 1 = sipAmount, Year 2 = sipAmount * (1 + r), Year 3 = sipAmount * (1 + r)^2, etc.
    totalInvestment = sipAmount * Math.pow(1 + stepUpPercentage / 100, investmentYear - 1);
  }
  const transactions: Transaction[] = [];
  let totalPortfolioValue = 0;
  const fundValues: number[] = [];

  for (let fundIdx = 0; fundIdx < fundDateMaps.length; fundIdx++) {
    const entry = fundDateMaps[fundIdx].get(dateKey);
    if (!entry) return null;

    const investmentAmount = totalInvestment * (allocations[fundIdx] / 100);
    const units = investmentAmount / entry.nav;

    state.cumulativeUnits[fundIdx] += units;
    state.unitsPerFund[fundIdx] += units;

    const currentValue = state.cumulativeUnits[fundIdx] * entry.nav;
    fundValues.push(currentValue);
    totalPortfolioValue += currentValue;

    transactions.push({
      fundIdx,
      nav: entry.nav,
      when: entry.date,
      units,
      amount: -investmentAmount,
      type: 'buy',
      cumulativeUnits: state.cumulativeUnits[fundIdx],
      currentValue,
      allocationPercentage: 0,
    });
  }

  transactions.forEach((tx, idx) => {
    tx.allocationPercentage = totalPortfolioValue > 0 ? (fundValues[idx] / totalPortfolioValue) * 100 : 0;
  });

  return { transactions, portfolioValue: totalPortfolioValue };
}

