// worker.ts - Web Worker for Lumpsum XIRR calculation (Vite/TypeScript compatible)

self.onmessage = async function(e) {
  const { navDataList, years, allocations, investmentAmount } = e.data;
  // Dynamically import the calculation function
  const module = await import('./index');
  const result = module.calculateLumpSumRollingXirr(
    navDataList, 
    years, 
    allocations,
    investmentAmount
  );
  // Post the result back to the main thread
  self.postMessage(result);
};

