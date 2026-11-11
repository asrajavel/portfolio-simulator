self.onmessage=async function(a){const{navDataList:e,years:n,allocations:s,rebalancingEnabled:l,rebalancingThreshold:t,includeNilTransactions:o,stepUpEnabled:i,stepUpPercentage:c,sipAmount:r}=a.data,p=(await import("./index-6480b750.js")).calculateSipRollingXirr(e,n,s,l,t,o,i,c,r);self.postMessage(p)};
//# sourceMappingURL=worker-ed12eb44.js.map
