import React, { useState, useEffect } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { LabelLarge, ParagraphMedium } from 'baseui/typography';
import { AssetTypeDropdown } from '../controls/AssetTypeDropdown';
import { AssetDropdown } from '../controls/AssetDropdown';
import { AssetType, Asset } from '../../types/asset';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { HistoricalValuesChart } from './HistoricalValuesChart';
import { fillMissingNavDates } from '../../utils/data/fillMissingNavDates';
import { COLORS } from '../../constants';
import { getQueryParams, setHistoricalValuesParams } from '../../utils/browser/queryParams';

interface AssetEntry {
  assetType: AssetType;
  asset: Asset | null;
}

interface HistoricalValuesPanelProps {
  funds: mfapiMutualFund[];
  loadNavData: (asset: Asset) => Promise<any[]>;
  isActive?: boolean;
}

export const HistoricalValuesPanel: React.FC<HistoricalValuesPanelProps> = ({
  funds,
  loadNavData,
  isActive = true
}) => {
  const queryParams = getQueryParams();
  
  const [assets, setAssets] = useState<AssetEntry[]>(() => {
    if (queryParams.assets.length > 0) {
      return queryParams.assets.map(asset => ({
        assetType: asset.type,
        asset: asset
      }));
    }

    const defaultIndexAsset: Asset = {
      type: 'index_fund',
      id: 'NIFTY 50',
      name: 'NIFTY 50',
      indexName: 'NIFTY 50',
      displayName: 'NIFTY 50'
    };

    const defaultYahooAsset: Asset = {
      type: 'yahoo_finance',
      id: 'GOOG',
      name: 'GOOG',
      symbol: 'GOOG',
      displayName: 'GOOG'
    };

    return [
      { assetType: 'index_fund', asset: defaultIndexAsset },
      { assetType: 'yahoo_finance', asset: defaultYahooAsset }
    ];
  });
  
  const [navDatas, setNavDatas] = useState<Record<string, any[]>>({});
  const [plottedAssets, setPlottedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [useLogScale, setUseLogScale] = useState(queryParams.logScale);

  const handleAddAsset = () => {
    setAssets([...assets, { assetType: 'mutual_fund', asset: null }]);
  };

  const handleRemoveAsset = (idx: number) => {
    setAssets(assets.filter((_, i) => i !== idx));
  };

  const handleAssetTypeChange = (idx: number, type: AssetType) => {
    const newAssets = [...assets];
    
    // Create default asset for fixed_return type
    if (type === 'fixed_return') {
      const defaultFixedReturn: Asset = {
        type: 'fixed_return',
        id: 'fixed_8',
        name: 'Fixed 8% Return',
        annualReturnPercentage: 8,
        displayName: 'Fixed 8% Return'
      };
      newAssets[idx] = { assetType: type, asset: defaultFixedReturn };
    } else {
      newAssets[idx] = { assetType: type, asset: null };
    }
    
    setAssets(newAssets);
  };

  const handleAssetSelect = (idx: number, asset: Asset | null) => {
    const newAssets = [...assets];
    newAssets[idx] = { ...newAssets[idx], asset };
    setAssets(newAssets);
  };

  const handlePlot = async () => {
    const validAssets = assets.filter(entry => entry.asset !== null);
    if (validAssets.length === 0) return;
    
    setLoading(true);
    try {
      const newNavDatas: Record<string, any[]> = {};
      const assetsToPlot = validAssets.map(e => e.asset!);
      
      for (const entry of validAssets) {
        const data = await loadNavData(entry.asset!);
        const filledData = fillMissingNavDates(data);
        newNavDatas[entry.asset!.id.toString()] = filledData;
      }
      
      setNavDatas(newNavDatas);
      setPlottedAssets(assetsToPlot);
    } catch (error) {
      console.error('Error plotting historical values:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update URL params when assets (current selection) or log scale changes
  useEffect(() => {
    if (isActive) {
      const validAssets = assets
        .filter(entry => entry.asset !== null)
        .map(entry => entry.asset!);
      
      if (validAssets.length > 0) {
        setHistoricalValuesParams(validAssets, useLogScale);
      }
    }
  }, [assets, useLogScale, isActive]);

  const anyInvalidSelection = assets.some(entry => entry.asset === null);

  return (
    <Block position="relative">
      <LoadingOverlay active={loading} />
      
      {/* Page Description */}
      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          View and compare historical NAV/price data for mutual funds, indices, and stocks.
        </ParagraphMedium>
      </Block>
      
      <Block maxWidth="900px" margin="0 auto">
        <Block marginBottom="scale800">
          {/* Individual Asset Panels */}
          {assets.map((entry, idx) => (
            <Block
              key={idx}
              position="relative"
              padding="scale700"
              marginBottom="scale600"
              backgroundColor="backgroundPrimary"
              overrides={{
                Block: {
                  style: ({ $theme }) => ({
                    borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`,
                    borderRadius: $theme.borders.radius200,
                    transition: $theme.animation.timing200
                  })
                }
              }}
            >
              <Block display="flex" alignItems="center" gridGap="scale300">
                <AssetTypeDropdown
                  value={entry.assetType}
                  onChange={(type) => handleAssetTypeChange(idx, type)}
                />
                <AssetDropdown
                  assetType={entry.assetType}
                  funds={funds}
                  onSelect={(asset) => handleAssetSelect(idx, asset)}
                  value={entry.asset ?? undefined}
                />
                <Button
                  kind="tertiary"
                  size="mini"
                  onClick={() => handleRemoveAsset(idx)}
                  disabled={assets.length <= 1}
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
                  title="Remove asset"
                >
                  ✕
                </Button>
              </Block>
            </Block>
          ))}

          {/* Add Asset Button - outside panels */}
          <Block display="flex" justifyContent="center" marginBottom="scale600">
            <Button
              kind="secondary"
              onClick={handleAddAsset}
              startEnhancer={() => <span style={{ fontSize: '16px', marginRight: '4px' }}>+</span>}
            >
              Add Asset
            </Button>
          </Block>
        </Block>

        {/* Plot Options Panel */}
        <Block
          position="relative"
          padding="scale700"
          marginBottom="scale600"
          backgroundColor="backgroundPrimary"
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                borderLeft: '4px solid #000000',
                borderRadius: $theme.borders.radius200,
              })
            }
          }}
        >
          <Block marginBottom="scale500">
            <LabelLarge
              overrides={{
                Block: {
                  style: ({ $theme }) => ({
                    color: $theme.colors.primary,
                    fontWeight: '600',
                    marginTop: 0,
                    marginRight: 0,
                    marginBottom: 0,
                    marginLeft: 0,
                  })
                }
              }}
            >
              Plot Options
            </LabelLarge>
          </Block>

          <Block>
            <Checkbox
              checked={useLogScale}
              onChange={(e) => setUseLogScale(e.target.checked)}
            >
              Logarithmic Scale (Log₁₀)
            </Checkbox>
          </Block>
        </Block>

        {/* Plot button */}
        <Block display="flex" justifyContent="center" marginBottom="scale800">
          <Button
            kind="primary"
            onClick={handlePlot}
            disabled={anyInvalidSelection}
          >
            Plot Historical Values
          </Button>
        </Block>
      </Block>

      {/* Chart Display - 90% width, centered */}
      {plottedAssets.length > 0 && (
        <Block maxWidth="90%" margin="0 auto">
          <HistoricalValuesChart 
            navDatas={navDatas}
            assets={plottedAssets}
            useLogScale={useLogScale}
            colors={COLORS}
          />
        </Block>
      )}
    </Block>
  );
};

