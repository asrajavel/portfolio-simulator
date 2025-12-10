self.onmessage=async function(s){const{navDataList:t,years:a,allocations:e,investmentAmount:n}=s.data,o=(await import("./index-842b9c16.js")).calculateLumpSumRollingXirr(t,a,e,n);self.postMessage(o)};
//# sourceMappingURL=worker-c5ed6d0f.js.map
