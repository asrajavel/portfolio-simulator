import React from 'react';
import { AssetType, Asset } from '../../types/asset';
import { MutualFundSelector } from './MutualFundSelector';
import { IndexSelector } from './IndexSelector';
import { YahooFinanceSelector } from './YahooFinanceSelector';
import { FixedReturnSelector } from './FixedReturnSelector';
import { InflationSelector } from './InflationSelector';

interface AssetDropdownProps {
  assetType: AssetType;
  funds: { schemeCode: number; schemeName: string }[];
  onSelect: (asset: Asset | null) => void;
  value?: Asset;
  defaultSchemeCode?: number;
}

export const AssetDropdown: React.FC<AssetDropdownProps> = ({ 
  assetType, 
  funds, 
  onSelect, 
  value,
  defaultSchemeCode
}) => {
  if (assetType === 'mutual_fund') {
    return (
      <MutualFundSelector
        funds={funds}
        onSelect={onSelect}
        value={value}
        defaultSchemeCode={defaultSchemeCode}
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

  return null;
};