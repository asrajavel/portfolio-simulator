import React, { useEffect } from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { Asset, InflationAsset } from '../../types/asset';

interface InflationSelectorProps {
  onSelect: (asset: Asset | null) => void;
  value?: Asset;
}

const countryOptions = [
  { label: 'India - Consumer Price Index', id: 'IND' },
  { label: 'USA - Consumer Price Index', id: 'USA' }
];

export const InflationSelector: React.FC<InflationSelectorProps> = ({ onSelect, value }) => {
  // Get current country code from value or default to India
  const currentCountryCode = value && value.type === 'inflation' ? value.countryCode : 'IND';
  const selectedValue = countryOptions.filter(option => option.id === currentCountryCode);

  // Auto-select India on mount if no value
  useEffect(() => {
    if (!value) {
      const defaultInflation: InflationAsset = {
        type: 'inflation',
        id: 'inflation_IND',
        name: 'India - Consumer Price Index',
        countryCode: 'IND',
        displayName: 'India - Consumer Price Index'
      };
      onSelect(defaultInflation);
    }
  }, [value, onSelect]);

  const handleChange = (params: any) => {
    if (params.value && params.value.length > 0) {
      const countryCode = params.value[0].id;
      const countryName = params.value[0].label;
      
      const inflationAsset: InflationAsset = {
        type: 'inflation',
        id: `inflation_${countryCode}`,
        name: countryName,
        countryCode: countryCode,
        displayName: countryName
      };
      onSelect(inflationAsset);
    } else {
      onSelect(null);
    }
  };

  return (
    <Block
      overrides={{
        Block: {
          style: {
            minWidth: '400px',
            flexGrow: 1,
            flexShrink: 1
          }
        }
      }}
    >
      <Select
        options={countryOptions}
        value={selectedValue}
        onChange={handleChange}
        size="compact"
        clearable={false}
        searchable={false}
        placeholder="Select Country"
        overrides={{
          Root: {
            style: {
              width: '100%'
            }
          }
        }}
      />
    </Block>
  );
};

