import React from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { LabelLarge, LabelSmall } from 'baseui/typography';
import { SipFundControls } from './SipFundControls';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipStrategy } from '../../types/sipStrategy';
import { Instrument } from '../../types/instrument';

interface SipStrategyListProps {
  sipStrategies: SipStrategy[];
  setSipStrategies: React.Dispatch<React.SetStateAction<SipStrategy[]>>;
  funds: mfapiMutualFund[];
  onInstrumentSelect: (pIdx: number, idx: number, instrument: Instrument | null) => void;
  onAddFund: (pIdx: number) => void;
  onRemoveFund: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onToggleRebalancing: (pIdx: number) => void;
  onRebalancingThresholdChange: (pIdx: number, value: number) => void;
  onToggleStepUp: (pIdx: number) => void;
  onStepUpPercentageChange: (pIdx: number, value: number) => void;
  onAddStrategy: () => void;
  COLORS: string[];
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const SipStrategyList: React.FC<SipStrategyListProps> = ({
  sipStrategies,
  setSipStrategies,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  onToggleRebalancing,
  onRebalancingThresholdChange,
  onToggleStepUp,
  onStepUpPercentageChange,
  onAddStrategy,
  COLORS,
  useInstruments = false,
  defaultSchemeCode
}) => {
  return (
    <Block marginBottom="scale800">
      {sipStrategies.map((strategy, pIdx) => {
        const allocationSum = (strategy.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);
        return (
          <Block
            key={pIdx}
            position="relative"
            padding="scale700"
            marginBottom="scale600"
            backgroundColor="backgroundPrimary"
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  borderLeft: `4px solid ${COLORS[pIdx % COLORS.length]}`,
                  borderRadius: $theme.borders.radius200,
                  transition: $theme.animation.timing200
                })
              }
            }}
          >
            {sipStrategies.length > 1 && (
              <Button
                onClick={() => setSipStrategies(prev => prev.filter((_, i) => i !== pIdx))}
                kind="tertiary"
                size="mini"
                overrides={{
                  BaseButton: {
                    style: ({ $theme }) => ({
                      position: 'absolute',
                      top: $theme.sizing.scale300,
                      right: $theme.sizing.scale300,
                      color: $theme.colors.contentSecondary,
                      ':hover': {
                        color: $theme.colors.contentPrimary,
                      },
                    }),
                  },
                }}
                title={`Remove Strategy ${pIdx + 1}`}
              >
                ✕
              </Button>
            )}
            
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
                Strategy {pIdx + 1}
              </LabelLarge>
            </Block>
            
            <SipFundControls
              selectedInstruments={strategy.selectedInstruments || []}
              allocations={strategy.allocations}
              funds={funds}
              onInstrumentSelect={(idx, instrument) => onInstrumentSelect(pIdx, idx, instrument)}
              onAddFund={() => onAddFund(pIdx)}
              onRemoveFund={idx => onRemoveFund(pIdx, idx)}
              onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
              rebalancingEnabled={strategy.rebalancingEnabled}
              onToggleRebalancing={() => onToggleRebalancing(pIdx)}
              rebalancingThreshold={strategy.rebalancingThreshold}
              onRebalancingThresholdChange={value => onRebalancingThresholdChange(pIdx, value)}
              stepUpEnabled={strategy.stepUpEnabled}
              onToggleStepUp={() => onToggleStepUp(pIdx)}
              stepUpPercentage={strategy.stepUpPercentage}
              onStepUpPercentageChange={value => onStepUpPercentageChange(pIdx, value)}
              useInstruments={useInstruments}
              defaultSchemeCode={defaultSchemeCode}
            />
            
            {allocationSum !== 100 && (
              <Block 
                position="absolute"
                bottom="scale300"
                right="scale400"
              >
                <LabelSmall
                  overrides={{
                    Block: {
                      style: ({ $theme }) => ({
                        color: $theme.colors.negative,
                        fontWeight: '500',
                        margin: 0
                      })
                    }
                  }}
                >
                  Allocation should add up to 100%
                </LabelSmall>
              </Block>
            )}
          </Block>
        );
      })}
      
      {/* Add Strategy Button */}
      <Block display="flex" justifyContent="center" marginTop="scale600">
        <Button
          kind="secondary"
          onClick={onAddStrategy}
          startEnhancer={() => <span style={{ fontSize: '16px', marginRight: '4px' }}>+</span>}
        >
          Add Strategy
        </Button>
      </Block>
    </Block>
  );
};

