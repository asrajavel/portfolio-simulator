import React from 'react';
import { MultiFundCharts } from './MultiFundCharts';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { Portfolio } from '../types/portfolio';
import { LoadingSpinner } from './LoadingSpinner';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';

interface ChartAreaProps {
  xirrError: string | null;
  hasPlotted: boolean;
  navDatas: Record<number, any[]>;
  lumpSumXirrDatas: Record<string, any[]>;
  sipXirrDatas: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  loadingNav?: boolean;
  loadingXirr?: boolean;
  portfolios: Portfolio[];
  years: number;
}

export const ChartArea: React.FC<ChartAreaProps> = ({
  xirrError,
  hasPlotted,
  navDatas,
  lumpSumXirrDatas,
  sipXirrDatas,
  funds,
  COLORS,
  loadingNav = false,
  loadingXirr = false,
  portfolios,
  years,
}) => (
  <>
    {xirrError && (
      <Block marginTop="1rem">
        <LabelMedium
          overrides={{
            Block: {
              style: {
                color: '#dc2626',
                margin: 0
              }
            }
          }}
        >
          {xirrError}
        </LabelMedium>
      </Block>
    )}
    <Block 
      minHeight="350px" 
      position="relative" 
      width="100%"
    >
      {(loadingNav || loadingXirr) ? (
        <Block
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overrides={{
            Block: {
              style: {
                zIndex: 2,
                background: 'rgba(255,255,255,0.0)'
              }
            }
          }}
        >
          {loadingNav && <LoadingSpinner text="Fetching NAV data..." />}
          {loadingXirr && <LoadingSpinner text="Calculating XIRR..." />}
        </Block>
      ) : (
        hasPlotted && Object.keys(navDatas).length > 0 && (
          <MultiFundCharts
            navDatas={navDatas}
            lumpSumXirrDatas={lumpSumXirrDatas}
            sipXirrDatas={sipXirrDatas}
            funds={funds}
            COLORS={COLORS}
            portfolios={portfolios}
            years={years}
          />
        )
      )}
    </Block>
  </>
); 