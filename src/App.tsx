import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Container } from './components/common/Container';
import { useMutualFunds, MutualFundsProvider } from './hooks/useMutualFunds';
import { useNavData } from './hooks/useNavData';
import { Block } from 'baseui/block';
import { AppNavBar } from 'baseui/app-nav-bar';
import { useAssetNavData } from './hooks/useAssetNavData';
import { LumpsumSimulatorTab } from './pages/LumpsumSimulatorTab';
import { SipSimulatorTab } from './pages/SipSimulatorTab';
import { HistoricalValuesTab } from './pages/HistoricalValuesTab';
import { BottomBar } from './components/layout/BottomBar';
import { HelpProvider, HelpDrawer, useHelp } from './components/help';
import { trackPageView } from './utils/analytics';
import { ToasterContainer } from 'baseui/toast';
import { setGlobalOpenHelp } from './services/yahooFinanceService';
import { TrackerTab } from './pages/TrackerTab';

const AppContent: React.FC = () => {
  const mutualFundsState = useMutualFunds();
  const { loadNavData } = useNavData();
  const { loadNavData: loadAssetNavData } = useAssetNavData();
  const navigate = useNavigate();
  const location = useLocation();
  const { openHelp } = useHelp();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    setGlobalOpenHelp(openHelp);
  }, [openHelp]);

  const isLumpsumTab = location.pathname === '/lumpsum';
  const isSipTab = location.pathname === '/sip';
  const isHistoricalTab = location.pathname === '/historical';
  const isTrackerTab = location.pathname === '/tracker';

  return (
    <MutualFundsProvider value={mutualFundsState}>
      <Container>
        <ToasterContainer autoHideDuration={5000} />
        <AppNavBar
          title="Portfolio Simulator"
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
            else if (item.label === 'Tracker') navigate('/tracker');
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
          <Routes>
            <Route path="/" element={<Navigate to="/lumpsum" replace />} />
            <Route path="/lumpsum" element={null} />
            <Route path="/sip" element={null} />
            <Route path="/historical" element={null} />
            <Route path="/tracker" element={null} />
            <Route path="/portfolio" element={<Navigate to="/sip" replace />} />
          </Routes>
          
          <Block display={isLumpsumTab ? 'block' : 'none'} flex="1">
            <LumpsumSimulatorTab loadNavData={loadNavData} />
          </Block>
          
          <Block display={isSipTab ? 'block' : 'none'} flex="1">
            <SipSimulatorTab loadNavData={loadNavData} />
          </Block>
          
          <Block display={isHistoricalTab ? 'block' : 'none'} flex="1">
            <HistoricalValuesTab loadNavData={loadAssetNavData} />
          </Block>
          
          <Block display={isTrackerTab ? 'block' : 'none'} flex="1">
            <TrackerTab />
          </Block>
        </Block>
        
        <BottomBar />
        <HelpDrawer />
      </Container>
    </MutualFundsProvider>
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
