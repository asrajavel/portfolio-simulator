import { AssetNavData, GovSchemeType } from '../types/asset';

export interface RateEntry {
  year: number;
  rate: number;
}

export const PPF_RATES: RateEntry[] = [
  { year: 1968, rate: 4.8 },
  { year: 1970, rate: 5.0 },
  { year: 1973, rate: 5.3 },
  { year: 1974, rate: 5.8 },
  { year: 1975, rate: 7.0 },
  { year: 1977, rate: 7.5 },
  { year: 1980, rate: 8.0 },
  { year: 1981, rate: 8.5 },
  { year: 1983, rate: 9.0 },
  { year: 1984, rate: 9.5 },
  { year: 1985, rate: 10.0 },
  { year: 1986, rate: 12.0 },
  { year: 2000, rate: 11.0 },
  { year: 2001, rate: 9.5 },
  { year: 2002, rate: 9.0 },
  { year: 2003, rate: 8.0 },
  { year: 2012, rate: 8.8 },
  { year: 2013, rate: 8.7 },
  { year: 2016, rate: 8.1 },
  { year: 2017, rate: 7.9 },
  { year: 2018, rate: 7.6 },
  { year: 2019, rate: 8.0 },
  { year: 2020, rate: 7.1 },
];

export const EPF_RATES: RateEntry[] = [
  { year: 1952, rate: 3.0 },
  { year: 1955, rate: 3.5 },
  { year: 1957, rate: 3.75 },
  { year: 1963, rate: 4.0 },
  { year: 1964, rate: 4.25 },
  { year: 1965, rate: 4.5 },
  { year: 1966, rate: 4.75 },
  { year: 1967, rate: 5.0 },
  { year: 1968, rate: 5.25 },
  { year: 1969, rate: 5.5 },
  { year: 1970, rate: 5.7 },
  { year: 1971, rate: 5.8 },
  { year: 1972, rate: 6.0 },
  { year: 1974, rate: 6.5 },
  { year: 1975, rate: 7.0 },
  { year: 1976, rate: 7.5 },
  { year: 1977, rate: 8.0 },
  { year: 1978, rate: 8.25 },
  { year: 1981, rate: 8.5 },
  { year: 1982, rate: 8.75 },
  { year: 1983, rate: 9.15 },
  { year: 1984, rate: 9.9 },
  { year: 1985, rate: 10.15 },
  { year: 1986, rate: 11.0 },
  { year: 1987, rate: 11.5 },
  { year: 1988, rate: 11.8 },
  { year: 1989, rate: 12.0 },
  { year: 2000, rate: 11.0 },
  { year: 2001, rate: 9.5 },
  { year: 2002, rate: 9.5 },
  { year: 2003, rate: 9.5 },
  { year: 2005, rate: 8.5 },
  { year: 2010, rate: 9.5 },
  { year: 2011, rate: 8.25 },
  { year: 2012, rate: 8.5 },
  { year: 2013, rate: 8.75 },
  { year: 2015, rate: 8.8 },
  { year: 2016, rate: 8.65 },
  { year: 2017, rate: 8.55 },
  { year: 2018, rate: 8.65 },
  { year: 2019, rate: 8.5 },
  { year: 2021, rate: 8.1 },
  { year: 2022, rate: 8.15 },
  { year: 2023, rate: 8.25 },
];

const RATE_TABLES: Record<GovSchemeType, RateEntry[]> = {
  ppf: PPF_RATES,
  epf: EPF_RATES,
};

function getRateForYear(rates: RateEntry[], year: number): number {
  let applicable = rates[0].rate;
  for (const entry of rates) {
    if (entry.year <= year) {
      applicable = entry.rate;
    } else {
      break;
    }
  }
  return applicable;
}

function getFiscalYear(date: Date): number {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  return month < 3 ? year - 1 : year; // Jan-Mar belongs to previous FY
}

export class GovSchemeService {
  static generateGovSchemeData(scheme: GovSchemeType): AssetNavData[] {
    const rates = RATE_TABLES[scheme];
    if (!rates) return [];

    const startYear = rates[0].year;
    const navData: AssetNavData[] = [];
    const startDate = new Date(Date.UTC(startYear, 3, 1)); // April 1 (FY start)
    const endDate = new Date();

    let currentDate = new Date(startDate);
    let currentNav = 100;
    let currentFY = getFiscalYear(startDate);
    let dailyGrowthFactor = Math.pow(1 + getRateForYear(rates, currentFY) / 100, 1 / 365.25);

    while (currentDate <= endDate) {
      const fy = getFiscalYear(currentDate);
      if (fy !== currentFY) {
        currentFY = fy;
        dailyGrowthFactor = Math.pow(1 + getRateForYear(rates, currentFY) / 100, 1 / 365.25);
      }

      navData.push({
        date: new Date(currentDate),
        nav: currentNav,
      });

      currentNav *= dailyGrowthFactor;
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return navData;
  }
}

export const govSchemeService = GovSchemeService;
