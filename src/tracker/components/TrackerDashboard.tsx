import React from 'react';
import { Block } from 'baseui/block';
import { ComputedGoalData } from '../../types/tracker';
import { SummaryCard } from './SummaryCard';
import { TotalChart } from './TotalChart';
import { AllocationChart } from './AllocationChart';
import { HoldingChart } from './HoldingChart';
import { XirrChart } from './XirrChart';

interface TrackerDashboardProps {
  data: ComputedGoalData;
}

export const TrackerDashboard: React.FC<TrackerDashboardProps> = ({ data }) => {
  const holdingNames = data.summary.holdings.map((h) => h.name);

  return (
    <Block>
      <SummaryCard summary={data.summary} />

      <Block marginTop="scale800">
        <Block
          display="grid"
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                gridTemplateColumns: '1fr 1fr',
                gap: $theme.sizing.scale600,
                [`@media (max-width: ${$theme.breakpoints.medium}px)`]: {
                  gridTemplateColumns: '1fr',
                },
              }),
            },
          }}
        >
          <Block
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  borderRadius: $theme.borders.radius300,
                  backgroundColor: $theme.colors.backgroundPrimary,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  border: `1px solid ${$theme.colors.borderOpaque}`,
                  overflow: 'hidden' as const,
                }),
              },
            }}
          >
            <TotalChart snapshots={data.dailySnapshots} />
          </Block>
          <Block
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  borderRadius: $theme.borders.radius300,
                  backgroundColor: $theme.colors.backgroundPrimary,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  border: `1px solid ${$theme.colors.borderOpaque}`,
                  overflow: 'hidden' as const,
                }),
              },
            }}
          >
            <AllocationChart snapshots={data.dailySnapshots} holdingNames={holdingNames} />
          </Block>
        </Block>
      </Block>

      <Block marginTop="scale600">
        <Block
          display="grid"
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                gridTemplateColumns: '1fr 1fr',
                gap: $theme.sizing.scale600,
                [`@media (max-width: ${$theme.breakpoints.medium}px)`]: {
                  gridTemplateColumns: '1fr',
                },
              }),
            },
          }}
        >
          {holdingNames.map((name) => (
            <Block
              key={name}
              overrides={{
                Block: {
                  style: ({ $theme }) => ({
                    borderRadius: $theme.borders.radius300,
                    backgroundColor: $theme.colors.backgroundPrimary,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                    border: `1px solid ${$theme.colors.borderOpaque}`,
                    overflow: 'hidden' as const,
                  }),
                },
              }}
            >
              <HoldingChart name={name} snapshots={data.holdingTimeSeries[name] || []} />
            </Block>
          ))}
          <Block
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  borderRadius: $theme.borders.radius300,
                  backgroundColor: $theme.colors.backgroundPrimary,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  border: `1px solid ${$theme.colors.borderOpaque}`,
                  overflow: 'hidden' as const,
                }),
              },
            }}
          >
            <XirrChart snapshots={data.dailySnapshots} />
          </Block>
        </Block>
      </Block>
    </Block>
  );
};
