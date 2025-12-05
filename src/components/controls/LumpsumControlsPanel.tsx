import React from 'react';
import { Block } from 'baseui/block';
import { Button, KIND } from 'baseui/button';
import { Input } from 'baseui/input';
import { LabelMedium, LabelLarge } from 'baseui/typography';
import { Select } from 'baseui/select';

interface LumpsumControlsPanelProps {
  years: number;
  setYears: (years: number) => void;
  onPlot: () => void;
  anyInvalidAlloc: boolean;
  onYearsChange: () => void;
  lumpsumAmount: number;
  setLumpsumAmount: (amount: number) => void;
  chartView: 'xirr' | 'corpus';
  setChartView: (view: 'xirr' | 'corpus') => void;
}

export const LumpsumControlsPanel: React.FC<LumpsumControlsPanelProps> = ({
  years,
  setYears,
  onPlot,
  anyInvalidAlloc,
  onYearsChange,
  lumpsumAmount,
  setLumpsumAmount,
  chartView,
  setChartView
}) => {
  return (
    <Block marginBottom="scale800">
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
              transition: $theme.animation.timing200
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

        {/* Rolling Period */}
        <Block display="flex" alignItems="center" marginBottom="scale500" gridGap="scale300">
          <LabelMedium>Rolling Period:</LabelMedium>
          <Select
            options={Array.from({ length: 20 }, (_, i) => ({
              label: `${i + 1} year${i + 1 > 1 ? 's' : ''}`,
              id: (i + 1).toString()
            }))}
            value={[{ label: `${years} year${years > 1 ? 's' : ''}`, id: years.toString() }]}
            placeholder="Select years"
            onChange={params => {
              if (params.value.length > 0) {
                setYears(parseInt(params.value[0].id as string));
                onYearsChange();
              }
            }}
            size="compact"
            searchable={false}
            overrides={{
              Root: {
                style: {
                  width: '150px'
                }
              }
            }}
            clearable={false}
          />
        </Block>
        
        {/* Chart View and Lumpsum Amount on same line */}
        <Block display="flex" alignItems="center" justifyContent="space-between" marginBottom="scale500">
          <Block display="flex" alignItems="center" gridGap="scale300">
            <LabelMedium>Chart View:</LabelMedium>
            <Block display="flex">
              <Button
                onClick={() => setChartView('xirr')}
                kind={chartView === 'xirr' ? KIND.primary : KIND.secondary}
                size="compact"
                overrides={{
                  BaseButton: {
                    style: {
                      borderTopRightRadius: '0',
                      borderBottomRightRadius: '0',
                      marginRight: '-1px'
                    }
                  }
                }}
              >
                XIRR (%)
              </Button>
              <Button
                onClick={() => setChartView('corpus')}
                kind={chartView === 'corpus' ? KIND.primary : KIND.secondary}
                size="compact"
                overrides={{
                  BaseButton: {
                    style: {
                      borderTopLeftRadius: '0',
                      borderBottomLeftRadius: '0'
                    }
                  }
                }}
              >
                Corpus (₹)
              </Button>
            </Block>
          </Block>
          
          {/* Lumpsum Amount - right aligned, disabled when not in corpus view */}
          <Block display="flex" alignItems="center" gridGap="scale300">
            <LabelMedium>Lumpsum Amount (₹):</LabelMedium>
            <Input
              type="number"
              min={1000}
              max={100000000}
              value={lumpsumAmount}
              onChange={e => setLumpsumAmount(Number((e.target as HTMLInputElement).value))}
              placeholder="100000"
              size="compact"
              disabled={chartView !== 'corpus'}
              overrides={{
                Root: {
                  style: {
                    width: '150px'
                  }
                }
              }}
            />
          </Block>
        </Block>
      </Block>
      
      {/* Plot button below the panel */}
      <Block display="flex" justifyContent="center">
        <Button
          kind="primary"
          onClick={onPlot}
          disabled={anyInvalidAlloc}
        >
          Plot
        </Button>
      </Block>
    </Block>
  );
};

