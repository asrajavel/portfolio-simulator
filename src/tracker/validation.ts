import { TrackerData } from '../types/tracker';

const TYPE_REQUIRED_FIELDS: Record<string, string[]> = {
  mutual_fund: ['schemeCode'],
  yahoo_finance: ['symbol'],
  fixed_return: ['annualReturnPercentage'],
  gov_scheme: ['scheme'],
};

export function validateTrackerData(parsed: unknown): parsed is TrackerData {
  if (!parsed || typeof parsed !== 'object') return false;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.goals)) return false;
  for (const goal of obj.goals as unknown[]) {
    if (!goal || typeof goal !== 'object') return false;
    const g = goal as Record<string, unknown>;
    if (typeof g.name !== 'string') return false;
    if (!Array.isArray(g.holdings)) return false;
    for (const h of g.holdings as unknown[]) {
      if (!h || typeof h !== 'object') return false;
      const hld = h as Record<string, unknown>;
      if (typeof hld.name !== 'string') return false;
      const requiredFields = TYPE_REQUIRED_FIELDS[hld.type as string];
      if (!requiredFields) return false;
      for (const field of requiredFields) {
        if (hld[field] == null) return false;
      }
      if (!Array.isArray(hld.transactions)) return false;
    }
  }
  return true;
}

export const VALID_HOLDING_TYPES = Object.keys(TYPE_REQUIRED_FIELDS);
