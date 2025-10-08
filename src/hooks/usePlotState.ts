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
  const navLoadingStartRef = useRef<number | null>(null);
  const xirrLoadingStartRef = useRef<number | null>(null);

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
    navLoadingStartRef.current = Date.now();
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
      const navElapsed = Date.now() - (navLoadingStartRef.current || 0);
      const startXirrCalculation = () => {
        setLoadingXirr(true);
        xirrLoadingStartRef.current = Date.now();
        const worker = new Worker(new URL('../utils/calculations/sipRollingXirr/worker.ts', import.meta.url), { type: 'module' });
        worker.postMessage({ navDataList: filledNavs, years });
        worker.onmessage = (event) => {
          setSipXirrDatas({ portfolio: event.data });
          setHasPlotted(true);
          const xirrElapsed = Date.now() - (xirrLoadingStartRef.current || 0);
          if (xirrElapsed < 1500) {
            setTimeout(() => setLoadingXirr(false), 1500 - xirrElapsed);
          } else {
            setLoadingXirr(false);
          }
          worker.terminate();
        };
        worker.onerror = (err) => {
          setXirrError('Error calculating XIRR.');
          const xirrElapsed = Date.now() - (xirrLoadingStartRef.current || 0);
          if (xirrElapsed < 1500) {
            setTimeout(() => setLoadingXirr(false), 1500 - xirrElapsed);
          } else {
            setLoadingXirr(false);
          }
          worker.terminate();
        };
      };
      if (navElapsed < 1500) {
        setTimeout(() => {
          setLoadingNav(false);
          startXirrCalculation();
        }, 1500 - navElapsed);
      } else {
        setLoadingNav(false);
        startXirrCalculation();
      }
    } catch (e) {
      setXirrError('Error loading or calculating data.');
      const navElapsed = Date.now() - (navLoadingStartRef.current || 0);
      if (navElapsed < 1500) {
        setTimeout(() => setLoadingNav(false), 1500 - navElapsed);
      } else {
        setLoadingNav(false);
      }
      const xirrElapsed = Date.now() - (xirrLoadingStartRef.current || 0);
      if (xirrElapsed < 1500) {
        setTimeout(() => setLoadingXirr(false), 1500 - xirrElapsed);
      } else {
        setLoadingXirr(false);
      }
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