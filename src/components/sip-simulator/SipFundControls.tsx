import React from 'react';
import { Block } from 'baseui/block';
import { Checkbox } from 'baseui/checkbox';
import { Input } from 'baseui/input';
import { BaseFundControls } from '../common/BaseFundControls';
import { Instrument } from '../../types/instrument';

interface SipFundControlsProps {
  selectedInstruments: (Instrument | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onInstrumentSelect: (idx: number, instrument: Instrument | null) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  disableControls: boolean;
  rebalancingEnabled: boolean;
  onToggleRebalancing: () => void;
  rebalancingThreshold: number;
  onRebalancingThresholdChange: (value: number) => void;
  stepUpEnabled: boolean;
  onToggleStepUp: () => void;
  stepUpPercentage: number;
  onStepUpPercentageChange: (value: number) => void;
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const SipFundControls: React.FC<SipFundControlsProps> = ({
  selectedInstruments,
  allocations,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  disableControls,
  rebalancingEnabled,
  onToggleRebalancing,
  rebalancingThreshold,
  onRebalancingThresholdChange,
  stepUpEnabled,
  onToggleStepUp,
  stepUpPercentage,
  onStepUpPercentageChange,
  useInstruments = true,
  defaultSchemeCode,
}) => {
  return (
    <BaseFundControls
      selectedInstruments={selectedInstruments}
      allocations={allocations}
      funds={funds}
      onInstrumentSelect={onInstrumentSelect}
      onAddFund={onAddFund}
      onRemoveFund={onRemoveFund}
      onAllocationChange={onAllocationChange}
      disableControls={disableControls}
      useInstruments={useInstruments}
      defaultSchemeCode={defaultSchemeCode}
    >
      {/* SIP-specific controls */}
      <Block display="flex" alignItems="center" marginTop="scale300" gridGap="scale800">
        <Checkbox
          checked={rebalancingEnabled}
          onChange={onToggleRebalancing}
          disabled={disableControls || (selectedInstruments?.length ?? 0) <= 1}
        >
          Enable Rebalancing
        </Checkbox>
        <Block display="flex" alignItems="center" gridGap="scale200">
          <Input
            type="number"
            min={0}
            max={100}
            value={rebalancingThreshold}
            onChange={e => onRebalancingThresholdChange(Number((e.target as HTMLInputElement).value))}
            disabled={disableControls || !rebalancingEnabled || (selectedInstruments?.length ?? 0) <= 1}
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
        <Checkbox
          checked={stepUpEnabled}
          onChange={onToggleStepUp}
          disabled={disableControls}
        >
          Annual Step-up
        </Checkbox>
        <Block display="flex" alignItems="center" gridGap="scale200">
          <Input
            type="number"
            min={0}
            max={100}
            value={stepUpPercentage}
            onChange={e => onStepUpPercentageChange(Number((e.target as HTMLInputElement).value))}
            disabled={disableControls || !stepUpEnabled}
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

