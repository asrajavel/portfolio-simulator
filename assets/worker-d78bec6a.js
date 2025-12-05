self.onmessage=async function(s){const{navDataList:t,years:a,allocations:e,investmentAmount:n}=s.data,o=(await import("./index-ffe347d8.js")).calculateLumpSumRollingXirr(t,a,e,n);self.postMessage(o)};
//# sourceMappingURL=worker-d78bec6a.js.map
