import React, { useState } from 'react';
import { Container } from './components/common/Container';
import { useMutualFunds } from './hooks/useMutualFunds';
import { useNavData } from './hooks/useNavData';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { ChartArea } from './components/layout/ChartArea';
import { usePlotState } from './hooks/usePlotState';
import { usePortfolios } from './hooks/usePortfolios';
import { usePortfolioPlot } from './hooks/usePortfolioPlot';
import { useChartInvalidation } from './hooks/useChartInvalidation';
import { Block } from 'baseui/block';
import { LoadingErrorStates } from './components/common/LoadingErrorStates';
import { PortfolioList } from './components/portfolio/PortfolioList';
import { ControlsPanel } from './components/controls/ControlsPanel';
import { AppNavBar } from 'baseui/app-nav-bar';
import { PortfolioSipHelpModal } from './components/portfolio/PortfolioSipHelpModal';
import { DEFAULT_SCHEME_CODE, ALLOCATION_TOTAL } from './constants';

const App: React.FC = () => {
  const { funds, loading, error } = useMutualFunds();
  const { loadNavData } = useNavData();
  const plotState = usePlotState(loadNavData, funds);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
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
  } = usePortfolios(DEFAULT_SCHEME_CODE, [sipAmount, setSipAmount]);

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

  const handleHelpClick = () => {
    setIsHelpModalOpen(true);
  };

  const closeHelpModal = () => {
    setIsHelpModalOpen(false);
  };

  return (
    <Container>
      <AppNavBar
        title="Indian Investment Analysis"
        mainItems={[
          { 
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            ),
            label: 'Portfolio SIP Simulator',
            active: true
          }
        ]}
        onMainItemSelect={() => {}}
        overrides={{
          Root: {
            style: {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      />
      
      <Block position="relative" backgroundColor="white" padding="1.5rem">
        <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />
        
        <LoadingErrorStates loading={loading} error={error} />
        
        {!loading && !error && funds.length > 0 && (
          <>
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
          </>
        )}
        
        {/* Help Modal */}
        <PortfolioSipHelpModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
      </Block>
    </Container>
  );
};

export default App;