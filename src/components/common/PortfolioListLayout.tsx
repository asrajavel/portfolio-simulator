import React, { ReactNode } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { LabelLarge, LabelSmall } from 'baseui/typography';

interface PortfolioListLayoutProps<T> {
  portfolios: T[];
  setPortfolios: React.Dispatch<React.SetStateAction<T[]>>;
  COLORS: string[];
  onAddPortfolio: () => void;
  getAllocationSum: (portfolio: T) => number;
  renderPortfolioControls: (portfolio: T, portfolioIdx: number) => ReactNode;
}

/**
 * Shared layout component for displaying portfolio lists (SIP or Lumpsum).
 * Handles the common UI structure while delegating portfolio-specific controls to a render prop.
 */
export function PortfolioListLayout<T>({
  portfolios,
  setPortfolios,
  COLORS,
  onAddPortfolio,
  getAllocationSum,
  renderPortfolioControls,
}: PortfolioListLayoutProps<T>) {
  return (
    <Block marginBottom="scale800">
      {portfolios.map((portfolio, pIdx) => {
        const allocationSum = getAllocationSum(portfolio);
        
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
                      marginTop: 0,
                      marginRight: 0,
                      marginBottom: 0,
                      marginLeft: 0,
                    })
                  }
                }}
              >
                Portfolio {pIdx + 1}
              </LabelLarge>
            </Block>
            
            {/* Delegate portfolio-specific controls to the render prop */}
            {renderPortfolioControls(portfolio, pIdx)}
            
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
                        marginTop: 0,
                        marginRight: 0,
                        marginBottom: 0,
                        marginLeft: 0,
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
}

