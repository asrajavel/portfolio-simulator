import React from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
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
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  years,
  setYears,
  onPlot,
  disabled,
  anyInvalidAlloc,
  onYearsChange
}) => {
  return (
    <Block
      padding="scale600"
      marginBottom="scale800"
      backgroundColor="backgroundTertiary"
      overrides={{
        Block: {
          style: ({ $theme }) => ({
            borderRadius: $theme.borders.radius300,
            border: `${$theme.borders.border200.borderWidth} ${$theme.borders.border200.borderStyle} ${$theme.colors.borderOpaque}`
          })
        }
      }}
    >
      <Block display="flex" alignItems="center" justifyContent="flex-start" gridGap="scale400">
        <Block display="flex" alignItems="center" gridGap="scale300">
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
        <Button
          kind="primary"
          onClick={onPlot}
          disabled={disabled || anyInvalidAlloc}
        >
          Plot
        </Button>
        <LabelSmall
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                color: $theme.colors.contentSecondary,
                marginLeft: $theme.sizing.scale200,
                marginTop: 0,
                marginBottom: 0,
                marginRight: 0
              })
            }
          }}
        >
          Tip: Click on a point in the graph to see more details for that specific date.
        </LabelSmall>
      </Block>
    </Block>
  );
}; 