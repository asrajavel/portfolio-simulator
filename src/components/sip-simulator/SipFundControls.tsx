import React from 'react';
import { Block } from 'baseui/block';
import { Checkbox } from 'baseui/checkbox';
import { Input } from 'baseui/input';
import { BaseFundControls } from '../common/BaseFundControls';
import { Asset } from '../../types/asset';
import { HelpButton } from '../help';

interface SipFundControlsProps {
  selectedAssets: (Asset | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onAssetSelect: (idx: number, asset: Asset | null) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  rebalancingEnabled: boolean;
  onToggleRebalancing: () => void;
  rebalancingThreshold: number;
  onRebalancingThresholdChange: (value: number) => void;
  stepUpEnabled: boolean;
  onToggleStepUp: () => void;
  stepUpPercentage: number;
  onStepUpPercentageChange: (value: number) => void;
  useAssets?: boolean;
  defaultSchemeCode?: number;
}

export const SipFundControls: React.FC<SipFundControlsProps> = ({
  selectedAssets,
  allocations,
  funds,
  onAssetSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  rebalancingEnabled,
  onToggleRebalancing,
  rebalancingThreshold,
  onRebalancingThresholdChange,
  stepUpEnabled,
  onToggleStepUp,
  stepUpPercentage,
  onStepUpPercentageChange,
  useAssets = true,
  defaultSchemeCode,
}) => {
  return (
    <BaseFundControls
      selectedAssets={selectedAssets}
      allocations={allocations}
      funds={funds}
      onAssetSelect={onAssetSelect}
      onAddFund={onAddFund}
      onRemoveFund={onRemoveFund}
      onAllocationChange={onAllocationChange}
      useAssets={useAssets}
      defaultSchemeCode={defaultSchemeCode}
    >
      {/* SIP-specific controls */}
      <Block display="flex" alignItems="center" marginTop="scale300" gridGap="scale800">
        <Block display="flex" alignItems="center" gridGap="scale100">
          <Checkbox
            checked={rebalancingEnabled}
            onChange={onToggleRebalancing}
            disabled={(selectedAssets?.length ?? 0) <= 1}
          >
            Enable Rebalancing
          </Checkbox>
          <HelpButton topic="sip-rebalancing" />
        </Block>
        <Block display="flex" alignItems="center" gridGap="scale200">
          <Input
            type="number"
            min={0}
            max={100}
            value={rebalancingThreshold}
            onChange={e => onRebalancingThresholdChange(Number((e.target as HTMLInputElement).value))}
            disabled={!rebalancingEnabled || (selectedAssets?.length ?? 0) <= 1}
            placeholder="Threshold"
            size="compact"
            overrides={{
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
            id="rebal-threshold-input"
          />
        </Block>
        <Block display="flex" alignItems="center" gridGap="scale100">
          <Checkbox
            checked={stepUpEnabled}
            onChange={onToggleStepUp}
          >
            Annual Step-up
          </Checkbox>
          <HelpButton topic="sip-stepup" />
        </Block>
        <Block display="flex" alignItems="center" gridGap="scale200">
          <Input
            type="number"
            min={0}
            max={100}
            value={stepUpPercentage}
            onChange={e => onStepUpPercentageChange(Number((e.target as HTMLInputElement).value))}
            disabled={!stepUpEnabled}
            placeholder="Annual increase"
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
            id="stepup-input"
          />
        </Block>
      </Block>
    </BaseFundControls>
  );
};

