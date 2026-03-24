import { toaster } from 'baseui/toast';

export function warnInsufficientData(
  portfolios: any[],
  allNavDatas: Record<string, any[][]>,
  allResultDatas: Record<string, any[]>,
  years: number
) {
  const emptyPortfolios = portfolios
    .map((_: any, pIdx: number) => pIdx)
    .filter((pIdx: number) => allNavDatas[pIdx]?.length > 0 && (!allResultDatas[`Portfolio ${pIdx + 1}`] || allResultDatas[`Portfolio ${pIdx + 1}`].length === 0));
  if (emptyPortfolios.length > 0) {
    const names = emptyPortfolios.map((i: number) => `Portfolio ${i + 1}`).join(', ');
    toaster.warning(`${names}: Not enough data for ${years}-year rolling returns.\nTry a shorter rolling period, or check Historical Values tab for data range.`, {
      autoHideDuration: 8000,
      overrides: { Body: { style: { backgroundColor: '#292524', color: '#fafaf9', whiteSpace: 'pre-line' } } },
    });
  }
}
