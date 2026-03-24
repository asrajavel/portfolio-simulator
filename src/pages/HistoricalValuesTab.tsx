import React from 'react';
import { useLocation } from 'react-router-dom';
import { HistoricalValuesPanel } from '../components/historical-values/HistoricalValuesPanel';
import { Asset } from '../types/asset';

interface HistoricalValuesTabProps {
  loadNavData: (asset: Asset) => Promise<any[]>;
}

export const HistoricalValuesTab: React.FC<HistoricalValuesTabProps> = ({ loadNavData }) => {
  const location = useLocation();
  const isActive = location.pathname === '/historical';
  
  return (
    <HistoricalValuesPanel 
      loadNavData={loadNavData}
      isActive={isActive}
    />
  );
};

