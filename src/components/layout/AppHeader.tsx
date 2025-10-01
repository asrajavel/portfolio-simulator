import React from 'react';
import { Block } from 'baseui/block';
import { HeadingLarge } from 'baseui/typography';

export const AppHeader: React.FC = () => {
  return (
    <Block marginBottom="scale800" display="flex" justifyContent="center">
      <HeadingLarge 
        overrides={{
          Block: {
            style: ({ $theme }) => ({
              color: $theme.colors.contentPrimary,
              fontWeight: 'bold',
              margin: 0
            })
          }
        }}
      >
        Portfolio Simulator
      </HeadingLarge>
    </Block>
  );
}; 