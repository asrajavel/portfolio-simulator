self.onmessage=async function(s){const{navDataList:t,years:a,allocations:e,investmentAmount:n}=s.data,o=(await import("./index-59183fe4.js")).calculateLumpSumRollingXirr(t,a,e,n);self.postMessage(o)};
//# sourceMappingURL=worker-5cb90772.js.map
