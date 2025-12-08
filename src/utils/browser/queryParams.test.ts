import { getQueryParams } from './queryParams';
import { setLumpsumQueryParams } from './queryParams-lumpsum';
import { LumpsumStrategy } from '../../types/lumpsumStrategy';

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

describe('Query Params - Lumpsum Strategies', () => {
  beforeEach(() => {
    mockHistory();
  });

  test('should write and read lumpsum strategies (round-trip)', () => {
    const strategies: LumpsumStrategy[] = [
      {
        selectedInstruments: [{
          type: 'index_fund',
          id: 'NIFTY 50',
          name: 'NIFTY 50',
          indexName: 'NIFTY 50',
          displayName: 'NIFTY 50'
        }],
        allocations: [100]
      },
      {
        selectedInstruments: [
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
    
    setLumpsumQueryParams(strategies, 7, 250000);
    const params = getQueryParams();
    
    expect(params.lumpsumStrategies).toHaveLength(2);
    expect(params.years).toBe(7);
    expect(params.lumpsumAmount).toBe(250000);
    expect(params.lumpsumStrategies[0].allocations).toEqual([100]);
    expect(params.lumpsumStrategies[1].allocations).toEqual([70, 30]);
  });

  test('should handle all instrument types', () => {
    mockLocation('lumpsumStrategies=idx:NIFTY_50:100;fixed:8:50,inflation:IND:50');
    
    const params = getQueryParams();
    
    expect(params.lumpsumStrategies).toHaveLength(2);
    expect(params.lumpsumStrategies[0].selectedInstruments[0].type).toBe('index_fund');
    expect(params.lumpsumStrategies[1].selectedInstruments[0].type).toBe('fixed_return');
    expect(params.lumpsumStrategies[1].selectedInstruments[1].type).toBe('inflation');
  });

  test('should return defaults when no params exist', () => {
    mockLocation('');
    
    const params = getQueryParams();
    
    expect(params.lumpsumStrategies).toEqual([]);
    expect(params.lumpsumAmount).toBe(100000);
  });
});

