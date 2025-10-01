import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text }) => (
  <Block display="flex" flexDirection="column" alignItems="center" margin="2rem 0">
    <Block 
      overrides={{
        Block: {
          style: {
            width: '40px',
            height: '40px',
            border: '4px solid #eee',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }
        }
      }}
    />
    {text && (
      <Block marginTop="1rem">
        <LabelMedium
          overrides={{
            Block: {
              style: {
                color: '#555',
                margin: 0
              }
            }
          }}
        >
          {text}
        </LabelMedium>
      </Block>
    )}
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </Block>
); 