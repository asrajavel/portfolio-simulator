import React from 'react';
import { useLocation } from 'react-router-dom';
import { RawInstrumentPanel } from '../components/raw-instrument/RawInstrumentPanel';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { Instrument } from '../types/instrument';

interface RawInstrumentTabProps {
  funds: mfapiMutualFund[];
  loadNavData: (instrument: Instrument) => Promise<any[]>;
}

export const RawInstrumentTab: React.FC<RawInstrumentTabProps> = ({ funds, loadNavData }) => {
  const location = useLocation();
  const isActive = location.pathname === '/raw';
  
  return (
    <RawInstrumentPanel 
      funds={funds}
      loadNavData={loadNavData}
      isActive={isActive}
    />
  );
};

