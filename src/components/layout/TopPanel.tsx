import React from 'react';
import { Block } from 'baseui/block';
import { HeadingMedium } from 'baseui/typography';

export const TopPanel: React.FC = () => {
  return (
    <Block
      backgroundColor="white"
      padding="1rem 1.5rem"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      overrides={{
        Block: {
          style: ({ $theme }) => ({
            borderBottom: `1px solid ${$theme.colors.borderOpaque}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          })
        }
      }}
    >
      <HeadingMedium
        overrides={{
          Block: {
            style: ({ $theme }) => ({
              margin: 0,
              color: $theme.colors.contentPrimary,
              fontWeight: '600'
            })
          }
        }}
      >
        Indian Investment Analysis
      </HeadingMedium>
      
      {/* Right side - can add user menu, settings, etc. later */}
      <Block>
        {/* Placeholder for future navigation items */}
      </Block>
    </Block>
  );
}; 