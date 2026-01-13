import React from 'react';
import { BaseFundControls } from '../common/BaseFundControls';
import { Asset } from '../../types/asset';

interface LumpsumFundControlsProps {
  selectedAssets: (Asset | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onAssetSelect: (idx: number, asset: Asset | null) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  useAssets?: boolean;
  defaultSchemeCode?: number;
}

export const LumpsumFundControls: React.FC<LumpsumFundControlsProps> = ({
  selectedAssets,
  allocations,
  funds,
  onAssetSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  useAssets = true,
  defaultSchemeCode,
}) => {
  return (
    <BaseFundControls
      selectedAssets={selectedAssets}
      allocations={allocations}
      funds={funds}
      onAssetSelect={onAssetSelect}
      onAddFund={onAddFund}
      onRemoveFund={onRemoveFund}
      onAllocationChange={onAllocationChange}
      useAssets={useAssets}
      defaultSchemeCode={defaultSchemeCode}
    >
      {/* No additional controls for lumpsum */}
    </BaseFundControls>
  );
};

