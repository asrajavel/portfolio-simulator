import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { CORS_PROXY_URL, API_ENDPOINTS } from '../constants';

export const fetchMutualFunds = async (): Promise<mfapiMutualFund[]> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    const targetUrl = `${API_ENDPOINTS.MFAPI_BASE}/mf`;
    const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
    response = await fetch(proxyUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
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
