import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ChartArea } from '../components/layout/ChartArea';
import { usePlotState } from '../hooks/usePlotState';
import { useSipPortfolios } from '../hooks/useSipPortfolios';
import { useSipPlot } from '../hooks/useSipPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { SipPortfolioList } from '../components/sip-simulator/SipPortfolioList';
import { ControlsPanel } from '../components/controls/ControlsPanel';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from '../constants';

interface SipSimulatorTabProps {
  funds: mfapiMutualFund[];
  loadNavData: (schemeCode: number) => Promise<any[]>;
}

export const SipSimulatorTab: React.FC<SipSimulatorTabProps> = ({ funds, loadNavData }) => {
  const location = useLocation();
  const isActive = location.pathname === '/sip';
  const plotState = usePlotState(loadNavData, funds);
  const [sipAmount, setSipAmount] = useState<number>(10000);
  const [chartView, setChartView] = useState<'xirr' | 'corpus'>('xirr');
  
  const {
    sipPortfolios,
    setSipPortfolios,
    years,
    setYears,
    handleAddPortfolio,
    handleAssetSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
    handleToggleRebalancing,
    handleRebalancingThresholdChange,
    handleToggleStepUp,
    handleStepUpPercentageChange,
  } = useSipPortfolios(DEFAULT_SCHEME_CODE, [sipAmount, setSipAmount], isActive);

  const { handlePlotAllPortfolios } = useSipPlot({
    sipPortfolios,
    years,
    loadNavData,
    plotState,
    sipAmount,
    chartView,
  });

  const anyInvalidAlloc = sipPortfolios.some(
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
        <SipPortfolioList
          sipPortfolios={sipPortfolios}
          setSipPortfolios={setSipPortfolios}
          funds={funds}
          onAssetSelect={(pIdx: number, idx: number, asset) => {
            invalidateChart();
            handleAssetSelect(pIdx, idx, asset);
          }}
          onAddAsset={handleAddFundInvalidate}
          onRemoveAsset={handleRemoveFundInvalidate}
          onAllocationChange={handleAllocationChangeInvalidate}
          onToggleRebalancing={handleToggleRebalancingInvalidate}
          onRebalancingThresholdChange={handleRebalancingThresholdChangeInvalidate}
          onToggleStepUp={handleToggleStepUpInvalidate}
          onStepUpPercentageChange={handleStepUpPercentageChangeInvalidate}
          onAddPortfolio={handleAddPortfolioInvalidate}
          COLORS={plotState.COLORS}
          useAssets={true}
          defaultSchemeCode={DEFAULT_SCHEME_CODE}
        />

        <ControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllPortfolios}
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
        sipPortfolioXirrData={plotState.sipXirrDatas}
        funds={funds}
        COLORS={plotState.COLORS}
        loadingNav={plotState.loadingNav}
        loadingXirr={plotState.loadingXirr}
        sipPortfolios={sipPortfolios}
        years={years}
        amount={sipAmount}
        chartView={chartView}
        isLumpsum={false}
      />
    </Block>
  );
};

