import { fillMissingNavDates } from './fillMissingNavDates';
import { NavEntry } from '../../types/navData';

describe('fillMissingNavDates', () => {
  it('returns empty array for empty input', () => {
    expect(fillMissingNavDates([])).toEqual([]);
  });

  it('returns same array if no dates are missing', () => {
    const data: NavEntry[] = [
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-02'), nav: 101 },
      { date: new Date('2025-05-03'), nav: 102 }
    ];
    expect(fillMissingNavDates(data)).toEqual(data);
  });

  it('fills a single missing date', () => {
    const data: NavEntry[] = [
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-03'), nav: 102 }
    ];
    const result = fillMissingNavDates(data);
    expect(result).toEqual([
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-02'), nav: 102 },
      { date: new Date('2025-05-03'), nav: 102 }
    ]);
  });

  it('fills multiple consecutive missing dates', () => {
    const data: NavEntry[] = [
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-05'), nav: 105 }
    ];
    const result = fillMissingNavDates(data);
    expect(result).toEqual([
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-02'), nav: 105 },
      { date: new Date('2025-05-03'), nav: 105 },
      { date: new Date('2025-05-04'), nav: 105 },
      { date: new Date('2025-05-05'), nav: 105 }
    ]);
  });

  it('fills missing dates at the end with the last nav', () => {
    const data: NavEntry[] = [
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-03'), nav: 102 }
    ];
    // Should fill 2025-05-02 with 102, and nothing after 2025-05-03
    const result = fillMissingNavDates(data);
    expect(result).toEqual([
      { date: new Date('2025-05-01'), nav: 100 },
      { date: new Date('2025-05-02'), nav: 102 },
      { date: new Date('2025-05-03'), nav: 102 }
    ]);
  });
}); 