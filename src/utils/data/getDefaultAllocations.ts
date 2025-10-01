export function getDefaultAllocations(n: number): number[] {
  const base = Math.floor(100 / n);
  const allocations = Array(n).fill(base);
  allocations[n - 1] = 100 - base * (n - 1);
  return allocations;
} 