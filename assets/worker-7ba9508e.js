self.onmessage=async function(a){const{navDataList:n,years:s,allocations:l,rebalancingEnabled:e,rebalancingThreshold:o,includeNilTransactions:t}=a.data,i=(await import("./index-dc99aa5e.js")).calculateSipRollingXirr(n,s,l,e,o,t);self.postMessage(i)};
//# sourceMappingURL=worker-7ba9508e.js.map
