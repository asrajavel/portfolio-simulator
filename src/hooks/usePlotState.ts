import { useState, useRef } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { DEFAULT_SCHEME_CODE, COLORS } from '../constants';

export function usePlotState(loadNavData: (schemeCode: number) => Promise<any[]>, funds: mfapiMutualFund[]) {

  const [selectedSchemes, setSelectedSchemes] = useState<(number | null)[]>([DEFAULT_SCHEME_CODE]);
  const [years, setYears] = useState<number>(1);
  const [navDatas, setNavDatas] = useState<Record<number, any[]>>({});
  const [lumpSumXirrDatas, setLumpSumXirrDatas] = useState<Record<string, any[]>>({});
  const [sipXirrDatas, setSipXirrDatas] = useState<Record<string, any[]>>({});
  const [hasPlotted, setHasPlotted] = useState(false);
  const [loadingNav, setLoadingNav] = useState(false);
  const [loadingXirr, setLoadingXirr] = useState(false);
  const [xirrError, setXirrError] = useState<string | null>(null);

  const handleAddFund = () => setSelectedSchemes(schemes => [...schemes, null]);
  const handleRemoveFund = (idx: number) => setSelectedSchemes(schemes => schemes.filter((_, i) => i !== idx));
  const handleFundSelect = (idx: number, schemeCode: number) => setSelectedSchemes(schemes => schemes.map((s, i) => i === idx ? schemeCode : s));
  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYears(Math.max(1, Math.floor(Number(e.target.value))));
    setHasPlotted(false);
    setNavDatas({});
    setLumpSumXirrDatas({});
    setSipXirrDatas({});
    setXirrError(null);
  };

  const handlePlot = async () => {
    setLoadingNav(true);
    setLoadingXirr(false);
    setHasPlotted(false);
    setNavDatas({});
    setLumpSumXirrDatas({});
    setSipXirrDatas({});
    setXirrError(null);
    try {
      const navs: Record<number, any[]> = {};
      const filledNavs: any[][] = [];
      for (const scheme of selectedSchemes) {
        if (!scheme) continue;
        const nav = await loadNavData(scheme);
        if (!Array.isArray(nav) || nav.length === 0) continue;
        const filled = fillMissingNavDates(nav);
        navs[scheme] = filled;
        filledNavs.push(filled);
      }
      setNavDatas(navs);
      setLoadingNav(false);
      
      setLoadingXirr(true);
      const worker = new Worker(new URL('../utils/calculations/sipRollingXirr/worker.ts', import.meta.url), { type: 'module' });
      worker.postMessage({ navDataList: filledNavs, years, includeNilTransactions: false });
      worker.onmessage = (event) => {
        setSipXirrDatas({ portfolio: event.data });
        setHasPlotted(true);
        setLoadingXirr(false);
        worker.terminate();
      };
      worker.onerror = (err) => {
        setXirrError('Error calculating XIRR.');
        setLoadingXirr(false);
        worker.terminate();
      };
    } catch (e) {
      setXirrError('Error loading or calculating data.');
      setLoadingNav(false);
      setLoadingXirr(false);
    }
  };

  return {
    years,
    setYears,
    selectedSchemes,
    setSelectedSchemes,
    navDatas,
    lumpSumXirrDatas,
    sipXirrDatas,
    hasPlotted,
    loadingNav,
    loadingXirr,
    xirrError,
    handleAddFund,
    handleRemoveFund,
    handleFundSelect,
    handleYearsChange,
    handlePlot,
    funds,
    COLORS,
    setHasPlotted,
    setNavDatas,
    setLumpSumXirrDatas,
    setSipXirrDatas,
    setXirrError,
    setLoadingNav,
    setLoadingXirr,
  };
} 