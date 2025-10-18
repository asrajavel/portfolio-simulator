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
import { HeadingLarge } from 'baseui/typography';
import { Button } from 'baseui/button';
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
      <Block position="relative">
        <LoadingOverlay active={plotState.loadingNav || plotState.loadingXirr} />
        
        <LoadingErrorStates loading={loading} error={error} />
        
        {!loading && !error && funds.length > 0 && (
          <>
            <Block maxWidth="900px" margin="0 auto">
              <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="2rem">
                <HeadingLarge
                  overrides={{
                    Block: {
                      style: ({ $theme }) => ({
                        margin: 0,
                        color: $theme.colors.contentPrimary,
                        fontWeight: '600'
                      })
                    }
                  }}
                >
                  Portfolio SIP Simulator
                </HeadingLarge>
                
                <Button
                  onClick={handleHelpClick}
                  kind="tertiary"
                  size="compact"
                  overrides={{
                    BaseButton: {
                      style: ({ $theme }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        ':hover': {
                          backgroundColor: $theme.colors.backgroundSecondary
                        }
                      })
                    }
                  }}
                  title="How to use Portfolio SIP Simulator"
                >
                  ❓ Help
                </Button>
              </Block>
              
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