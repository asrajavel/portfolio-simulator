import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Block } from 'baseui/block';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { ChartArea } from '../components/layout/ChartArea';
import { usePlotState } from '../hooks/usePlotState';
import { useLumpsumStrategies } from '../hooks/useLumpsumStrategies';
import { useLumpsumPlot } from '../hooks/useLumpsumPlot';
import { useChartInvalidation } from '../hooks/useChartInvalidation';
import { LumpsumStrategyList } from '../components/lumpsum-simulator/LumpsumStrategyList';
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
    lumpsumStrategies,
    setLumpsumStrategies,
    years,
    setYears,
    handleAddStrategy,
    handleInstrumentSelect,
    handleAddFund,
    handleRemoveFund,
    handleAllocationChange,
  } = useLumpsumStrategies(DEFAULT_SCHEME_CODE, [lumpsumAmount, setLumpsumAmount], isActive);

  const { handlePlotAllStrategies } = useLumpsumPlot({
    lumpsumStrategies,
    years,
    loadNavData,
    plotState,
    lumpsumAmount,
    chartView,
  });

  const anyInvalidAlloc = lumpsumStrategies.some(
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
        <LumpsumStrategyList
          lumpsumStrategies={lumpsumStrategies}
          setLumpsumStrategies={setLumpsumStrategies}
          funds={funds}
          onInstrumentSelect={(pIdx: number, idx: number, instrument) => {
            invalidateChart();
            handleInstrumentSelect(pIdx, idx, instrument);
          }}
          onAddFund={handleAddFundInvalidate}
          onRemoveFund={handleRemoveFundInvalidate}
          onAllocationChange={handleAllocationChangeInvalidate}
          onAddStrategy={handleAddStrategyInvalidate}
          disableControls={plotState.loadingNav || plotState.loadingXirr}
          COLORS={plotState.COLORS}
          useInstruments={true}
          defaultSchemeCode={DEFAULT_SCHEME_CODE}
        />

        <LumpsumControlsPanel
          years={years}
          setYears={setYears}
          onPlot={handlePlotAllStrategies}
          disabled={plotState.loadingNav || plotState.loadingXirr}
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
        lumpsumStrategyXirrData={plotState.lumpSumXirrDatas}
        sipStrategyXirrData={plotState.sipXirrDatas}
        funds={funds}
        COLORS={plotState.COLORS}
        loadingNav={plotState.loadingNav}
        loadingXirr={plotState.loadingXirr}
        years={years}
        amount={lumpsumAmount}
        chartView={chartView}
        isLumpsum={true}
      />
    </Block>
  );
};

