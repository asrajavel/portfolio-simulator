import React, { useState, useEffect } from 'react';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { Checkbox } from 'baseui/checkbox';
import { Block } from 'baseui/block';
import { FormControl } from 'baseui/form-control';
import { InstrumentTypeDropdown } from '../controls/InstrumentTypeDropdown';
import { InstrumentDropdown } from '../controls/InstrumentDropdown';
import { InstrumentType, Instrument } from '../../types/instrument';

interface FundControlsProps {
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
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const FundControls: React.FC<FundControlsProps> = ({
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
  useInstruments = true, // Default to true since we're only using instruments now
  defaultSchemeCode,
}) => {
  const [instrumentTypes, setInstrumentTypes] = useState<InstrumentType[]>(() => {
    return selectedInstruments.map(inst => inst?.type || 'mutual_fund' as InstrumentType);
  });

  // Update instrumentTypes when selectedInstruments changes
  useEffect(() => {
    setInstrumentTypes(prev => {
      const newTypes = selectedInstruments.map((inst, idx) => {
        // If instrument exists, use its type; otherwise keep previous type or default to mutual_fund
        return inst?.type || prev[idx] || 'mutual_fund' as InstrumentType;
      });
      return newTypes;
    });
  }, [selectedInstruments]);

  const handleInstrumentTypeChange = (idx: number, type: InstrumentType) => {
    const newTypes = [...instrumentTypes];
    newTypes[idx] = type;
    setInstrumentTypes(newTypes);
    
    // Clear the current selection and set default when switching types
    if (type === 'mutual_fund') {
      // Find the default UTI Nifty 50 fund or use first available fund
      const defaultFund = funds.find(f => f.schemeName.toLowerCase().includes('uti nifty 50')) || funds[0];
      if (defaultFund) {
        const defaultInstrument: Instrument = {
          type: 'mutual_fund',
          id: defaultFund.schemeCode,
          name: defaultFund.schemeName,
          schemeCode: defaultFund.schemeCode,
          schemeName: defaultFund.schemeName
        };
        onInstrumentSelect(idx, defaultInstrument);
      }
    } else if (type === 'index_fund') {
      // For index funds, clear the selection (user needs to select manually)
      onInstrumentSelect(idx, null);
    } else if (type === 'yahoo_finance') {
      // For Yahoo Finance, clear the selection (user needs to enter symbol manually)
      onInstrumentSelect(idx, null);
    } else if (type === 'fixed_return') {
      // For Fixed Return, create a default 8% return instrument
      const defaultFixedReturn: Instrument = {
        type: 'fixed_return',
        id: 'fixed_8',
        name: 'Fixed 8% Return',
        annualReturnPercentage: 8,
        displayName: 'Fixed 8% Return'
      };
      onInstrumentSelect(idx, defaultFixedReturn);
    }
  };

  return (
  <>
    {selectedInstruments?.map((item, idx) => (
      <Block key={idx} display="flex" alignItems="center" marginBottom="scale200" gridGap="scale300">
        <InstrumentTypeDropdown
          value={instrumentTypes[idx] || 'mutual_fund'}
          onChange={(type) => handleInstrumentTypeChange(idx, type)}
        />
        <InstrumentDropdown
          instrumentType={instrumentTypes[idx] || 'mutual_fund'}
          funds={funds.filter(f => 
            selectedInstruments.every((inst, i) => 
              i === idx || !inst || inst.type !== 'mutual_fund' || inst.id !== f.schemeCode
            )
          )}
          onSelect={(instrument) => onInstrumentSelect(idx, instrument)}
          value={selectedInstruments?.[idx] ?? undefined}
          defaultSchemeCode={defaultSchemeCode}
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
          disabled={disableControls || (selectedInstruments?.length ?? 0) <= 1}
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
        + Instrument
      </Button>
      {(selectedInstruments?.length ?? 0) > 1 && (
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
}; 