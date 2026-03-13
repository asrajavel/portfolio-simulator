import React from 'react';
import { Block } from 'baseui/block';
import { Select } from 'baseui/select';
import { AssetType } from '../../types/asset';

interface AssetTypeDropdownProps {
  value: AssetType;
  onChange: (type: AssetType) => void;
  disableInflation?: boolean;
}

const iconSize = 16;

const MutualFundIcon = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const IndexIcon = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const YahooIcon = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
    <rect width="24" height="24" rx="4" fill="#6001d2" />
    <text x="12" y="17.5" textAnchor="middle" fontFamily="Arial,Helvetica,sans-serif" fontWeight="bold" fontSize="15" fill="white">Y!</text>
  </svg>
);

const FixedReturnIcon = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#e67700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const InflationIcon = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.5-2.5 1.5-3.5l1 1z" />
  </svg>
);

const GovSchemeIcon = () => (
  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-6h6v6" />
    <path d="M10 10h4" />
  </svg>
);

const iconMap: Record<string, React.ReactNode> = {
  mutual_fund: <MutualFundIcon />,
  index_fund: <IndexIcon />,
  yahoo_finance: <YahooIcon />,
  fixed_return: <FixedReturnIcon />,
  inflation: <InflationIcon />,
  gov_scheme: <GovSchemeIcon />,
};

const OptionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>
    <span>{label}</span>
  </div>
);

const baseOptions = [
  { label: 'Mutual Fund', id: 'mutual_fund' },
  { label: 'Index (TRI)', id: 'index_fund' },
  { label: 'Yahoo Finance', id: 'yahoo_finance' },
  { label: 'Fixed Deposit', id: 'fixed_return' },
  { label: 'Inflation Rate', id: 'inflation' },
  { label: 'Govt Scheme', id: 'gov_scheme' }
];

export const AssetTypeDropdown: React.FC<AssetTypeDropdownProps> = ({ value, onChange, disableInflation = false }) => {
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
            width: '175px',
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
          },
          ValueContainer: {
            style: {
              paddingLeft: '8px'
            }
          },
        }}
        getOptionLabel={({ option }) => (
          <OptionLabel
            icon={iconMap[option?.id as string]}
            label={option?.label as string}
          />
        )}
        getValueLabel={({ option }) => (
          <OptionLabel
            icon={iconMap[option?.id as string]}
            label={option?.label as string}
          />
        )}
      />
    </Block>
  );
};