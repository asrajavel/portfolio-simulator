import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingErrorStatesProps {
  loading: boolean;
  error: string | null;
}

export const LoadingErrorStates: React.FC<LoadingErrorStatesProps> = ({ loading, error }) => {
  if (loading) {
    return <LoadingSpinner text="Loading list of mutual funds..." />;
  }

  if (error) {
    return (
      <Block 
        marginBottom="scale400"
        display="flex"
        justifyContent="center"
      >
        <LabelMedium
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                color: $theme.colors.negative
              })
            }
          }}
        >
          {error}
        </LabelMedium>
      </Block>
    );
  }

  return null;
}; 