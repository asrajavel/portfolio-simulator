import { ProcessedIndexData } from '../types/index';
import { toaster } from 'baseui/toast';
import React from 'react';

let globalOpenHelp: ((topic: string) => void) | null = null;

export const setGlobalOpenHelp = (openHelp: (topic: string) => void) => {
  globalOpenHelp = openHelp;
};

const showErrorToast = (message: string) => {
  const handleHelpClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (globalOpenHelp) {
      globalOpenHelp('yahoo-tickers');
    }
  };

  toaster.negative(
    React.createElement(
      'div',
      null,
      message,
      React.createElement('br'),
      React.createElement('br'),
      React.createElement(
        'a',
        {
          href: '#',
          onClick: handleHelpClick,
          style: { color: 'white', textDecoration: 'underline', cursor: 'pointer' }
        },
        '📖 Help?'
      )
    ),
    { autoHideDuration: 7000 }
  );
};

interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        longName: string;
        currency: string;
      };
      timestamp: number[];
      indicators: {
        adjclose: Array<{
          adjclose: number[];
        }>;
      };
    }>;
    error: any;
  };
}

interface ProxyResponse {
  contents: string;
  status?: {
    url: string;
    content_type: string;
    http_code: number;
    response_time: number;
    content_length: number;
  };
}

class YahooFinanceService {
  private stockDataCache: Record<string, ProcessedIndexData[]> = {};

  async fetchStockData(symbol: string): Promise<ProcessedIndexData[]> {
    if (this.stockDataCache[symbol]) {
      return this.stockDataCache[symbol];
    }

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=100y`;
      const proxyUrl = `https://cors-proxy-lake-omega.vercel.app/api/proxy?url=${encodeURIComponent(yahooUrl)}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorMsg = `Yahoo Finance ticker "${symbol}" not found or unavailable. Please check the ticker symbol and try again.`;
        showErrorToast(errorMsg);
        throw new Error(errorMsg);
      }

      const proxyData = await response.json();
      
      // The new CORS proxy returns Yahoo Finance data directly
      const yahooData: YahooFinanceResponse = proxyData;
      
      if (yahooData.chart.error) {
        const errorMsg = `Yahoo Finance ticker "${symbol}" returned an error. Please check the ticker symbol and try again.`;
        showErrorToast(errorMsg);
        throw new Error(errorMsg);
      }

      if (!yahooData.chart.result || yahooData.chart.result.length === 0) {
        const errorMsg = `No data available for Yahoo Finance ticker "${symbol}". The ticker might be delisted or invalid.`;
        showErrorToast(errorMsg);
        throw new Error(errorMsg);
      }

      const chartResult = yahooData.chart.result[0];
      const timestamps = chartResult.timestamp;
      const adjClosePrices = chartResult.indicators.adjclose[0].adjclose;

      if (!timestamps || !adjClosePrices || timestamps.length !== adjClosePrices.length) {
        const errorMsg = `Invalid data structure for Yahoo Finance ticker "${symbol}". The data format is unexpected.`;
        showErrorToast(errorMsg);
        throw new Error(errorMsg);
      }

      const processedData = timestamps.map((timestamp, index) => {
        const adjClose = adjClosePrices[index];
        if (adjClose === null || adjClose === undefined) {
          return null; // Skip null values
        }
        
        // Normalize to midnight UTC to match other data sources (indices, mutual funds)
        // Yahoo returns market close time (14:30 UTC for US markets), but we need midnight
        const rawDate = new Date(timestamp * 1000);
        const normalizedDate = new Date(Date.UTC(
          rawDate.getUTCFullYear(),
          rawDate.getUTCMonth(),
          rawDate.getUTCDate()
        ));
        
        return {
          date: normalizedDate,
          nav: adjClose
        };
      }).filter(item => item !== null) as ProcessedIndexData[];

      const finalData = this._cleanAndValidateData(processedData, symbol);

      this.stockDataCache[symbol] = finalData;
      return finalData;
    } catch (error) {
      if (error instanceof Error && error.message.includes('ticker')) {
        throw error;
      }
      const errorMsg = `Error fetching Yahoo Finance ticker "${symbol}". Please verify the ticker symbol.`;
      console.error(errorMsg, error);
      showErrorToast(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private _cleanAndValidateData(
    data: ProcessedIndexData[],
    symbol: string
  ): ProcessedIndexData[] {
    // First, filter out any non-positive NAVs which are invalid.
    const positiveNavData = data.filter(item => item.nav > 0);

    // Sort by date to ensure chronological order before outlier detection.
    positiveNavData.sort((a, b) => a.date.getTime() - b.date.getTime());

    // --- Outlier Detection ---
    // Financial data APIs can sometimes return erroneous data points, such as a price
    // suddenly dropping to a very low value for a day and then recovering. This logic
    // identifies and removes such outliers to prevent them from corrupting calculations
    // like XIRR.
    //
    // A real-world case was observed with the ticker 'GOLDBEES.NS' around
    // '2019-12-19', where the price erroneously dropped from ~33 to 0.34 for a day.
    //
    // It works by calculating the relative (percentage) change from the last valid
    // data point. If the change is unrealistically large (e.g., > 90%), the data point
    // is discarded.
    //
    const outlierFreeData = [];
    if (positiveNavData.length > 0) {
      outlierFreeData.push(positiveNavData[0]); // Start with the first valid data point.

      for (let i = 1; i < positiveNavData.length; i++) {
        const previousNav = outlierFreeData[outlierFreeData.length - 1].nav;
        const currentNav = positiveNavData[i].nav;

        // A daily change > 90% is highly likely to be a data error.
        const relativeChange = Math.abs(currentNav - previousNav) / previousNav;

        if (relativeChange < 0.9) {
          outlierFreeData.push(positiveNavData[i]);
        } else {
          console.warn(
            `Outlier detected for symbol ${symbol} on ${positiveNavData[
              i
            ].date.toDateString()}: NAV changed from ${previousNav} to ${currentNav}. Skipping.`
          );
        }
      }
    }

    if (outlierFreeData.length < 2) {
      const errorMsg = `Insufficient valid data points for Yahoo Finance ticker "${symbol}" after cleaning. Not enough historical data available.`;
      showErrorToast(errorMsg);
      throw new Error(errorMsg);
    }

    // Remove any duplicate dates (keep the first occurrence)
    const uniqueData = outlierFreeData.filter((item, index, array) => {
      if (index === 0) return true;
      return item.date.getTime() !== array[index - 1].date.getTime();
    });

    return uniqueData;
  }

  clearCache(): void {
    this.stockDataCache = {};
  }
}

export const yahooFinanceService = new YahooFinanceService(); 