import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Container } from './components/common/Container';
import { useMutualFunds } from './hooks/useMutualFunds';
import { useNavData } from './hooks/useNavData';
import { Block } from 'baseui/block';
import { LoadingErrorStates } from './components/common/LoadingErrorStates';
import { AppNavBar } from 'baseui/app-nav-bar';
import { PortfolioSipHelpModal } from './components/portfolio/PortfolioSipHelpModal';
import { useInstrumentNavData } from './hooks/useInstrumentNavData';
import { PortfolioTab } from './pages/PortfolioTab';
import { HistoricalValuesTab } from './pages/HistoricalValuesTab';

const App: React.FC = () => {
  const { funds, loading, error } = useMutualFunds();
  const { loadNavData } = useNavData();
  const { loadNavData: loadInstrumentNavData } = useInstrumentNavData();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab is active based on route
  const isPortfolioTab = location.pathname === '/portfolio';
  const isHistoricalTab = location.pathname === '/historical';

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
            icon: () => (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            ),
            label: 'SIP Simulator',
            active: isPortfolioTab
          },
          { 
            icon: () => (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            ),
            label: 'Historical Values',
            active: isHistoricalTab
          }
        ]}
        onMainItemSelect={(item) => {
          navigate(item.label === 'SIP Simulator' ? '/portfolio' : '/historical');
        }}
        overrides={{
          Root: {
            style: {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      />

      <Block position="relative" backgroundColor="white" padding="1.5rem">
        <LoadingErrorStates loading={loading} error={error} />
        
        {/* Route handler for redirects */}
        <Routes>
          <Route path="/" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={null} />
          <Route path="/historical" element={null} />
        </Routes>
        
        {!loading && !error && funds.length > 0 && (
          <>
            {/* Keep both tabs mounted, just toggle visibility */}
            <Block display={isPortfolioTab ? 'block' : 'none'}>
              <PortfolioTab funds={funds} loadNavData={loadNavData} />
            </Block>
            
            <Block display={isHistoricalTab ? 'block' : 'none'}>
              <HistoricalValuesTab funds={funds} loadNavData={loadInstrumentNavData} />
            </Block>
          </>
        )}
        
        {/* Help Modal */}
        <PortfolioSipHelpModal isOpen={isHelpModalOpen} onClose={closeHelpModal} />
      </Block>
    </Container>
  );
};

export default App;