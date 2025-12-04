import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ChartArea } from '../components/layout/ChartArea';
import { usePlotState } from '../hooks/usePlotState';
import { usePortfolios } from '../hooks/usePortfolios';
import { usePortfolioPlot } from '../hooks/usePortfolioPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { PortfolioList } from '../components/portfolio/PortfolioList';
import { ControlsPanel } from '../components/controls/ControlsPanel';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from '../constants';

interface PortfolioTabProps {
  funds: mfapiMutualFund[];
  loadNavData: (schemeCode: number) => Promise<any[]>;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({ funds, loadNavData }) => {
  const location = useLocation();
  const isActive = location.pathname === '/portfolio';
  const plotState = usePlotState(loadNavData, funds);
  const [sipAmount, setSipAmount] = useState<number>(10000);
  const [chartView, setChartView] = useState<'xirr' | 'corpus'>('xirr');
  
  const {
    portfolios,
    setPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleInstrumentSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
    handleToggleRebalancing,
    handleRebalancingThresholdChange,
    handleToggleStepUp,
    handleStepUpPercentageChange,
  } = usePortfolios(DEFAULT_SCHEME_CODE, [sipAmount, setSipAmount], isActive);

  const { handlePlotAllPortfolios } = usePortfolioPlot({
    portfolios,
    years,
    loadNavData,
    plotState,
    sipAmount,
    chartView,
  });

  const anyInvalidAlloc = portfolios.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== ALLOCATION_TOTAL
  );

  // Use chart invalidation hook to wrap handlers
  const { invalidateChart, withInvalidation } = useChartInvalidation(plotState);

  // Wrap handlers with automatic chart invalidation
  const handleAddPortfolioInvalidate = withInvalidation(handleAddPortfolio);
  const handleAddFundInvalidate = withInvalidation(handleAddFund);
  const handleRemoveFundInvalidate = withInvalidation(handleRemoveFund);
  const handleAllocationChangeInvalidate = withInvalidation(handleAllocationChange);
  const handleInstrumentSelectInvalidate = withInvalidation(handleInstrumentSelect);
  const handleToggleRebalancingInvalidate = withInvalidation(handleToggleRebalancing);
  const handleRebalancingThresholdChangeInvalidate = withInvalidation(handleRebalancingThresholdChange);
  const handleToggleStepUpInvalidate = withInvalidation(handleToggleStepUp);
  const handleStepUpPercentageChangeInvalidate = withInvalidation(handleStepUpPercentageChange);
  const handleYearsChange = invalidateChart;
  
  // Handle chart view change - invalidate charts when switching between XIRR and Corpus
  const handleChartViewChange = (view: 'xirr' | 'corpus') => {
    setChartView(view);
    invalidateChart();
  };

  return (
    <Block position="relative">
      <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />
      
      <Block maxWidth="900px" margin="0 auto">
        <PortfolioList
          portfolios={portfolios}
          setPortfolios={setPortfolios}
          funds={funds}
          onInstrumentSelect={(pIdx: number, idx: number, instrument) => {
            invalidateChart();
            handleInstrumentSelect(pIdx, idx, instrument);
          }}
          onAddFund={handleAddFundInvalidate}
          onRemoveFund={handleRemoveFundInvalidate}
          onAllocationChange={handleAllocationChangeInvalidate}
          onToggleRebalancing={handleToggleRebalancingInvalidate}
          onRebalancingThresholdChange={handleRebalancingThresholdChangeInvalidate}
          onToggleStepUp={handleToggleStepUpInvalidate}
          onStepUpPercentageChange={handleStepUpPercentageChangeInvalidate}
          onAddPortfolio={handleAddPortfolioInvalidate}
          disableControls={plotState.loadingNav || plotState.loadingXirr}
          COLORS={plotState.COLORS}
          useInstruments={true}
          defaultSchemeCode={DEFAULT_SCHEME_CODE}
        />

        <ControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllPortfolios}
          disabled={plotState.loadingNav || plotState.loadingXirr}
          anyInvalidAlloc={anyInvalidAlloc}
          onYearsChange={handleYearsChange}
          sipAmount={sipAmount}
          setSipAmount={setSipAmount}
          chartView={chartView}
          setChartView={handleChartViewChange}
        />
      </Block>

      <ChartArea
        xirrError={plotState.xirrError}
        hasPlotted={plotState.hasPlotted}
        navDatas={plotState.navDatas}
        lumpSumXirrDatas={plotState.lumpSumXirrDatas}
        sipXirrDatas={plotState.sipXirrDatas}
        funds={funds}
        COLORS={plotState.COLORS}
        loadingNav={plotState.loadingNav}
        loadingXirr={plotState.loadingXirr}
        portfolios={portfolios}
        years={years}
        sipAmount={sipAmount}
        chartView={chartView}
      />
    </Block>
  );
};

