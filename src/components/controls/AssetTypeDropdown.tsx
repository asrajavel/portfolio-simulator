import React from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { AssetType } from '../../types/asset';

interface AssetTypeDropdownProps {
  value: AssetType;
  onChange: (type: AssetType) => void;
  disableInflation?: boolean;
}

const baseOptions = [
  { label: 'Mutual Fund', id: 'mutual_fund' },
  { label: 'Index (TRI)', id: 'index_fund' },
  { label: 'Yahoo Finance', id: 'yahoo_finance' },
  { label: 'Fixed Annual Return', id: 'fixed_return' },
  { label: 'Inflation Rate', id: 'inflation' }
];

export const AssetTypeDropdown: React.FC<AssetTypeDropdownProps> = ({ value, onChange, disableInflation = false }) => {
  // Add disabled property to inflation option when needed
  const options = baseOptions.map(option => ({
    ...option,
    disabled: disableInflation && option.id === 'inflation'
  }));

  const selectedValue = options.filter(option => option.id === value);

  const handleChange = (params: any) => {
    if (params.value && params.value.length > 0) {
      onChange(params.value[0].id as AssetType);
    }
  };

  return (
    <Block
      overrides={{
        Block: {
          style: {
            width: '140px',
            flexShrink: 0
          }
        }
      }}
    >
      <Select
        options={options}
        value={selectedValue}
        onChange={handleChange}
        size="compact"
        clearable={false}
        searchable={false}
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