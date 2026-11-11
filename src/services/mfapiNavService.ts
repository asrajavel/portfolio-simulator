import { NavEntry } from '../types/navData';
import { API_ENDPOINTS, CORS_PROXY_URL } from '../constants';

export async function fetchNavData(schemeCode: number): Promise<NavEntry[]> {
  // mfapi.in intermittently ships responses without CORS headers, so always go via our proxy
  const response = await fetch(`${CORS_PROXY_URL}?url=${encodeURIComponent(`${API_ENDPOINTS.MFAPI_BASE}/mf/${schemeCode}`)}`);
  if (!response.ok) throw new Error('Failed to fetch NAV data');
  const data = await response.json();
  return (data.data as { date: string; nav: string }[]).map(entry => ({
    date: new Date(entry.date.split('-').reverse().join('-')),
    nav: parseFloat(entry.nav)
  }));
}
