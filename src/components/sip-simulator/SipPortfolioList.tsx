import React from 'react';
import { SipAssetControls } from './SipAssetControls';
import { PortfolioListLayout } from '../common/PortfolioListLayout';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipPortfolio } from '../../types/sipPortfolio';
import { Asset } from '../../types/asset';

interface SipPortfolioListProps {
  sipPortfolios: SipPortfolio[];
  setSipPortfolios: React.Dispatch<React.SetStateAction<SipPortfolio[]>>;
  funds: mfapiMutualFund[];
  onAssetSelect: (pIdx: number, idx: number, asset: Asset | null) => void;
  onAddAsset: (pIdx: number) => void;
  onRemoveAsset: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onToggleRebalancing: (pIdx: number) => void;
  onRebalancingThresholdChange: (pIdx: number, value: number) => void;
  onToggleStepUp: (pIdx: number) => void;
  onStepUpPercentageChange: (pIdx: number, value: number) => void;
  onAddPortfolio: () => void;
  COLORS: string[];
  useAssets?: boolean;
  defaultSchemeCode?: number;
}

export const SipPortfolioList: React.FC<SipPortfolioListProps> = ({
  sipPortfolios,
  setSipPortfolios,
  funds,
  onAssetSelect,
  onAddAsset,
  onRemoveAsset,
  onAllocationChange,
  onToggleRebalancing,
  onRebalancingThresholdChange,
  onToggleStepUp,
  onStepUpPercentageChange,
  onAddPortfolio,
  COLORS,
  useAssets = false,
  defaultSchemeCode
}) => {
  const getAllocationSum = (portfolio: SipPortfolio) => 
    (portfolio.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);

  const renderPortfolioControls = (portfolio: SipPortfolio, pIdx: number) => (
    <SipAssetControls
      selectedAssets={portfolio.selectedAssets || []}
      allocations={portfolio.allocations}
      funds={funds}
      onAssetSelect={(idx, asset) => onAssetSelect(pIdx, idx, asset)}
      onAddAsset={() => onAddAsset(pIdx)}
      onRemoveAsset={idx => onRemoveAsset(pIdx, idx)}
      onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
      rebalancingEnabled={portfolio.rebalancingEnabled}
      onToggleRebalancing={() => onToggleRebalancing(pIdx)}
      rebalancingThreshold={portfolio.rebalancingThreshold}
      onRebalancingThresholdChange={value => onRebalancingThresholdChange(pIdx, value)}
      stepUpEnabled={portfolio.stepUpEnabled}
      onToggleStepUp={() => onToggleStepUp(pIdx)}
      stepUpPercentage={portfolio.stepUpPercentage}
      onStepUpPercentageChange={value => onStepUpPercentageChange(pIdx, value)}
      useAssets={useAssets}
      defaultSchemeCode={defaultSchemeCode}
    />
  );

  return (
    <PortfolioListLayout
      portfolios={sipPortfolios}
      setPortfolios={setSipPortfolios}
      COLORS={COLORS}
      onAddPortfolio={onAddPortfolio}
      getAllocationSum={getAllocationSum}
      renderPortfolioControls={renderPortfolioControls}
    />
  );
};
