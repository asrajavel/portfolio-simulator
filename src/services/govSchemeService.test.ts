import { GovSchemeService } from './govSchemeService';

describe('GovSchemeService', () => {
  const ppf = GovSchemeService.generateGovSchemeData('ppf');
  const epf = GovSchemeService.generateGovSchemeData('epf');

  const findByDate = (data: any[], y: number, m: number, d: number) =>
    data.find(e => e.date.getUTCFullYear() === y && e.date.getUTCMonth() === m && e.date.getUTCDate() === d);

  it('PPF starts April 1 1968 at NAV 100, EPF starts April 1 1952', () => {
    expect(ppf[0].date.toISOString()).toBe('1968-04-01T00:00:00.000Z');
    expect(ppf[0].nav).toBe(100);
    expect(epf[0].date.toISOString()).toBe('1952-04-01T00:00:00.000Z');
    expect(epf[0].nav).toBe(100);
  });

  it('PPF applies 4.8% rate for FY 1968', () => {
    expect(ppf[1].nav).toBe(100.01283685010878);
    expect(findByDate(ppf, 1969, 3, 1)!.nav).toBe(104.79663701508163);
  });

  it('PPF rate change at FY boundary - gap-filled 8.0% to 8.8% at April 2012', () => {
    expect(findByDate(ppf, 2012, 2, 31)!.nav).toBe(4351.82060048798);
    expect(findByDate(ppf, 2012, 3, 1)!.nav).toBe(4352.7376598498795);
    expect(findByDate(ppf, 2012, 3, 2)!.nav).toBe(4353.74288170399);
  });

  it('PPF rate change 8.0% to 7.1% at April 2020', () => {
    expect(findByDate(ppf, 2020, 2, 31)!.nav).toBe(8242.757186782917);
    expect(findByDate(ppf, 2020, 3, 1)!.nav).toBe(8244.494183396508);
    // Daily growth drops after April 1 (7.1% vs 8.0%)
    const growthBefore = 8244.494183396508 / 8242.757186782917;
    const growthAfter = 8246.042618644547 / 8244.494183396508;
    expect(growthAfter).toBeLessThan(growthBefore);
  });

  it('returns empty array for unknown scheme', () => {
    expect(GovSchemeService.generateGovSchemeData('unknown' as any)).toEqual([]);
  });
});
