import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { ParagraphMedium } from 'baseui/typography';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ChartArea } from '../components/layout/ChartArea';
import { usePlotState } from '../hooks/usePlotState';
import { useLumpsumPortfolios } from '../hooks/useLumpsumPortfolios';
import { useLumpsumPlot } from '../hooks/useLumpsumPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { LumpsumPortfolioList } from '../components/lumpsum-simulator/LumpsumPortfolioList';
import { LumpsumControlsPanel } from '../components/controls/LumpsumControlsPanel';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from '../constants';

interface LumpsumSimulatorTabProps {
  funds: mfapiMutualFund[];
  loadNavData: (schemeCode: number) => Promise<any[]>;
}

export const LumpsumSimulatorTab: React.FC<LumpsumSimulatorTabProps> = ({ funds, loadNavData }) => {
  const location = useLocation();
  const isActive = location.pathname === '/lumpsum';
  const plotState = usePlotState(loadNavData, funds);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [chartView, setChartView] = useState<'xirr' | 'corpus'>('xirr');
  
  const {
    lumpsumPortfolios,
    setLumpsumPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleAssetSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  } = useLumpsumPortfolios(DEFAULT_SCHEME_CODE, [lumpsumAmount, setLumpsumAmount], isActive);

  const { handlePlotAllPortfolios } = useLumpsumPlot({
    lumpsumPortfolios,
    years,
    loadNavData,
    plotState,
    lumpsumAmount,
    chartView,
  });

  const anyInvalidAlloc = lumpsumPortfolios.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== ALLOCATION_TOTAL
  );

  // Use chart invalidation hook to wrap handlers
  const { invalidateChart, withInvalidation } = useChartInvalidation(plotState);

  // Wrap handlers with automatic chart invalidation
  const handleAddPortfolioInvalidate = withInvalidation(handleAddPortfolio);
  const handleAddFundInvalidate = withInvalidation(handleAddFund);
  const handleRemoveFundInvalidate = withInvalidation(handleRemoveFund);
  const handleAllocationChangeInvalidate = withInvalidation(handleAllocationChange);
  const handleAssetSelectInvalidate = withInvalidation(handleAssetSelect);
  const handleYearsChange = invalidateChart;
  
  // Handle chart view change - invalidate charts when switching between XIRR and Corpus
  const handleChartViewChange = (view: 'xirr' | 'corpus') => {
    setChartView(view);
    invalidateChart();
  };

  return (
    <Block position="relative">
      <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />
      
      {/* Page Description */}
      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          Simulate one-time investments and compare rolling returns across different time periods.
        </ParagraphMedium>
      </Block>
      
      <Block maxWidth="900px" margin="0 auto">
        <LumpsumPortfolioList
          lumpsumPortfolios={lumpsumPortfolios}
          setLumpsumPortfolios={setLumpsumPortfolios}
          funds={funds}
          onAssetSelect={(pIdx: number, idx: number, asset) => {
            invalidateChart();
            handleAssetSelect(pIdx, idx, asset);
          }}
          onAddAsset={handleAddFundInvalidate}
          onRemoveAsset={handleRemoveFundInvalidate}
          onAllocationChange={handleAllocationChangeInvalidate}
          onAddPortfolio={handleAddPortfolioInvalidate}
          COLORS={plotState.COLORS}
          useAssets={true}
          defaultSchemeCode={DEFAULT_SCHEME_CODE}
        />

        <LumpsumControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllPortfolios}
          anyInvalidAlloc={anyInvalidAlloc}
          onYearsChange={handleYearsChange}
          lumpsumAmount={lumpsumAmount}
          setLumpsumAmount={setLumpsumAmount}
          chartView={chartView}
          setChartView={handleChartViewChange}
        />
      </Block>

      <ChartArea
        xirrError={plotState.xirrError}
        hasPlotted={plotState.hasPlotted}
        navDatas={plotState.navDatas}
        lumpsumPortfolioXirrData={plotState.lumpSumXirrDatas}
        sipPortfolioXirrData={plotState.sipXirrDatas}
        funds={funds}
        COLORS={plotState.COLORS}
        loadingNav={plotState.loadingNav}
        loadingXirr={plotState.loadingXirr}
        lumpsumPortfolios={lumpsumPortfolios}
        years={years}
        amount={lumpsumAmount}
        chartView={chartView}
        isLumpsum={true}
      />
    </Block>
  );
};

