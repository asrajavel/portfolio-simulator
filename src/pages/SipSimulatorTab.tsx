import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ChartArea } from '../components/layout/ChartArea';
import { usePlotState } from '../hooks/usePlotState';
import { useSipStrategies } from '../hooks/useSipStrategies';
import { useSipPlot } from '../hooks/useSipPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { SipStrategyList } from '../components/sip-simulator/SipStrategyList';
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
    sipStrategies,
    setSipStrategies,
    years,
    setYears,
    handleAddStrategy,
    handleInstrumentSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
    handleToggleRebalancing,
    handleRebalancingThresholdChange,
    handleToggleStepUp,
    handleStepUpPercentageChange,
  } = useSipStrategies(DEFAULT_SCHEME_CODE, [sipAmount, setSipAmount], isActive);

  const { handlePlotAllStrategies } = useSipPlot({
    sipStrategies,
    years,
    loadNavData,
    plotState,
    sipAmount,
    chartView,
  });

  const anyInvalidAlloc = sipStrategies.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== ALLOCATION_TOTAL
  );

  // Use chart invalidation hook to wrap handlers
  const { invalidateChart, withInvalidation } = useChartInvalidation(plotState);

  // Wrap handlers with automatic chart invalidation
  const handleAddStrategyInvalidate = withInvalidation(handleAddStrategy);
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
        <SipStrategyList
          sipStrategies={sipStrategies}
          setSipStrategies={setSipStrategies}
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
          onAddStrategy={handleAddStrategyInvalidate}
          disableControls={plotState.loadingNav || plotState.loadingXirr}
          COLORS={plotState.COLORS}
          useInstruments={true}
          defaultSchemeCode={DEFAULT_SCHEME_CODE}
        />

        <ControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllStrategies}
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
        sipStrategyXirrData={plotState.sipXirrDatas}
        funds={funds}
        COLORS={plotState.COLORS}
        loadingNav={plotState.loadingNav}
        loadingXirr={plotState.loadingXirr}
        sipStrategies={sipStrategies}
        years={years}
        sipAmount={sipAmount}
        chartView={chartView}
      />
    </Block>
  );
};

