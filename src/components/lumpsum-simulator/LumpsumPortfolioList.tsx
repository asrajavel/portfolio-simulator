import React from 'react';
import { LumpsumAssetControls } from './LumpsumAssetControls';
import { PortfolioListLayout } from '../common/PortfolioListLayout';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { LumpsumPortfolio } from '../../types/lumpsumPortfolio';
import { Asset } from '../../types/asset';

interface LumpsumPortfolioListProps {
  lumpsumPortfolios: LumpsumPortfolio[];
  setLumpsumPortfolios: React.Dispatch<React.SetStateAction<LumpsumPortfolio[]>>;
  funds: mfapiMutualFund[];
  onAssetSelect: (pIdx: number, idx: number, asset: Asset | null) => void;
  onAddAsset: (pIdx: number) => void;
  onRemoveAsset: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onAddPortfolio: () => void;
  COLORS: string[];
  useAssets?: boolean;
  defaultSchemeCode?: number;
}

export const LumpsumPortfolioList: React.FC<LumpsumPortfolioListProps> = ({
  lumpsumPortfolios,
  setLumpsumPortfolios,
  funds,
  onAssetSelect,
  onAddAsset,
  onRemoveAsset,
  onAllocationChange,
  onAddPortfolio,
  COLORS,
  useAssets = false,
  defaultSchemeCode
}) => {
  const getAllocationSum = (portfolio: LumpsumPortfolio) => 
    (portfolio.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);

  const renderPortfolioControls = (portfolio: LumpsumPortfolio, pIdx: number) => (
    <LumpsumAssetControls
      selectedAssets={portfolio.selectedAssets || []}
      allocations={portfolio.allocations}
      funds={funds}
      onAssetSelect={(idx, asset) => onAssetSelect(pIdx, idx, asset)}
      onAddAsset={() => onAddAsset(pIdx)}
      onRemoveAsset={idx => onRemoveAsset(pIdx, idx)}
      onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
      useAssets={useAssets}
      defaultSchemeCode={defaultSchemeCode}
    />
  );

  return (
    <PortfolioListLayout
      portfolios={lumpsumPortfolios}
      setPortfolios={setLumpsumPortfolios}
      COLORS={COLORS}
      onAddPortfolio={onAddPortfolio}
      getAllocationSum={getAllocationSum}
      renderPortfolioControls={renderPortfolioControls}
    />
  );
};
