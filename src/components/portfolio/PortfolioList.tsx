import React from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { LabelLarge, LabelSmall } from 'baseui/typography';
import { FundControls } from './FundControls';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { Portfolio } from '../../types/portfolio';
import { Instrument } from '../../types/instrument';

interface PortfolioListProps {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  funds: mfapiMutualFund[];
  onInstrumentSelect: (pIdx: number, idx: number, instrument: Instrument | null) => void;
  onAddFund: (pIdx: number) => void;
  onRemoveFund: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onToggleRebalancing: (pIdx: number) => void;
  onRebalancingThresholdChange: (pIdx: number, value: number) => void;
  onAddPortfolio: () => void;
  disableControls: boolean;
  COLORS: string[];
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const PortfolioList: React.FC<PortfolioListProps> = ({
  portfolios,
  setPortfolios,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  onToggleRebalancing,
  onRebalancingThresholdChange,
  onAddPortfolio,
  disableControls,
  COLORS,
  useInstruments = false,
  defaultSchemeCode
}) => {
  return (
    <Block marginBottom="scale800">
      {portfolios.map((portfolio, pIdx) => {
        const allocationSum = (portfolio.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);
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
            {portfolios.length > 1 && (
              <Button
                onClick={() => setPortfolios(prev => prev.filter((_, i) => i !== pIdx))}
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
                title={`Remove Portfolio ${pIdx + 1}`}
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
                Portfolio {pIdx + 1}
              </LabelLarge>
            </Block>
            
            <FundControls
              selectedInstruments={portfolio.selectedInstruments || []}
              allocations={portfolio.allocations}
              funds={funds}
              onInstrumentSelect={(idx, instrument) => onInstrumentSelect(pIdx, idx, instrument)}
              onAddFund={() => onAddFund(pIdx)}
              onRemoveFund={idx => onRemoveFund(pIdx, idx)}
              onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
              disableControls={disableControls}
              rebalancingEnabled={portfolio.rebalancingEnabled}
              onToggleRebalancing={() => onToggleRebalancing(pIdx)}
              rebalancingThreshold={portfolio.rebalancingThreshold}
              onRebalancingThresholdChange={value => onRebalancingThresholdChange(pIdx, value)}
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
      
      {/* Add Portfolio Button */}
      <Block display="flex" justifyContent="center" marginTop="scale600">
        <Button
          kind="secondary"
          onClick={onAddPortfolio}
          startEnhancer={() => <span style={{ fontSize: '16px', marginRight: '4px' }}>+</span>}
        >
          Add Portfolio
        </Button>
      </Block>
    </Block>
  );
}; 