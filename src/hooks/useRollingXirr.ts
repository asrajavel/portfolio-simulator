import { useState, useEffect } from 'react';
import { fillMissingNavDates } from '../utils/data/fillMissingNavDates';
import { calculateLumpSumRollingXirr, RollingXirrEntry } from '../utils/calculations/lumpSumRollingXirr';
import { calculateSipRollingXirr, SipRollingXirrEntry } from '../utils/calculations/sipRollingXirr';
import { NavEntry } from '../types/navData';

interface UseRollingXirrResult {
  xirrError: string | null;
  lumpSumRollingXirr: RollingXirrEntry[];
  sipRollingXirr: SipRollingXirrEntry[];
  filledNavData: NavEntry[];
  rollingLoading: boolean;
  hasPlotted: boolean;
  navRequested: boolean;
  setNavRequested: (v: boolean) => void;
  setHasPlotted: (v: boolean) => void;
  setLumpSumRollingXirr: (v: RollingXirrEntry[]) => void;
  setSipRollingXirr: (v: SipRollingXirrEntry[]) => void;
  setXirrError: (v: string | null) => void;
  setFilledNavData: (v: NavEntry[]) => void;
  handlePlot: (loadNavData: (scheme: number) => void, selectedScheme: number) => void;
}

export function useRollingXirr(
  navData: NavEntry[],
  navLoading: boolean,
  navError: string | null,
  years: number
): UseRollingXirrResult {
  const [xirrError, setXirrError] = useState<string | null>(null);
  const [lumpSumRollingXirr, setLumpSumRollingXirr] = useState<RollingXirrEntry[]>([]);
  const [sipRollingXirr, setSipRollingXirr] = useState<SipRollingXirrEntry[]>([]);
  const [filledNavData, setFilledNavData] = useState<NavEntry[]>([]);
  const [rollingLoading, setRollingLoading] = useState<boolean>(false);
  const [hasPlotted, setHasPlotted] = useState<boolean>(false);
  const [navRequested, setNavRequested] = useState<boolean>(false);

  useEffect(() => {
    if (navRequested && !navLoading && !navError && navData.length > 0) {
      setRollingLoading(true);
      setTimeout(() => {
        try {
          const filled = fillMissingNavDates(navData);
          setFilledNavData(filled);
          const rolling = calculateLumpSumRollingXirr(filled, years);
          setLumpSumRollingXirr(rolling);
          const sipRolling = calculateSipRollingXirr(filled, years);
          setSipRollingXirr(sipRolling);
          setXirrError(null);
          setHasPlotted(true);
        } catch (err: any) {
          setXirrError(err.message || 'Error calculating rolling XIRR');
          setLumpSumRollingXirr([]);
          setSipRollingXirr([]);
          setHasPlotted(false);
        } finally {
          setRollingLoading(false);
          setNavRequested(false);
        }
      }, 0);
    }
  }, [navRequested, navLoading, navError, navData, years]);

  function handlePlot(loadNavData: (scheme: number) => void, selectedScheme: number) {
    setHasPlotted(false);
    setLumpSumRollingXirr([]);
    setSipRollingXirr([]);
    setXirrError(null);
    setFilledNavData([]);
    setNavRequested(true);
    loadNavData(selectedScheme);
  }

  return {
    xirrError,
    lumpSumRollingXirr,
    sipRollingXirr,
    filledNavData,
    rollingLoading,
    hasPlotted,
    navRequested,
    setNavRequested,
    setHasPlotted,
    setLumpSumRollingXirr,
    setSipRollingXirr,
    setXirrError,
    setFilledNavData,
    handlePlot,
  };
} 