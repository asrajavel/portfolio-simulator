import { NavEntry } from '../types/navData';
import { CORS_PROXY_URL, API_ENDPOINTS } from '../constants';

export async function fetchNavData(schemeCode: number): Promise<NavEntry[]> {
  const targetUrl = `${API_ENDPOINTS.MFAPI_BASE}/mf/${schemeCode}`;
  const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(targetUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error('Failed to fetch NAV data');
  const data = await response.json();
  return (data.data as { date: string; nav: string }[]).map(entry => ({
    date: new Date(entry.date.split('-').reverse().join('-')),
    nav: parseFloat(entry.nav)
  }));
}
