import React from 'react';
import { Block } from 'baseui/block';
import { TopPanel } from '../layout/TopPanel';
import { LeftPanel } from '../layout/LeftPanel';

interface ContainerProps {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    <Block
      width="100%"
      height="100vh"
      display="flex"
      flexDirection="column"
      backgroundColor="#f8f9fa"
    >
      {/* Top Panel */}
      <TopPanel />
      
      {/* Main Content Area with Left Panel and Content */}
      <Block 
        display="flex" 
        flex="1"
        overflow="hidden"
      >
        {/* Left Sidebar */}
        <LeftPanel />
        
        {/* Main Content */}
        <Block
          flex="1"
          backgroundColor="white"
          padding="1.5rem"
          overflow="auto"
        >
          {children}
        </Block>
      </Block>
    </Block>
  );
}; 