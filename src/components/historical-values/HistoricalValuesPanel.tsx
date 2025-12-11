import React, { useState, useEffect } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { LabelLarge } from 'baseui/typography';
import { InstrumentTypeDropdown } from '../controls/InstrumentTypeDropdown';
import { InstrumentDropdown } from '../controls/InstrumentDropdown';
import { InstrumentType, Instrument } from '../../types/instrument';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { HistoricalValuesChart } from './HistoricalValuesChart';
import { fillMissingNavDates } from '../../utils/data/fillMissingNavDates';
import { COLORS } from '../../constants';
import { getQueryParams, setHistoricalValuesParams } from '../../utils/browser/queryParams';

interface InstrumentEntry {
  instrumentType: InstrumentType;
  instrument: Instrument | null;
}

interface HistoricalValuesPanelProps {
  funds: mfapiMutualFund[];
  loadNavData: (instrument: Instrument) => Promise<any[]>;
  isActive?: boolean;
}

export const HistoricalValuesPanel: React.FC<HistoricalValuesPanelProps> = ({
  funds,
  loadNavData,
  isActive = true
}) => {
  const queryParams = getQueryParams();
  
  const [instruments, setInstruments] = useState<InstrumentEntry[]>(() => {
    if (queryParams.instruments.length > 0) {
      return queryParams.instruments.map(inst => ({
        instrumentType: inst.type,
        instrument: inst
      }));
    }

    const defaultIndexInstrument: Instrument = {
      type: 'index_fund',
      id: 'NIFTY 50',
      name: 'NIFTY 50',
      indexName: 'NIFTY 50',
      displayName: 'NIFTY 50'
    };

    const defaultYahooInstrument: Instrument = {
      type: 'yahoo_finance',
      id: 'GOOG',
      name: 'GOOG',
      symbol: 'GOOG',
      displayName: 'GOOG'
    };

    return [
      { instrumentType: 'index_fund', instrument: defaultIndexInstrument },
      { instrumentType: 'yahoo_finance', instrument: defaultYahooInstrument }
    ];
  });
  
  const [navDatas, setNavDatas] = useState<Record<string, any[]>>({});
  const [plottedInstruments, setPlottedInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [useLogScale, setUseLogScale] = useState(queryParams.logScale);

  const handleAddInstrument = () => {
    setInstruments([...instruments, { instrumentType: 'mutual_fund', instrument: null }]);
  };

  const handleRemoveInstrument = (idx: number) => {
    setInstruments(instruments.filter((_, i) => i !== idx));
  };

  const handleInstrumentTypeChange = (idx: number, type: InstrumentType) => {
    const newInstruments = [...instruments];
    
    // Create default instrument for fixed_return type
    if (type === 'fixed_return') {
      const defaultFixedReturn: Instrument = {
        type: 'fixed_return',
        id: 'fixed_8',
        name: 'Fixed 8% Return',
        annualReturnPercentage: 8,
        displayName: 'Fixed 8% Return'
      };
      newInstruments[idx] = { instrumentType: type, instrument: defaultFixedReturn };
    } else {
      newInstruments[idx] = { instrumentType: type, instrument: null };
    }
    
    setInstruments(newInstruments);
  };

  const handleInstrumentSelect = (idx: number, instrument: Instrument | null) => {
    const newInstruments = [...instruments];
    newInstruments[idx] = { ...newInstruments[idx], instrument };
    setInstruments(newInstruments);
  };

  const handlePlot = async () => {
    const validInstruments = instruments.filter(entry => entry.instrument !== null);
    if (validInstruments.length === 0) return;
    
    setLoading(true);
    const newNavDatas: Record<string, any[]> = {};
    const instrumentsToPlot = validInstruments.map(e => e.instrument!);
    
    for (const entry of validInstruments) {
      const data = await loadNavData(entry.instrument!);
      const filledData = fillMissingNavDates(data);
      newNavDatas[entry.instrument!.id.toString()] = filledData;
    }
    
    setNavDatas(newNavDatas);
    setPlottedInstruments(instrumentsToPlot);
    setLoading(false);
  };

  // Update URL params when instruments (current selection) or log scale changes
  useEffect(() => {
    if (isActive) {
      const validInstruments = instruments
        .filter(entry => entry.instrument !== null)
        .map(entry => entry.instrument!);
      
      if (validInstruments.length > 0) {
        setHistoricalValuesParams(validInstruments, useLogScale);
      }
    }
  }, [instruments, useLogScale, isActive]);

  // Auto-plot if instruments are loaded from URL params
  useEffect(() => {
    if (queryParams.instruments.length > 0) {
      handlePlot();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const anyInvalidSelection = instruments.some(entry => entry.instrument === null);

  return (
    <Block position="relative">
      <LoadingOverlay active={loading} />
      
      <Block maxWidth="900px" margin="0 auto">
        <Block marginBottom="scale800">
          {/* Individual Instrument Panels */}
          {instruments.map((entry, idx) => (
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
                <InstrumentTypeDropdown
                  value={entry.instrumentType}
                  onChange={(type) => handleInstrumentTypeChange(idx, type)}
                />
                <InstrumentDropdown
                  instrumentType={entry.instrumentType}
                  funds={funds}
                  onSelect={(instrument) => handleInstrumentSelect(idx, instrument)}
                  value={entry.instrument ?? undefined}
                />
                <Button
                  kind="tertiary"
                  size="mini"
                  onClick={() => handleRemoveInstrument(idx)}
                  disabled={instruments.length <= 1}
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
                  title="Remove instrument"
                >
                  ✕
                </Button>
              </Block>
            </Block>
          ))}

          {/* Add Instrument Button - outside panels */}
          <Block display="flex" justifyContent="center" marginBottom="scale600">
            <Button
              kind="secondary"
              onClick={handleAddInstrument}
              startEnhancer={() => <span style={{ fontSize: '16px', marginRight: '4px' }}>+</span>}
            >
              Add Instrument
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
                    margin: 0
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
      {plottedInstruments.length > 0 && (
        <Block maxWidth="90%" margin="0 auto">
          <HistoricalValuesChart 
            navDatas={navDatas}
            instruments={plottedInstruments}
            useLogScale={useLogScale}
            colors={COLORS}
          />
        </Block>
      )}
    </Block>
  );
};

