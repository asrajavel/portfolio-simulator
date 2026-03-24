import React from 'react';
import { AssetType, Asset } from '../../types/asset';
import { MutualFundSelector } from './MutualFundSelector';
import { IndexSelector } from './IndexSelector';
import { YahooFinanceSelector } from './YahooFinanceSelector';
import { FixedReturnSelector } from './FixedReturnSelector';
import { InflationSelector } from './InflationSelector';
import { GovSchemeSelector } from './GovSchemeSelector';

interface AssetDropdownProps {
  assetType: AssetType;
  onSelect: (asset: Asset | null) => void;
  value?: Asset;
  defaultSchemeCode?: number;
  excludeSchemeCodes?: number[];
}

export const AssetDropdown: React.FC<AssetDropdownProps> = ({ 
  assetType, 
  onSelect, 
  value,
  defaultSchemeCode,
  excludeSchemeCodes,
}) => {
  if (assetType === 'mutual_fund') {
    return (
      <MutualFundSelector
        onSelect={onSelect}
        value={value}
        defaultSchemeCode={defaultSchemeCode}
        excludeSchemeCodes={excludeSchemeCodes}
      />
    );
  }

  if (assetType === 'index_fund') {
    return (
      <IndexSelector
        onSelect={onSelect}
        value={value}
      />
    );
  }

  if (assetType === 'yahoo_finance') {
    return (
      <YahooFinanceSelector
        onSelect={onSelect}
        value={value}
      />
    );
  }

  if (assetType === 'fixed_return') {
    return (
      <FixedReturnSelector
        onSelect={onSelect}
        value={value}
      />
    );
  }

  if (assetType === 'inflation') {
    return (
      <InflationSelector
        onSelect={onSelect}
        value={value}
      />
    );
  }

  if (assetType === 'gov_scheme') {
    return (
      <GovSchemeSelector
        onSelect={onSelect}
        value={value}
      />
    );
  }

  return null;
};
