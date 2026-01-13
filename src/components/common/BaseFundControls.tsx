import React, { useState, useEffect } from 'react';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { AssetTypeDropdown } from '../controls/AssetTypeDropdown';
import { AssetDropdown } from '../controls/AssetDropdown';
import { AssetType, Asset } from '../../types/asset';

interface BaseFundControlsProps {
  selectedAssets: (Asset | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onAssetSelect: (idx: number, asset: Asset | null) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  useAssets?: boolean;
  defaultSchemeCode?: number;
  children?: React.ReactNode; // For additional controls (SIP-specific)
}

export const BaseFundControls: React.FC<BaseFundControlsProps> = ({
  selectedAssets,
  allocations,
  funds,
  onAssetSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  useAssets = true,
  defaultSchemeCode,
  children,
}) => {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>(() => {
    return selectedAssets.map(inst => inst?.type || 'mutual_fund' as AssetType);
  });

  // Update assetTypes when selectedAssets changes
  useEffect(() => {
    setAssetTypes(prev => {
      const newTypes = selectedAssets.map((inst, idx) => {
        return inst?.type || prev[idx] || 'mutual_fund' as AssetType;
      });
      return newTypes;
    });
  }, [selectedAssets]);

  // Check if inflation exists in any asset
  const hasInflation = selectedAssets.some(inst => inst?.type === 'inflation');

  // Check if there are other assets besides the current index
  const hasOtherAssets = (idx: number) => {
    return selectedAssets.some((inst, i) => i !== idx && inst !== null);
  };

  const handleAssetTypeChange = (idx: number, type: AssetType) => {
    const newTypes = [...assetTypes];
    newTypes[idx] = type;
    setAssetTypes(newTypes);
    
    // Clear the current selection and set default when switching types
    if (type === 'mutual_fund') {
      const defaultFund = funds.find(f => f.schemeName.toLowerCase().includes('uti nifty 50')) || funds[0];
      if (defaultFund) {
        const defaultAsset: Asset = {
          type: 'mutual_fund',
          id: defaultFund.schemeCode,
          name: defaultFund.schemeName,
          schemeCode: defaultFund.schemeCode,
          schemeName: defaultFund.schemeName
        };
        onAssetSelect(idx, defaultAsset);
      }
    } else if (type === 'index_fund') {
      onAssetSelect(idx, null);
    } else if (type === 'yahoo_finance') {
      onAssetSelect(idx, null);
    } else if (type === 'fixed_return') {
      const defaultFixedReturn: Asset = {
        type: 'fixed_return',
        id: 'fixed_8',
        name: 'Fixed 8% Return',
        annualReturnPercentage: 8,
        displayName: 'Fixed 8% Return'
      };
      onAssetSelect(idx, defaultFixedReturn);
    } else if (type === 'inflation') {
      const defaultInflation: Asset = {
        type: 'inflation',
        id: 'inflation_IND',
        name: 'India - Consumer Price Index',
        countryCode: 'IND',
        displayName: 'India - Consumer Price Index'
      };
      onAssetSelect(idx, defaultInflation);
    }
  };

  return (
    <>
      {selectedAssets?.map((item, idx) => (
        <Block key={idx} display="flex" alignItems="center" marginBottom="scale200" gridGap="scale300">
          <AssetTypeDropdown
            value={assetTypes[idx] || 'mutual_fund'}
            onChange={(type) => handleAssetTypeChange(idx, type)}
            disableInflation={hasOtherAssets(idx)}
          />
          <AssetDropdown
            assetType={assetTypes[idx] || 'mutual_fund'}
            funds={funds.filter(f => 
              selectedAssets.every((inst, i) => 
                i === idx || !inst || inst.type !== 'mutual_fund' || inst.id !== f.schemeCode
              )
            )}
            onSelect={(asset) => onAssetSelect(idx, asset)}
            value={selectedAssets?.[idx] ?? undefined}
            defaultSchemeCode={defaultSchemeCode}
          />
          <Input
            type="number"
            min={0}
            max={100}
            value={allocations[idx] ?? 0}
            onChange={e => onAllocationChange(idx, Number((e.target as HTMLInputElement).value))}
            disabled={hasInflation}
            size="compact"
            overrides={{
              Root: {
                style: {
                  width: '100px',
                  flexShrink: 0
                }
              },
              After: () => (
                <Block
                  overrides={{
                    Block: {
                      style: {
                        fontSize: '14px',
                        color: '#6b7280',
                        paddingRight: '8px',
                        alignSelf: 'center'
                      }
                    }
                  }}
                >
                  %
                </Block>
              ),
            }}
          />
          <Button
            kind="tertiary"
            size="mini"
            onClick={() => onRemoveFund(idx)}
            disabled={(selectedAssets?.length ?? 0) <= 1}
            overrides={{
              BaseButton: {
                style: ({ $theme }) => ({
                  marginLeft: $theme.sizing.scale300,
                  color: $theme.colors.contentSecondary,
                  ':hover': {
                    color: $theme.colors.contentPrimary,
                  },
                  ':disabled': {
                    color: $theme.colors.contentTertiary,
                  },
                }),
              },
            }}
            title="Remove fund"
          >
            ✕
          </Button>
        </Block>
      ))}
      <Block marginTop="scale300">
        <Button
          kind="primary"
          size="compact"
          onClick={onAddFund}
          disabled={hasInflation}
        >
          + Asset
        </Button>
        {children}
      </Block>
    </>
  );
};

