import { yahooFinanceService } from './yahooFinanceService';

const d = (dateStr: string) => new Date(dateStr + 'T00:00:00Z');

describe('yahooFinanceService.fetchStockDataConverted', () => {
  beforeEach(() => {
    yahooFinanceService.clearCache();
  });

  test('should multiply NAV by forex rate and trim to forex date range', async () => {
    const stockData = [
      { date: d('2000-01-03'), nav: 100 },
      { date: d('2003-12-01'), nav: 200 },
      { date: d('2003-12-02'), nav: 210 },
      { date: d('2003-12-03'), nav: 220 },
    ];

    const forexData = [
      { date: d('2003-12-01'), nav: 45 },
      { date: d('2003-12-03'), nav: 46 },
    ];

    // Inject caches directly to avoid network calls
    (yahooFinanceService as any).stockDataCache['TEST'] = stockData;
    (yahooFinanceService as any).currencyCache['TEST'] = 'USD';
    (yahooFinanceService as any).stockDataCache['USDINR=X'] = forexData;

    const result = await yahooFinanceService.fetchStockDataConverted('TEST', true);

    // Pre-forex data (2000-01-03) should be trimmed
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ date: d('2003-12-01'), nav: 200 * 45 });
    // 2003-12-02 has no exact forex match, forward-fills from 2003-12-01 rate (45)
    expect(result[1]).toEqual({ date: d('2003-12-02'), nav: 210 * 45 });
    expect(result[2]).toEqual({ date: d('2003-12-03'), nav: 220 * 46 });
  });

  test('should return raw data when convertToINR is false', async () => {
    const stockData = [
      { date: d('2024-01-01'), nav: 500 },
    ];

    (yahooFinanceService as any).stockDataCache['AAPL'] = stockData;
    (yahooFinanceService as any).currencyCache['AAPL'] = 'USD';

    const result = await yahooFinanceService.fetchStockDataConverted('AAPL', false);
    expect(result).toEqual(stockData);
  });

  test('should skip conversion when currency is already INR', async () => {
    const stockData = [
      { date: d('2024-01-01'), nav: 2500 },
    ];

    (yahooFinanceService as any).stockDataCache['RELIANCE.NS'] = stockData;
    (yahooFinanceService as any).currencyCache['RELIANCE.NS'] = 'INR';

    const result = await yahooFinanceService.fetchStockDataConverted('RELIANCE.NS', true);
    expect(result).toEqual(stockData);
  });
});
