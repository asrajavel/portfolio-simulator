import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Container } from './components/common/Container';
import { useMutualFunds } from './hooks/useMutualFunds';
import { useNavData } from './hooks/useNavData';
import { Block } from 'baseui/block';
import { LoadingErrorStates } from './components/common/LoadingErrorStates';
import { AppNavBar } from 'baseui/app-nav-bar';
import { useInstrumentNavData } from './hooks/useInstrumentNavData';
import { LumpsumSimulatorTab } from './pages/LumpsumSimulatorTab';
import { SipSimulatorTab } from './pages/SipSimulatorTab';
import { HistoricalValuesTab } from './pages/HistoricalValuesTab';
import { BottomBar } from './components/layout/BottomBar';
import { HelpProvider, HelpDrawer, useHelp } from './components/help';
import { trackPageView } from './utils/analytics';
import { ToasterContainer } from 'baseui/toast';
import { setGlobalOpenHelp } from './services/yahooFinanceService';

const AppContent: React.FC = () => {
  const { funds, loading, error } = useMutualFunds();
  const { loadNavData } = useNavData();
  const { loadNavData: loadInstrumentNavData } = useInstrumentNavData();
  const navigate = useNavigate();
  const location = useLocation();
  const { openHelp } = useHelp();

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Register openHelp for toast error messages
  useEffect(() => {
    setGlobalOpenHelp(openHelp);
  }, [openHelp]);

  // Determine which tab is active based on route
  const isLumpsumTab = location.pathname === '/lumpsum';
  const isSipTab = location.pathname === '/sip';
  const isHistoricalTab = location.pathname === '/historical';

  return (
    <Container>
      <ToasterContainer autoHideDuration={5000} />
      <AppNavBar
        title="Indian Investment Analysis"
        mainItems={[
          { 
            label: 'Lumpsum Simulator',
            active: isLumpsumTab
          },
          { 
            label: 'SIP Simulator',
            active: isSipTab
          },
          { 
            label: 'Historical Values',
            active: isHistoricalTab
          },
          {
            label: 'Help',
            info: { id: 'help' }
          }
        ]}
        onMainItemSelect={(item) => {
          if (item.label === 'Lumpsum Simulator') navigate('/lumpsum');
          else if (item.label === 'SIP Simulator') navigate('/sip');
          else if (item.label === 'Help') openHelp('getting-started');
          else navigate('/historical');
        }}
        overrides={{
          Root: {
            style: {
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      />

      <Block position="relative" backgroundColor="white" padding="1.5rem" flex="1" display="flex" flexDirection="column">
        <LoadingErrorStates loading={loading} error={error} />
        
        {/* Route handler for redirects */}
        <Routes>
          <Route path="/" element={<Navigate to="/lumpsum" replace />} />
          <Route path="/lumpsum" element={null} />
          <Route path="/sip" element={null} />
          <Route path="/historical" element={null} />
          {/* Legacy route redirect */}
          <Route path="/portfolio" element={<Navigate to="/sip" replace />} />
        </Routes>
        
        {!loading && !error && funds.length > 0 && (
          <>
            {/* Keep all tabs mounted, just toggle visibility */}
            <Block display={isLumpsumTab ? 'block' : 'none'} flex="1">
              <LumpsumSimulatorTab funds={funds} loadNavData={loadNavData} />
            </Block>
            
            <Block display={isSipTab ? 'block' : 'none'} flex="1">
              <SipSimulatorTab funds={funds} loadNavData={loadNavData} />
            </Block>
            
            <Block display={isHistoricalTab ? 'block' : 'none'} flex="1">
              <HistoricalValuesTab funds={funds} loadNavData={loadInstrumentNavData} />
            </Block>
          </>
        )}
      </Block>
      
      {/* Bottom Bar - always at bottom */}
      <BottomBar />
      
      {/* Help Drawer - accessible from anywhere */}
      <HelpDrawer />
    </Container>
  );
};

const App: React.FC = () => {
  return (
    <HelpProvider>
      <AppContent />
    </HelpProvider>
  );
};

export default App;