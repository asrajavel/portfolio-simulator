import { useCallback } from 'react';

interface PlotState {
  setHasPlotted: (value: boolean) => void;
  setNavDatas: (value: Record<number, any[]>) => void;
  setLumpSumXirrDatas: (value: Record<number, any[]>) => void;
  setSipXirrDatas: (value: Record<string, any[]>) => void;
  setXirrError: (value: string | null) => void;
}

/**
 * Custom hook to handle chart invalidation when portfolio data changes.
 * Provides a utility to wrap handlers with automatic chart invalidation.
 */
export function useChartInvalidation(plotState: PlotState) {
  const invalidateChart = useCallback(() => {
    plotState.setHasPlotted(false);
    plotState.setNavDatas({});
    plotState.setLumpSumXirrDatas({});
    plotState.setSipXirrDatas({});
    plotState.setXirrError(null);
  }, [plotState]);

  /**
   * Wraps a handler function to automatically invalidate the chart before execution.
   * @param handler - The original handler function to wrap
   * @returns A new function that invalidates the chart then calls the original handler
   */
  const withInvalidation = useCallback(
    <T extends (...args: any[]) => void>(handler: T): T => {
      return ((...args: Parameters<T>) => {
        invalidateChart();
        handler(...args);
      }) as T;
    },
    [invalidateChart]
  );

  return {
    invalidateChart,
    withInvalidation,
  };
}
