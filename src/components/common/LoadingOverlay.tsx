import React from 'react';
import { Block } from 'baseui/block';

interface LoadingOverlayProps {
  active: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ active }) => (
  active ? (
    <Block
      position="absolute"
      top="0"
      left="0"
      width="100%"
      height="100%"
      overrides={{
        Block: {
          style: {
            zIndex: 10,
            background: 'rgba(255,255,255,0.2)',
            pointerEvents: 'all'
          }
        }
      }}
    />
  ) : null
); 