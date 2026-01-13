import React from 'react';
import { MultiAssetCharts } from '../charts/MultiAssetCharts';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipPortfolio } from '../../types/sipPortfolio';
import { LumpsumPortfolio } from '../../types/lumpsumPortfolio';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';

interface ChartAreaProps {
  xirrError: string | null;
  hasPlotted: boolean;
  navDatas: Record<number, any[]>;
  lumpsumPortfolioXirrData?: Record<string, any[]>;
  sipPortfolioXirrData?: Record<string, any[]>;
  funds: mfapiMutualFund[];
  COLORS: string[];
  loadingNav?: boolean;
  loadingXirr?: boolean;
  sipPortfolios?: SipPortfolio[];
  lumpsumPortfolios?: LumpsumPortfolio[];
  years: number;
  amount: number; // Can be sipAmount or lumpsumAmount
  chartView: 'xirr' | 'corpus';
  isLumpsum: boolean;
}

export const ChartArea: React.FC<ChartAreaProps> = ({
  xirrError,
  hasPlotted,
  navDatas,
  lumpsumPortfolioXirrData,
  sipPortfolioXirrData,
  funds,
  COLORS,
  loadingNav = false,
  loadingXirr = false,
  sipPortfolios,
  lumpsumPortfolios,
  years,
  amount,
  chartView,
  isLumpsum,
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
        <MultiAssetCharts
          navDatas={navDatas}
          lumpsumPortfolioXirrData={lumpsumPortfolioXirrData}
          sipPortfolioXirrData={sipPortfolioXirrData}
          funds={funds}
          COLORS={COLORS}
          sipPortfolios={sipPortfolios}
          lumpsumPortfolios={lumpsumPortfolios}
          years={years}
          amount={amount}
          chartView={chartView}
          isLumpsum={isLumpsum}
        />
      )}
    </Block>
  </>
); 