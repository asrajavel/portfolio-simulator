import React, { useState, useEffect } from 'react';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { InstrumentTypeDropdown } from '../controls/InstrumentTypeDropdown';
import { InstrumentDropdown } from '../controls/InstrumentDropdown';
import { InstrumentType, Instrument } from '../../types/instrument';

interface BaseFundControlsProps {
  selectedInstruments: (Instrument | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onInstrumentSelect: (idx: number, instrument: Instrument | null) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  useInstruments?: boolean;
  defaultSchemeCode?: number;
  children?: React.ReactNode; // For additional controls (SIP-specific)
  showAllocationTransition?: boolean; // Show end allocation inputs
  endAllocations?: (number | null)[];
  onEndAllocationChange?: (idx: number, value: number) => void;
}

export const BaseFundControls: React.FC<BaseFundControlsProps> = ({
  selectedInstruments,
  allocations,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  useInstruments = true,
  defaultSchemeCode,
  children,
  showAllocationTransition = false,
  endAllocations = [],
  onEndAllocationChange,
}) => {
  const [instrumentTypes, setInstrumentTypes] = useState<InstrumentType[]>(() => {
    return selectedInstruments.map(inst => inst?.type || 'mutual_fund' as InstrumentType);
  });

  // Update instrumentTypes when selectedInstruments changes
  useEffect(() => {
    setInstrumentTypes(prev => {
      const newTypes = selectedInstruments.map((inst, idx) => {
        return inst?.type || prev[idx] || 'mutual_fund' as InstrumentType;
      });
      return newTypes;
    });
  }, [selectedInstruments]);

  // Check if inflation exists in any instrument
  const hasInflation = selectedInstruments.some(inst => inst?.type === 'inflation');

  // Check if there are other instruments besides the current index
  const hasOtherInstruments = (idx: number) => {
    return selectedInstruments.some((inst, i) => i !== idx && inst !== null);
  };

  const handleInstrumentTypeChange = (idx: number, type: InstrumentType) => {
    const newTypes = [...instrumentTypes];
    newTypes[idx] = type;
    setInstrumentTypes(newTypes);
    
    // Clear the current selection and set default when switching types
    if (type === 'mutual_fund') {
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
      onInstrumentSelect(idx, null);
    } else if (type === 'yahoo_finance') {
      onInstrumentSelect(idx, null);
    } else if (type === 'fixed_return') {
      const defaultFixedReturn: Instrument = {
        type: 'fixed_return',
        id: 'fixed_8',
        name: 'Fixed 8% Return',
        annualReturnPercentage: 8,
        displayName: 'Fixed 8% Return'
      };
      onInstrumentSelect(idx, defaultFixedReturn);
    } else if (type === 'inflation') {
      const defaultInflation: Instrument = {
        type: 'inflation',
        id: 'inflation_IND',
        name: 'India - Consumer Price Index',
        countryCode: 'IND',
        displayName: 'India - Consumer Price Index'
      };
      onInstrumentSelect(idx, defaultInflation);
    }
  };

  return (
    <>
      {selectedInstruments?.map((item, idx) => (
        <Block key={idx} display="flex" alignItems="center" marginBottom="scale200" gridGap="scale300">
          <InstrumentTypeDropdown
            value={instrumentTypes[idx] || 'mutual_fund'}
            onChange={(type) => handleInstrumentTypeChange(idx, type)}
            disableInflation={hasOtherInstruments(idx)}
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
          {showAllocationTransition && (
            <>
              <span style={{ fontSize: '18px', color: '#9ca3af', margin: '0 4px' }}>→</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={endAllocations[idx] ?? 0}
                onChange={e => onEndAllocationChange?.(idx, Number((e.target as HTMLInputElement).value))}
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
            </>
          )}
          <Button
            kind="tertiary"
            size="mini"
            onClick={() => onRemoveFund(idx)}
            disabled={(selectedInstruments?.length ?? 0) <= 1}
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
          + Instrument
        </Button>
        {children}
      </Block>
    </>
  );
};

