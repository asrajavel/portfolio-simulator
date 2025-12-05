import React from 'react';
import { Block } from 'baseui/block';
import { LabelMedium } from 'baseui/typography';
import { Spinner } from 'baseui/spinner';

interface LoadingErrorStatesProps {
  loading: boolean;
  error: string | null;
}

export const LoadingErrorStates: React.FC<LoadingErrorStatesProps> = ({ loading, error }) => {
  if (loading) {
    return (
      <Block display="flex" flexDirection="column" alignItems="center" margin="2rem 0" gridGap="scale400">
        <Spinner />
        <LabelMedium>Loading list of mutual funds...</LabelMedium>
      </Block>
    );
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