import { getQueryParams } from './queryParams';
import { setLumpsumQueryParams } from './queryParams-lumpsum';
import { LumpsumPortfolio } from '../../types/lumpsumPortfolio';

// Mock window.location
const mockLocation = (search: string) => {
  delete (window as any).location;
  (window as any).location = { search };
};

// Mock window.history
const mockHistory = () => {
  delete (window as any).history;
  (window as any).history = {
    replaceState: jest.fn((_: any, __: any, url: string) => {
      mockLocation(url.split('?')[1] || '');
    })
  };
};

describe('Query Params - Lumpsum Portfolios', () => {
  beforeEach(() => {
    mockHistory();
  });

  test('should write and read lumpsum portfolios (round-trip)', () => {
    const portfolios: LumpsumPortfolio[] = [
      {
        selectedAssets: [{
          type: 'index_fund',
          id: 'NIFTY 50',
          name: 'NIFTY 50',
          indexName: 'NIFTY 50',
          displayName: 'NIFTY 50'
        }],
        allocations: [100]
      },
      {
        selectedAssets: [
          {
            type: 'mutual_fund',
            id: 122639,
            name: 'Scheme 122639',
            schemeCode: 122639,
            schemeName: 'Scheme 122639'
          },
          {
            type: 'mutual_fund',
            id: 120197,
            name: 'Scheme 120197',
            schemeCode: 120197,
            schemeName: 'Scheme 120197'
          }
        ],
        allocations: [70, 30]
      }
    ];
    
    setLumpsumQueryParams(portfolios, 7, 250000);
    const params = getQueryParams();
    
    expect(params.lumpsumPortfolios).toHaveLength(2);
    expect(params.years).toBe(7);
    expect(params.lumpsumAmount).toBe(250000);
    expect(params.lumpsumPortfolios[0].allocations).toEqual([100]);
    expect(params.lumpsumPortfolios[1].allocations).toEqual([70, 30]);
  });

  test('should handle all asset types', () => {
    mockLocation('lumpsumPortfolios=idx:NIFTY_50:100;fixed:8:50,inflation:IND:50');
    
    const params = getQueryParams();
    
    expect(params.lumpsumPortfolios).toHaveLength(2);
    expect(params.lumpsumPortfolios[0].selectedAssets[0].type).toBe('index_fund');
    expect(params.lumpsumPortfolios[1].selectedAssets[0].type).toBe('fixed_return');
    expect(params.lumpsumPortfolios[1].selectedAssets[1].type).toBe('inflation');
  });

  test('should return defaults when no params exist', () => {
    mockLocation('');
    
    const params = getQueryParams();
    
    expect(params.lumpsumPortfolios).toEqual([]);
    expect(params.lumpsumAmount).toBe(100000);
  });

  test('should round-trip yahoo finance with convertToINR flag', () => {
    const portfolios: LumpsumPortfolio[] = [
      {
        selectedAssets: [{
          type: 'yahoo_finance',
          id: '^GSPC',
          name: '^GSPC (INR)',
          symbol: '^GSPC',
          displayName: '^GSPC (INR)',
          convertToINR: true
        }],
        allocations: [100]
      },
      {
        selectedAssets: [{
          type: 'yahoo_finance',
          id: 'AAPL',
          name: 'AAPL',
          symbol: 'AAPL',
          displayName: 'AAPL',
          convertToINR: false
        }],
        allocations: [100]
      }
    ];

    setLumpsumQueryParams(portfolios, 5, 100000);
    const params = getQueryParams();

    expect(params.lumpsumPortfolios).toHaveLength(2);
    const asset0 = params.lumpsumPortfolios[0].selectedAssets[0];
    expect(asset0.type).toBe('yahoo_finance');
    expect(asset0.symbol).toBe('^GSPC');
    expect(asset0.convertToINR).toBe(true);
    expect(asset0.displayName).toBe('^GSPC (INR)');

    const asset1 = params.lumpsumPortfolios[1].selectedAssets[0];
    expect(asset1.symbol).toBe('AAPL');
    expect(asset1.convertToINR).toBe(false);
    expect(asset1.displayName).toBe('AAPL');
  });

  test('should parse yahooinr from historical values URL', () => {
    mockLocation('assets=yahooinr:^GSPC;yahoo:AAPL&logScale=1');
    const params = getQueryParams();

    expect(params.assets).toHaveLength(2);
    const a0 = params.assets[0] as any;
    const a1 = params.assets[1] as any;
    expect(a0.type).toBe('yahoo_finance');
    expect(a0.symbol).toBe('^GSPC');
    expect(a0.convertToINR).toBe(true);
    expect(a1.symbol).toBe('AAPL');
    expect(a1.convertToINR).toBe(false);
  });

  test('should parse yahooinr from SIP portfolios URL', () => {
    mockLocation('portfolios=yahooinr:^GSPC:100|0|5|0|5&years=5&sipAmount=10000');
    const params = getQueryParams();

    expect(params.portfolios).toHaveLength(1);
    const asset = params.portfolios[0].selectedAssets[0] as any;
    expect(asset.type).toBe('yahoo_finance');
    expect(asset.symbol).toBe('^GSPC');
    expect(asset.convertToINR).toBe(true);
  });
});

