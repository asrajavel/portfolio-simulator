import React from 'react';
import { Block } from 'baseui/block';

interface ContainerProps {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <Block
      width="100%"
      backgroundColor="white"
    >
      {children}
    </Block>
  );
}; 