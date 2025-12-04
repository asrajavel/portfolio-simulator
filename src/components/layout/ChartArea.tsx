import React from 'react';
import { MultiFundCharts } from '../charts/MultiFundCharts';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipStrategy } from '../../types/sipStrategy';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';

interface ChartAreaProps {
  xirrError: string | null;
  hasPlotted: boolean;
  navDatas: Record<number, any[]>;
  lumpSumXirrDatas: Record<string, any[]>;
  sipStrategyXirrData: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  loadingNav?: boolean;
  loadingXirr?: boolean;
  sipStrategies: SipStrategy[];
  years: number;
  sipAmount: number;
  chartView: 'xirr' | 'corpus';
}

export const ChartArea: React.FC<ChartAreaProps> = ({
  xirrError,
  hasPlotted,
  navDatas,
  lumpSumXirrDatas,
  sipStrategyXirrData,
  funds,
  COLORS,
  loadingNav = false,
  loadingXirr = false,
  sipStrategies,
  years,
  sipAmount,
  chartView,
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
      position="relative" 
      maxWidth="90%"
      margin="0 auto"
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
          <LoadingSpinner text="Loading..." />
        </Block>
      ) : (
        hasPlotted && Object.keys(navDatas).length > 0 && (
        <MultiFundCharts
          navDatas={navDatas}
          lumpSumXirrDatas={lumpSumXirrDatas}
          sipStrategyXirrData={sipStrategyXirrData}
          funds={funds}
          COLORS={COLORS}
          sipStrategies={sipStrategies}
          years={years}
          sipAmount={sipAmount}
          chartView={chartView}
        />
        )
      )}
    </Block>
  </>
); 