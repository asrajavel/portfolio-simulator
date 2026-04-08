import { fetchNavData } from '../services/mfapiNavService';
import { GovSchemeService } from '../services/govSchemeService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { FixedReturnService } from '../services/fixedReturnService';
import { NavEntry } from '../types/navData';
import {
  GoalData,
  HoldingData,
  DailyHoldingSnapshot,
  DailyGoalSnapshot,
  ComputedGoalData,
  GoalSummary,
  HoldingSummary,
} from '../types/tracker';
import xirr from 'xirr';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildNavMap(navEntries: NavEntry[]): Map<string, number> {
  const filled = fillMissingNavDates(navEntries);
  const map = new Map<string, number>();
  for (const e of filled) map.set(toDateKey(e.date), e.nav);
  return map;
}

function getNav(navMap: Map<string, number>, date: Date): number {
  return navMap.get(toDateKey(date)) ?? 0;
}

async function fetchNavsForHolding(holding: HoldingData): Promise<NavEntry[]> {
  switch (holding.type) {
    case 'mutual_fund':
      return fetchNavData(holding.schemeCode);
    case 'yahoo_finance':
      return yahooFinanceService.fetchStockDataInINR(holding.symbol);
    case 'fixed_return':
      return FixedReturnService.generateFixedReturnData(holding.annualReturnPercentage);
    case 'gov_scheme':
      return GovSchemeService.generateGovSchemeData(holding.scheme);
  }
}

function parseTransactionMap(holding: HoldingData): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of holding.transactions) {
    const existing = map.get(t.date) || 0;
    map.set(t.date, existing + t.amount);
  }
  return map;
}

function computeHoldingTimeSeries(
  holding: HoldingData,
  navMap: Map<string, number>
): DailyHoldingSnapshot[] {
  const transactions = parseTransactionMap(holding);

  const allDates = [...transactions.keys()].sort();
  if (allDates.length === 0) return [];

  const startDate = new Date(allDates[0]);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const snapshots: DailyHoldingSnapshot[] = [];
  let cumInv = 0;
  let cumUnits = 0;
  let lastKnownNav = 0;
  const xirrCashflows: { amount: number; when: Date }[] = [];

  for (
    let d = new Date(startDate);
    d <= yesterday;
    d.setDate(d.getDate() + 1)
  ) {
    const dateKey = toDateKey(d);
    const rawNav = getNav(navMap, d);
    const nav = rawNav > 0 ? rawNav : lastKnownNav;
    if (rawNav > 0) lastKnownNav = rawNav;
    const todayInv = transactions.get(dateKey) || 0;

    cumInv += todayInv;
    const todayUnits = nav > 0 ? todayInv / nav : 0;
    cumUnits += todayUnits;
    const totalValue = cumUnits * nav;

    if (todayInv !== 0) {
      xirrCashflows.push({ amount: -todayInv, when: new Date(d) });
    }
    const holdingXirr = computeXirr([
      ...xirrCashflows,
      { amount: totalValue, when: new Date(d) },
    ]);

    snapshots.push({
      date: new Date(d),
      nav,
      todayInv,
      cumInv,
      todayUnits,
      cumUnits,
      totalValue,
      xirr: holdingXirr,
    });
  }

  return snapshots;
}

function computeXirr(cashflows: { amount: number; when: Date }[]): number {
  if (cashflows.length < 2) return 0;

  const hasPositive = cashflows.some((c) => c.amount > 0);
  const hasNegative = cashflows.some((c) => c.amount < 0);
  if (!hasPositive || !hasNegative) return 0;

  try {
    const result = xirr(cashflows);
    return Math.abs(result) > 1 ? NaN : result;
  } catch {
    return NaN;
  }
}

