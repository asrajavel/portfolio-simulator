self.onmessage=async function(a){const{navDataList:e,years:n,allocations:s,rebalancingEnabled:l,rebalancingThreshold:t,includeNilTransactions:o,stepUpEnabled:i,stepUpPercentage:c,sipAmount:r}=a.data,p=(await import("./index-ac57251a.js")).calculateSipRollingXirr(e,n,s,l,t,o,i,c,r);self.postMessage(p)};
//# sourceMappingURL=worker-e563ee40.js.map
