import React from 'react';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { Checkbox } from 'baseui/checkbox';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { MutualFundDropdown } from './MutualFundDropdown';

interface FundControlsProps {
  selectedSchemes: (number | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onFundSelect: (idx: number, code: number) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  disableControls: boolean;
  rebalancingEnabled: boolean;
  onToggleRebalancing: () => void;
  rebalancingThreshold: number;
  onRebalancingThresholdChange: (value: number) => void;
}

export const FundControls: React.FC<FundControlsProps> = ({
  selectedSchemes,
  allocations,
  funds,
  onFundSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  disableControls,
  rebalancingEnabled,
  onToggleRebalancing,
  rebalancingThreshold,
  onRebalancingThresholdChange,
}) => (
  <>
    {selectedSchemes.map((scheme, idx) => (
      <Block key={idx} display="flex" alignItems="center" marginBottom="scale200" gridGap="scale300">
        <MutualFundDropdown
          funds={funds.filter(f => !selectedSchemes.includes(f.schemeCode) || f.schemeCode === scheme)}
          onSelect={code => onFundSelect(idx, code)}
          value={scheme ?? undefined}
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={allocations[idx] ?? 0}
          onChange={e => onAllocationChange(idx, Number((e.target as HTMLInputElement).value))}
          disabled={disableControls}
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
          disabled={disableControls || selectedSchemes.length <= 1}
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
    <Block display="flex" alignItems="center" marginTop="scale300" gridGap="scale800">
      <Button
        kind="primary"
        size="compact"
        onClick={onAddFund}
        disabled={disableControls}
      >
        + Fund
      </Button>
      {selectedSchemes.length > 1 && (
        <>
          <Checkbox
            checked={rebalancingEnabled}
            onChange={onToggleRebalancing}
            disabled={disableControls}
          >
            Enable Rebalancing
          </Checkbox>
          {rebalancingEnabled && (
            <Block display="flex" alignItems="center" gridGap="scale200">
              <Input
                type="number"
                min={0}
                max={100}
                value={rebalancingThreshold}
                onChange={e => onRebalancingThresholdChange(Number((e.target as HTMLInputElement).value))}
                disabled={disableControls}
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
          )}
        </>
      )}
    </Block>
  </>
); 