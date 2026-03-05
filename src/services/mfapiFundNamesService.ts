import { mfapiMutualFund } from '../types/mfapiMutualFund';

// Service for fetching mutual fund names from mfapi.in
const API_BASE_URL = 'https://api.mfapi.in';

export const fetchMutualFunds = async (): Promise<mfapiMutualFund[]> => {
  const response = await fetch(`${API_BASE_URL}/mf`);
  if (!response.ok) {
    throw new Error('Failed to fetch mutual funds');
  }
  const allFunds: mfapiMutualFund[] = await response.json();
  return allFunds
    .filter(fund => {
      const name = fund.schemeName.toLowerCase();
      return (
        !name.includes('idcw') &&
        !name.includes('dividend') &&
        !name.includes('income distribution') &&
        !name.includes('days') &&
        !name.includes('fixed') &&
        !name.includes('series') &&
        !name.includes('fmp') &&
        !name.includes('bonus') &&
        !name.includes('etf') &&
        !name.includes('interval') &&
        !name.includes('segregated') &&
        !name.includes('institutional')
      );
    })
    .sort((a, b) => a.schemeName.localeCompare(b.schemeName, undefined, { sensitivity: 'base' }));
}; 