import { InstrumentNavData } from '../types/instrument';

/**
 * Service to fetch and generate NAV data based on inflation rates
 * Uses World Bank API for historical inflation data
 */
export class InflationService {
  private yearlyRatesCache = new Map<string, Map<number, number>>();
  
  /**
   * Fetch inflation data from World Bank API
   * @param countryCode - ISO3 country code (e.g., 'IND' for India)
   * @returns Map of year to inflation rate percentage
   */
  async fetchInflationRates(countryCode: string = 'IND'): Promise<Map<number, number>> {
    if (this.yearlyRatesCache.has(countryCode)) {
      return this.yearlyRatesCache.get(countryCode)!;
    }

    try {
      const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=100`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inflation data for ${countryCode}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
        throw new Error('Invalid response format from World Bank API');
      }

      const yearlyRates = new Map<number, number>();
      
      data[1].forEach((entry: any) => {
        if (entry.value !== null && entry.value !== undefined) {
          const year = parseInt(entry.date, 10);
          const rate = parseFloat(entry.value);
          
          if (!isNaN(year) && !isNaN(rate)) {
            yearlyRates.set(year, rate);
          }
        }
      });

      this.yearlyRatesCache.set(countryCode, yearlyRates);
      return yearlyRates;
    } catch (error) {
      console.error(`Error fetching inflation data for ${countryCode}:`, error);
      throw error;
    }
  }

  /**
   * Generate daily NAV data based on historical inflation rates
   * @param countryCode - ISO3 country code (e.g., 'IND' for India)
   * @param startYear - Starting year (default: 1960)
   * @returns Array of NAV data with daily weekday entries
   */
  async generateInflationNavData(
    countryCode: string = 'IND',
    startYear: number = 1960
  ): Promise<InstrumentNavData[]> {
    const yearlyRates = await this.fetchInflationRates(countryCode);
    
    if (yearlyRates.size === 0) {
      throw new Error(`No inflation data available for ${countryCode}`);
    }

    const navData: InstrumentNavData[] = [];
    const startDate = new Date(Date.UTC(startYear, 0, 1));
    const endDate = new Date();
    
    let currentDate = new Date(startDate);
    let currentNav = 100;
    let cachedYear = -1;
    let cachedDailyGrowthFactor = 1;
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        continue;
      }
      
      const year = currentDate.getUTCFullYear();
      const inflationRate = yearlyRates.get(year) ?? 0;
      
      if (year !== cachedYear) {
        cachedYear = year;
        cachedDailyGrowthFactor = Math.pow(1 + (inflationRate / 100), 1 / 365.25);
      }
      
      currentNav *= cachedDailyGrowthFactor;
      
      navData.push({
        date: new Date(currentDate),
        nav: Math.round(currentNav * 100000) / 100000
      });
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return navData;
  }

  getCountryDisplayName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      'IND': 'India',
      'USA': 'United States'
    };
    return countryNames[countryCode] || countryCode;
  }

  clearCache(): void {
    this.yearlyRatesCache.clear();
  }
}

export const inflationService = new InflationService();