function buildGoalDailySnapshots(
  holdingSeriesMap: Record<string, DailyHoldingSnapshot[]>,
  holdingNames: string[]
): DailyGoalSnapshot[] {
  const allDateKeys = new Set<string>();
  for (const series of Object.values(holdingSeriesMap)) {
    for (const s of series) {
      allDateKeys.add(toDateKey(s.date));
    }
  }

  const sortedDates = [...allDateKeys].sort();
  if (sortedDates.length === 0) return [];

  const holdingMaps: Record<string, Map<string, DailyHoldingSnapshot>> = {};
  for (const name of holdingNames) {
    const map = new Map<string, DailyHoldingSnapshot>();
    for (const s of holdingSeriesMap[name] || []) {
      map.set(toDateKey(s.date), s);
    }
    holdingMaps[name] = map;
  }

  const snapshots: DailyGoalSnapshot[] = [];
  const xirrCashflows: { amount: number; when: Date }[] = [];
  let prevTotalInv = 0;

  for (const dateKey of sortedDates) {
    const date = new Date(dateKey);
    let totalInv = 0;
    let totalValue = 0;
    const holdingValues: Record<string, number> = {};
    const holdingInvestments: Record<string, number> = {};

    for (const name of holdingNames) {
      const snapshot = holdingMaps[name].get(dateKey);
      if (snapshot) {
        totalInv += snapshot.cumInv;
        totalValue += snapshot.totalValue;
        holdingValues[name] = snapshot.totalValue;
        holdingInvestments[name] = snapshot.cumInv;
      }
    }

    const todayInv = totalInv - prevTotalInv;
    prevTotalInv = totalInv;

    if (todayInv !== 0) {
      xirrCashflows.push({ amount: -todayInv, when: new Date(date) });
    }

    const xirrCashflowsWithRedemption = [
      ...xirrCashflows,
      { amount: totalValue, when: new Date(date) },
    ];
    const xirrValue = computeXirr(xirrCashflowsWithRedemption);
    const absReturn = totalInv > 0 ? (totalValue - totalInv) / totalInv : 0;

    snapshots.push({
      date,
      totalInv,
      totalValue,
      xirr: xirrValue,
      absReturn,
      holdingValues,
      holdingInvestments,
    });
  }

  return snapshots;
}

export async function computeGoal(
  goal: GoalData,
  onProgress?: (msg: string) => void
): Promise<ComputedGoalData> {
  const holdingTimeSeries: Record<string, DailyHoldingSnapshot[]> = {};
  const holdingNames = goal.holdings.map((h) => h.name);

  for (const holding of goal.holdings) {
    onProgress?.(`Fetching data for ${holding.name}...`);
    const navEntries = await fetchNavsForHolding(holding);
    const navMap = buildNavMap(navEntries);

    onProgress?.(`Computing ${holding.name}...`);
    holdingTimeSeries[holding.name] = computeHoldingTimeSeries(holding, navMap);
  }

  onProgress?.('Combining portfolios...');
  const dailySnapshots = buildGoalDailySnapshots(holdingTimeSeries, holdingNames);

  const latest = dailySnapshots[dailySnapshots.length - 1];
  const previousDay =
    dailySnapshots.length >= 2
      ? dailySnapshots[dailySnapshots.length - 2]
      : null;

  const lockedMap = new Map(goal.holdings.map((h) => [h.name, !!h.locked]));

  const holdingSummaries: HoldingSummary[] = holdingNames.map((name) => {
    const value = latest?.holdingValues[name] || 0;
    const investment = latest?.holdingInvestments[name] || 0;
    const series = holdingTimeSeries[name] || [];
    const latestHolding = series[series.length - 1];
    return {
      name,
      investment,
      value,
      xirr: latestHolding?.xirr ?? 0,
      allocation: latest ? (value / latest.totalValue) * 100 : 0,
      locked: lockedMap.get(name) ?? false,
    };
  });

  const lockedValue = holdingSummaries
    .filter((h) => h.locked)
    .reduce((sum, h) => sum + h.value, 0);

  const summary: GoalSummary = {
    name: goal.name,
    totalInvestment: latest?.totalInv || 0,
    totalValue: latest?.totalValue || 0,
    interest: (latest?.totalValue || 0) - (latest?.totalInv || 0),
    xirr: latest?.xirr ?? 0,
    dailyChange: previousDay
      ? latest.totalValue - previousDay.totalValue
      : 0,
    lockedValue,
    holdings: holdingSummaries,
  };

  return { summary, dailySnapshots, holdingTimeSeries };
}
