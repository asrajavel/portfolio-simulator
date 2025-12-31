import React, { createContext, useContext, useState, useCallback } from 'react';
import { trackHelp } from '../../utils/analytics';

interface HelpContextType {
  isOpen: boolean;
  currentTopic: string | null;
  openHelp: (topic: string) => void;
  closeHelp: () => void;
}

const HelpContext = createContext<HelpContextType | null>(null);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);

  const openHelp = useCallback((topic: string) => {
    setCurrentTopic(topic);
    setIsOpen(true);
    trackHelp(topic);
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <HelpContext.Provider value={{ isOpen, currentTopic, openHelp, closeHelp }}>
      {children}
    </HelpContext.Provider>
  );
};

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

