import React from 'react';
import { MultiFundCharts } from '../charts/MultiFundCharts';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipStrategy } from '../../types/sipStrategy';
import { LumpsumStrategy } from '../../types/lumpsumStrategy';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';

interface ChartAreaProps {
  xirrError: string | null;
  hasPlotted: boolean;
  navDatas: Record<number, any[]>;
  lumpsumStrategyXirrData?: Record<string, any[]>;
  sipStrategyXirrData?: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  loadingNav?: boolean;
  loadingXirr?: boolean;
  sipStrategies?: SipStrategy[];
  lumpsumStrategies?: LumpsumStrategy[];
  years: number;
  amount: number; // Can be sipAmount or lumpsumAmount
  chartView: 'xirr' | 'corpus';
  isLumpsum?: boolean;
}

export const ChartArea: React.FC<ChartAreaProps> = ({
  xirrError,
  hasPlotted,
  navDatas,
  lumpsumStrategyXirrData,
  sipStrategyXirrData,
  funds,
  COLORS,
  loadingNav = false,
  loadingXirr = false,
  sipStrategies,
  lumpsumStrategies,
  years,
  amount,
  chartView,
  isLumpsum = false,
}) => (
  <>
    {xirrError && (
      <Block marginTop="1rem">
        <LabelMedium
          overrides={{
            Block: {
              style: {
                color: '#dc2626',
                marginTop: 0,
                marginRight: 0,
                marginBottom: 0,
                marginLeft: 0,
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
      {hasPlotted && Object.keys(navDatas).length > 0 && (
        <MultiFundCharts
          navDatas={navDatas}
          lumpsumStrategyXirrData={lumpsumStrategyXirrData}
          sipStrategyXirrData={sipStrategyXirrData}
          funds={funds}
          COLORS={COLORS}
          sipStrategies={sipStrategies}
          lumpsumStrategies={lumpsumStrategies}
          years={years}
          amount={amount}
          chartView={chartView}
          isLumpsum={isLumpsum}
        />
      )}
    </Block>
  </>
); 