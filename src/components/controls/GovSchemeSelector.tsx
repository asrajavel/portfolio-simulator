import React, { useEffect } from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { Asset, GovSchemeAsset, GovSchemeType } from '../../types/asset';

interface GovSchemeSelectorProps {
  onSelect: (asset: Asset | null) => void;
  value?: Asset;
}

const schemeOptions = [
  { label: 'PPF - Public Provident Fund', id: 'ppf' },
  { label: 'EPF - Employee Provident Fund', id: 'epf' },
];

const schemeDisplayNames: Record<string, string> = {
  ppf: 'PPF',
  epf: 'EPF',
};

function createGovSchemeAsset(scheme: GovSchemeType, label: string): GovSchemeAsset {
  return {
    type: 'gov_scheme',
    id: `gov_${scheme}`,
    name: label,
    scheme,
    displayName: schemeDisplayNames[scheme] || label,
  };
}

export const GovSchemeSelector: React.FC<GovSchemeSelectorProps> = ({ onSelect, value }) => {
  const currentScheme = value && value.type === 'gov_scheme' ? value.scheme : 'ppf';
  const selectedValue = schemeOptions.filter(option => option.id === currentScheme);

  useEffect(() => {
    if (!value) {
      onSelect(createGovSchemeAsset('ppf', 'PPF - Public Provident Fund'));
    }
  }, [value, onSelect]);

  const handleChange = (params: any) => {
    if (params.value && params.value.length > 0) {
      const scheme = params.value[0].id as GovSchemeType;
      const label = params.value[0].label;
      onSelect(createGovSchemeAsset(scheme, label));
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
        options={schemeOptions}
        value={selectedValue}
        onChange={handleChange}
        size="compact"
        clearable={false}
        searchable={false}
        placeholder="Select Scheme"
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
