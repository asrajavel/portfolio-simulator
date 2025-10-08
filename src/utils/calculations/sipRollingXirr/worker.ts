// worker.ts - Web Worker for SIP XIRR calculation (Vite/TypeScript compatible)

self.onmessage = async function(e) {
  const { navDataList, years, allocations, rebalancingEnabled, rebalancingThreshold, includeNilTransactions } = e.data;
  // Dynamically import the calculation function
  const module = await import('./index');
  const result = module.calculateSipRollingXirr(
    navDataList, 
    years, 
    allocations, 
    rebalancingEnabled, 
    rebalancingThreshold,
    includeNilTransactions
  );
  // Post the result back to the main thread
  self.postMessage(result);
}; 