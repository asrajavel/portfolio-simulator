self.onmessage=async function(a){const{navDataList:e,years:n,allocations:s,rebalancingEnabled:l,rebalancingThreshold:t,includeNilTransactions:o,stepUpEnabled:i,stepUpPercentage:c,sipAmount:r}=a.data,p=(await import("./index-aa713000.js")).calculateSipRollingXirr(e,n,s,l,t,o,i,c,r);self.postMessage(p)};
//# sourceMappingURL=worker-69379a30.js.map
