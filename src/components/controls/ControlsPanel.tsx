import React from 'react';
import { Block } from 'baseui/block';
import { Button, SHAPE, KIND } from 'baseui/button';
import { Input } from 'baseui/input';
import { FormControl } from 'baseui/form-control';
import { LabelSmall, LabelMedium } from 'baseui/typography';
import { Select } from 'baseui/select';

interface ControlsPanelProps {
  years: number;
  setYears: (years: number) => void;
  onPlot: () => void;
  disabled: boolean;
  anyInvalidAlloc: boolean;
  onYearsChange: () => void;
  sipAmount: number;
  setSipAmount: (amount: number) => void;
  chartView: 'xirr' | 'corpus';
  setChartView: (view: 'xirr' | 'corpus') => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  years,
  setYears,
  onPlot,
  disabled,
  anyInvalidAlloc,
  onYearsChange,
  sipAmount,
  setSipAmount,
  chartView,
  setChartView
}) => {
  return (
    <Block
      padding="scale600"
      marginBottom="scale800"
    >
      {/* First line: Rolling Period */}
      <Block display="flex" alignItems="center" justifyContent="center" marginBottom="scale400">
        <LabelMedium>Rolling Period:</LabelMedium>
        <Block marginLeft="scale300">
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
            disabled={disabled}
            size="compact"
            searchable={false}
            overrides={{
              Root: {
                style: {
                  width: '120px'
                }
              }
            }}
            clearable={false}
          />
        </Block>
      </Block>
      
      {/* Second line: Chart View and Monthly SIP */}
      <Block display="flex" alignItems="center" justifyContent="center" gridGap="scale600" marginBottom="scale400">
        <Block display="flex" alignItems="center" gridGap="scale300">
          <LabelMedium>Chart View:</LabelMedium>
          <Block display="flex" overrides={{
            Block: {
              style: {
                display: 'inline-flex'
              }
            }
          }}>
            <Button
              onClick={() => setChartView('xirr')}
              kind={chartView === 'xirr' ? KIND.primary : KIND.secondary}
              size="compact"
              disabled={disabled}
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
              disabled={disabled}
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
        
        {chartView === 'corpus' && (
          <Block display="flex" alignItems="center" gridGap="scale300">
            <LabelMedium>Monthly SIP (₹):</LabelMedium>
            <Input
              type="number"
              min={100}
              max={1000000}
              value={sipAmount}
              onChange={e => setSipAmount(Number((e.target as HTMLInputElement).value))}
              placeholder="10000"
              size="compact"
              disabled={disabled}
              overrides={{
                Root: {
                  style: {
                    width: '150px'
                  }
                }
              }}
            />
          </Block>
        )}
      </Block>
      
      {/* Third line: Plot button */}
      <Block display="flex" alignItems="center" justifyContent="center">
        <Button
          kind="primary"
          onClick={onPlot}
          disabled={disabled || anyInvalidAlloc}
        >
          Plot
        </Button>
      </Block>
    </Block>
  );
}; 