import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { LabelLarge } from 'baseui/typography';
import { InstrumentTypeDropdown } from '../controls/InstrumentTypeDropdown';
import { InstrumentDropdown } from '../controls/InstrumentDropdown';
import { InstrumentType, Instrument } from '../../types/instrument';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { RawNavChart } from './RawNavChart';
import { fillMissingNavDates } from '../../utils/data/fillMissingNavDates';
import { COLORS } from '../../constants';

interface InstrumentEntry {
  instrumentType: InstrumentType;
  instrument: Instrument | null;
}

interface RawInstrumentPanelProps {
  funds: mfapiMutualFund[];
  loadNavData: (instrument: Instrument) => Promise<any[]>;
}

export const RawInstrumentPanel: React.FC<RawInstrumentPanelProps> = ({
  funds,
  loadNavData
}) => {
  const [instruments, setInstruments] = useState<InstrumentEntry[]>([
    { instrumentType: 'mutual_fund', instrument: null }
  ]);
  const [navDatas, setNavDatas] = useState<Record<string, any[]>>({});
  const [plottedInstruments, setPlottedInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [useLogScale, setUseLogScale] = useState(false);

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

  const anyInvalidSelection = instruments.some(entry => entry.instrument === null);

  return (
    <Block maxWidth="900px" margin="0 auto">
      <Block position="relative">
        <LoadingOverlay active={loading} />
        
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
                  disabled={loading || instruments.length <= 1}
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
              disabled={loading}
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
            disabled={anyInvalidSelection || loading}
          >
            Plot Raw Values
          </Button>
        </Block>

        {/* Chart Display */}
        {plottedInstruments.length > 0 && (
          <RawNavChart 
            navDatas={navDatas}
            instruments={plottedInstruments}
            useLogScale={useLogScale}
            colors={COLORS}
          />
        )}
      </Block>
    </Block>
  );
};

