import { InflationService } from './inflationService';

describe('InflationService', () => {
  let service: InflationService;
  
  const mockWorldBankResponse = [
    {}, // metadata
    [
      { date: '2023', value: 5.5 },
      { date: '2022', value: 6.7 }
    ]
  ];

  beforeEach(() => {
    service = new InflationService();
    service.clearCache();
    global.fetch = jest.fn();
  });

  it('should fetch and parse World Bank API data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWorldBankResponse
    });

    const rates = await service.fetchInflationRates('IND');

    expect(rates.size).toBe(2);
    expect(rates.get(2023)).toBe(5.5);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.worldbank.org/v2/country/IND')
    );
  });

  it('should generate weekday-only NAV data with daily compounding', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockWorldBankResponse
    });

    const data = await service.generateInflationNavData('IND', 2023);

    // Weekdays only
    expect(data[0].date.getUTCDay()).toBeGreaterThanOrEqual(1);
    expect(data[0].date.getUTCDay()).toBeLessThanOrEqual(5);
    
    // UTC midnight
    expect(data[0].date.getUTCHours()).toBe(0);
    
    // Daily compounding: 100 * (1.055)^(1/365.25)
    expect(data[0].nav).toBeCloseTo(100.01465, 4);
  });

  it('should cache API responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockWorldBankResponse
    });

    await service.fetchInflationRates('IND');
    await service.fetchInflationRates('IND');

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

