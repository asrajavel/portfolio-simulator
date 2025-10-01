import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { LabelMedium } from 'baseui/typography';

interface NavigationItem {
  id: string;
  label: string;
  icon?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'portfolio-simulator',
    label: 'Portfolio SIP Simulator'
  }
  // Add more pages here later
];

export const LeftPanel: React.FC = () => {
  const [activeItem, setActiveItem] = useState('portfolio-simulator');

  return (
    <Block
      width="280px"
      backgroundColor="white"
      padding="1rem"
      overrides={{
        Block: {
          style: ({ $theme }) => ({
            borderRight: `1px solid ${$theme.colors.borderOpaque}`,
            boxShadow: '1px 0 3px rgba(0, 0, 0, 0.05)'
          })
        }
      }}
    >
      {/* Navigation Header */}
      <Block marginBottom="1.5rem">
        <LabelMedium
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                margin: 0,
                color: $theme.colors.contentSecondary,
                fontWeight: '600',
                textTransform: 'uppercase',
                fontSize: '12px',
                letterSpacing: '0.5px'
              })
            }
          }}
        >
          Navigation
        </LabelMedium>
      </Block>

      {/* Navigation Items */}
      <Block>
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            kind={activeItem === item.id ? 'primary' : 'tertiary'}
            size="default"
            overrides={{
              BaseButton: {
                style: ({ $theme, $kind }) => ({
                  width: '100%',
                  justifyContent: 'flex-start',
                  marginBottom: '0.5rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  backgroundColor: $kind === 'primary' 
                    ? $theme.colors.primary 
                    : activeItem === item.id 
                      ? $theme.colors.backgroundSecondary 
                      : 'transparent',
                  color: $kind === 'primary' 
                    ? $theme.colors.contentInversePrimary 
                    : $theme.colors.contentPrimary,
                  ':hover': {
                    backgroundColor: $kind === 'primary' 
                      ? $theme.colors.primary 
                      : $theme.colors.backgroundSecondary
                  }
                })
              }
            }}
          >
            <Block display="flex" alignItems="center">
              {item.icon && (
                <Block marginRight="0.75rem">
                  {item.icon}
                </Block>
              )}
              {item.label}
            </Block>
          </Button>
        ))}
      </Block>

      {/* Future: Add user profile, settings, etc. at bottom */}
      <Block 
        position="absolute" 
        bottom="1rem" 
        left="1rem" 
        right="1rem"
      >
        {/* Placeholder for future bottom navigation items */}
      </Block>
    </Block>
  );
}; 