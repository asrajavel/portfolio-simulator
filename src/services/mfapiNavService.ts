import { NavEntry } from '../types/navData';

export async function fetchNavData(schemeCode: number): Promise<NavEntry[]> {
  const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!response.ok) throw new Error('Failed to fetch NAV data');
  const data = await response.json();
  return (data.data as { date: string; nav: string }[]).map(entry => ({
    date: new Date(entry.date.split('-').reverse().join('-')),
    nav: parseFloat(entry.nav)
  }));
}
