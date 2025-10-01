import React, { useState } from 'react';
import { Container } from './components/common/Container';
import { useMutualFunds } from './hooks/useMutualFunds';
import { useNavData } from './hooks/useNavData';
import { LoadingOverlay } from './components/common/LoadingOverlay';
import { ChartArea } from './components/layout/ChartArea';
import { usePlotState } from './hooks/usePlotState';
import { usePortfolios } from './hooks/usePortfolios';
import { usePortfolioPlot } from './hooks/usePortfolioPlot';
import { Block } from 'baseui/block';
import { LoadingErrorStates } from './components/common/LoadingErrorStates';
import { PortfolioList } from './components/portfolio/PortfolioList';
import { ControlsPanel } from './components/controls/ControlsPanel';
import { HeadingLarge } from 'baseui/typography';
import { Button } from 'baseui/button';
import { PortfolioSipHelpModal } from './components/portfolio/PortfolioSipHelpModal';

const DEFAULT_SCHEME_CODE = 120716;

const App: React.FC = () => {
  const { funds, loading, error } = useMutualFunds();
  const { loadNavData } = useNavData();
  const plotState = usePlotState(loadNavData, funds);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
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
  } = usePortfolios(DEFAULT_SCHEME_CODE);

  const { handlePlotAllPortfolios } = usePortfolioPlot({
    portfolios,
    years,
    loadNavData,
    plotState,
  });

  const anyInvalidAlloc = portfolios.some(
    p => (p.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0) !== 100
  );

  // Helper to invalidate chart
  const invalidateChart = () => {
    plotState.setHasPlotted(false);
    plotState.setNavDatas({});
    plotState.setLumpSumXirrDatas({});
    plotState.setSipXirrDatas({});
    plotState.setXirrError(null);
  };

  // Wrapped handlers to invalidate chart on change
  const handleAddPortfolioInvalidate = () => {
    invalidateChart();
    handleAddPortfolio();
  };
  const handleAddFundInvalidate = (pIdx: number) => {
    invalidateChart();
    handleAddFund(pIdx);
  };
  const handleRemoveFundInvalidate = (pIdx: number, idx: number) => {
    invalidateChart();
    handleRemoveFund(pIdx, idx);
  };
  const handleAllocationChangeInvalidate = (pIdx: number, idx: number, value: number) => {
    invalidateChart();
    handleAllocationChange(pIdx, idx, value);
  };
  const handleToggleRebalancingInvalidate = (pIdx: number) => {
    invalidateChart();
    handleToggleRebalancing(pIdx);
  };
  const handleRebalancingThresholdChangeInvalidate = (pIdx: number, value: number) => {
    invalidateChart();
    handleRebalancingThresholdChange(pIdx, value);
  };

  const handleYearsChange = () => {
    plotState.setHasPlotted(false);
    plotState.setNavDatas({});
    plotState.setLumpSumXirrDatas({});
    plotState.setSipXirrDatas({});
    plotState.setXirrError(null);
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