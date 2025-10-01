import React from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { InstrumentType } from '../../types/instrument';

interface InstrumentTypeDropdownProps {
  value: InstrumentType;
  onChange: (type: InstrumentType) => void;
}

const options = [
  { label: 'Mutual Fund', id: 'mutual_fund' },
  { label: 'Index (TRI)', id: 'index_fund' },
  { label: 'Yahoo Finance', id: 'yahoo_finance' }
];

export const InstrumentTypeDropdown: React.FC<InstrumentTypeDropdownProps> = ({ value, onChange }) => {
  const selectedValue = options.filter(option => option.id === value);

  const handleChange = (params: any) => {
    if (params.value && params.value.length > 0) {
      onChange(params.value[0].id as InstrumentType);
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