import React from 'react';
import { Block } from 'baseui/block';
import { Input } from 'baseui/input';
import { Select } from 'baseui/select';
import { RadioGroup, Radio, ALIGN } from 'baseui/radio';
import { LabelSmall } from 'baseui/typography';
import { InflationSource } from '../../hooks/useInflationCalculator';
import { formatNumber, parseFormattedNumber } from '../../utils/numberFormat';

interface InflationCalculatorControlsProps {
  source: InflationSource;
  onSourceChange: (source: InflationSource) => void;
  customRate: number;
  onCustomRateChange: (rate: number) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  selectedYear: number;
  onSelectedYearChange: (year: number) => void;
  yearRange: { start: number; end: number };
}

export const InflationCalculatorControls: React.FC<InflationCalculatorControlsProps> = ({
  source,
  onSourceChange,
  customRate,
  onCustomRateChange,
  amount,
  onAmountChange,
  selectedYear,
  onSelectedYearChange,
  yearRange,
}) => {
  const yearOptions = [];
  for (let y = yearRange.start; y <= yearRange.end; y++) {
    yearOptions.push({ id: y.toString(), label: y.toString() });
  }

  return (
    <Block
      padding="scale700"
      marginBottom="scale600"
      backgroundColor="backgroundPrimary"
      overrides={{
        Block: {
          style: ({ $theme }) => ({
            borderLeft: '4px solid #007bff',
            borderRadius: $theme.borders.radius200,
          }),
        },
      }}
    >
      <Block display="flex" flexWrap gridGap="scale600" alignItems="flex-end">
        <Block>
          <LabelSmall marginBottom="scale200">Inflation Source</LabelSmall>
          <RadioGroup
            value={source}
            onChange={(e) => onSourceChange(e.currentTarget.value as InflationSource)}
            align={ALIGN.horizontal}
          >
            <Radio value="cpi">India CPI</Radio>
            <Radio value="custom">Custom Rate</Radio>
          </RadioGroup>
        </Block>

        {source === 'custom' && (
          <Block width="120px">
            <LabelSmall marginBottom="scale200">Annual Rate (%)</LabelSmall>
            <Input
              value={customRate.toString()}
              onChange={(e) => {
                const val = parseFloat(e.currentTarget.value);
                if (!isNaN(val)) onCustomRateChange(val);
              }}
              type="number"
              size="compact"
              endEnhancer="%"
            />
          </Block>
        )}

        <Block width="180px">
          <LabelSmall marginBottom="scale200">Amount (₹)</LabelSmall>
          <Input
            value={formatNumber(amount)}
            onChange={(e) => {
              const val = parseFormattedNumber(e.currentTarget.value);
              onAmountChange(val);
            }}
            type="text"
            size="compact"
            startEnhancer="₹"
          />
        </Block>

        <Block width="140px">
          <LabelSmall marginBottom="scale200">Reference Year</LabelSmall>
          <Select
            options={yearOptions}
            value={[{ id: selectedYear.toString() }]}
            onChange={(params) => {
              if (params.value.length > 0) {
                onSelectedYearChange(parseInt(params.value[0].id as string, 10));
              }
            }}
            size="compact"
            clearable={false}
            searchable
          />
        </Block>
      </Block>
    </Block>
  );
};
