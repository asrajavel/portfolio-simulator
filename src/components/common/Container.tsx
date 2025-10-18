import React from 'react';
import { Block } from 'baseui/block';

interface ContainerProps {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <Block
      width="100%"
      minHeight="100vh"
      backgroundColor="#f8f9fa"
    >
      {children}
    </Block>
  );
}; 