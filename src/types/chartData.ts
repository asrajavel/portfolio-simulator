import { NavEntry } from './navData';
import { RollingXirrEntry } from '../utils/calculations/lumpSumRollingXirr';
import { SipRollingXirrEntry } from '../utils/calculations/sipRollingXirr';

// Chart data types for better type safety
export type NavDataMap = Record<number, NavEntry[]>;
export type LumpSumXirrDataMap = Record<string, RollingXirrEntry[]>;
export type SipXirrDataMap = Record<string, SipRollingXirrEntry[]>;
export type PortfolioNavDataMap = Record<string, NavEntry[][]>;

// Chart state types
export interface ChartState {
  navDatas: NavDataMap;
  lumpSumXirrDatas: LumpSumXirrDataMap;
  sipXirrDatas: SipXirrDataMap;
  hasPlotted: boolean;
  loadingNav: boolean;
  loadingXirr: boolean;
  xirrError: string | null;
}
