import React from 'react';
import { BaseAssetControls } from '../common/BaseAssetControls';
import { Asset } from '../../types/asset';

interface LumpsumAssetControlsProps {
  selectedAssets: (Asset | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onAssetSelect: (idx: number, asset: Asset | null) => void;
  onAddAsset: () => void;
  onRemoveAsset: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  useAssets?: boolean;
  defaultSchemeCode?: number;
}

export const LumpsumAssetControls: React.FC<LumpsumAssetControlsProps> = ({
  selectedAssets,
  allocations,
  funds,
  onAssetSelect,
  onAddAsset,
  onRemoveAsset,
  onAllocationChange,
  useAssets = true,
  defaultSchemeCode,
}) => {
  return (
    <BaseAssetControls
      selectedAssets={selectedAssets}
      allocations={allocations}
      funds={funds}
      onAssetSelect={onAssetSelect}
      onAddAsset={onAddAsset}
      onRemoveAsset={onRemoveAsset}
      onAllocationChange={onAllocationChange}
      useAssets={useAssets}
      defaultSchemeCode={defaultSchemeCode}
    >
      {/* No additional controls for lumpsum */}
    </BaseAssetControls>
  );
};

