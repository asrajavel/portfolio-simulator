import React from 'react';
import { Block } from 'baseui/block';
import { Checkbox } from 'baseui/checkbox';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
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
  rebalancingEnabled: boolean;
  onToggleRebalancing: () => void;
  rebalancingThreshold: number;
  onRebalancingThresholdChange: (value: number) => void;
  stepUpEnabled: boolean;
  onToggleStepUp: () => void;
  stepUpPercentage: number;
  onStepUpPercentageChange: (value: number) => void;
  allocationTransitionEnabled: boolean;
  onToggleAllocationTransition: () => void;
  endAllocations: (number | null)[];
  onEndAllocationChange: (idx: number, value: number) => void;
  transitionYears: number;
  onTransitionYearsChange: (value: number) => void;
  rollingYears: number;
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
  rebalancingEnabled,
  onToggleRebalancing,
  rebalancingThreshold,
  onRebalancingThresholdChange,
  stepUpEnabled,
  onToggleStepUp,
  stepUpPercentage,
  onStepUpPercentageChange,
  allocationTransitionEnabled,
  onToggleAllocationTransition,
  endAllocations,
  onEndAllocationChange,
  transitionYears,
  onTransitionYearsChange,
  rollingYears,
  useInstruments = true,
  defaultSchemeCode,
}) => {
  // Generate transition years options (from 1 to rollingYears - 1)
  const transitionYearsOptions = Array.from({ length: Math.max(1, rollingYears - 1) }, (_, i) => ({
    label: `Last ${i + 1} year${i + 1 > 1 ? 's' : ''}`,
    id: (i + 1).toString()
  }));
  return (
    <BaseFundControls
      selectedInstruments={selectedInstruments}
      allocations={allocations}
      funds={funds}
      onInstrumentSelect={onInstrumentSelect}
      onAddFund={onAddFund}
      onRemoveFund={onRemoveFund}
      onAllocationChange={onAllocationChange}
      useInstruments={useInstruments}
      defaultSchemeCode={defaultSchemeCode}
      showAllocationTransition={allocationTransitionEnabled}
      endAllocations={endAllocations}
      onEndAllocationChange={onEndAllocationChange}
    >
      {/* SIP-specific controls */}
      <Block display="flex" alignItems="center" marginTop="scale300" gridGap="scale800">
        <Checkbox
          checked={rebalancingEnabled}
          onChange={onToggleRebalancing}
          disabled={(selectedInstruments?.length ?? 0) <= 1}
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
            disabled={!rebalancingEnabled || (selectedInstruments?.length ?? 0) <= 1}
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
      
      {/* Allocation Transition Controls */}
      <Block display="flex" alignItems="center" marginTop="scale300" gridGap="scale800">
        <Checkbox
          checked={allocationTransitionEnabled}
          onChange={onToggleAllocationTransition}
          disabled={(selectedInstruments?.length ?? 0) <= 1}
        >
          Allocation Transition (Glide Path)
        </Checkbox>
        <Select
          options={transitionYearsOptions}
          value={[{ 
            label: `Last ${transitionYears} year${transitionYears > 1 ? 's' : ''}`, 
            id: transitionYears.toString() 
          }]}
          placeholder="Select transition period"
          onChange={params => {
            if (params.value.length > 0) {
              onTransitionYearsChange(parseInt(params.value[0].id as string));
            }
          }}
          size="compact"
          searchable={false}
          disabled={!allocationTransitionEnabled || (selectedInstruments?.length ?? 0) <= 1}
          overrides={{
            Root: {
              style: {
                width: '160px'
              }
            }
          }}
          clearable={false}
        />
      </Block>
    </BaseFundControls>
  );
};

