import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'baseui/input';
import { StatefulMenu } from 'baseui/menu';
import { Block } from 'baseui/block';
import { Instrument } from '../../types/instrument';

interface MutualFundSelectorProps {
  funds: { schemeCode: number; schemeName: string }[];
  onSelect: (instrument: Instrument) => void;
  value?: Instrument;
  defaultSchemeCode?: number;
}

export const MutualFundSelector: React.FC<MutualFundSelectorProps> = ({ 
  funds, 
  onSelect, 
  value,
  defaultSchemeCode
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial value or default
  useEffect(() => {
    if (value && value.type === 'mutual_fund') {
      // If we have a value but the name looks like a placeholder, find the real fund name
      if (value.schemeName.startsWith('Scheme ')) {
        const actualFund = funds.find(f => f.schemeCode === value.schemeCode);
        if (actualFund) {
          // Update the instrument with the correct name
          const correctedInstrument: Instrument = {
            ...value,
            name: actualFund.schemeName,
            schemeName: actualFund.schemeName
          };
          setSelectedName(actualFund.schemeName);
          setQuery(actualFund.schemeName);
          onSelect(correctedInstrument); // Update the parent with correct details
          return;
        }
      }
      setSelectedName(value.schemeName);
      setQuery(value.schemeName);
    } else if (!value && defaultSchemeCode) {
      // Set default fund if no value is provided
      const defaultFund = funds.find(f => f.schemeCode === defaultSchemeCode) ||
                          funds.find(f => f.schemeName.toLowerCase().includes('uti nifty 50')) ||
                          funds[0];
      if (defaultFund) {
        const defaultInstrument: Instrument = {
          type: 'mutual_fund',
          id: defaultFund.schemeCode,
          name: defaultFund.schemeName,
          schemeCode: defaultFund.schemeCode,
          schemeName: defaultFund.schemeName
        };
        setSelectedName(defaultFund.schemeName);
        setQuery(defaultFund.schemeName);
        onSelect(defaultInstrument);
      }
    } else if (!value) {
      setSelectedName('');
      setQuery('');
    }
  }, [value, defaultSchemeCode, funds, onSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(newQuery.length > 0);
    
    if (selectedName && !selectedName.toLowerCase().includes(newQuery.toLowerCase())) {
      setSelectedName('');
    }
  };

  const handleFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (item: any) => {
    const selectedSchemeCode = item.id;
    const selectedSchemeName = item.label;
    
    setQuery(selectedSchemeName);
    setSelectedName(selectedSchemeName);
    setIsOpen(false);
    
    const instrument: Instrument = {
      type: 'mutual_fund',
      id: selectedSchemeCode,
      name: selectedSchemeName,
      schemeCode: selectedSchemeCode,
      schemeName: selectedSchemeName
    };
    
    onSelect(instrument);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredFunds = funds.filter(fund => {
    if (!query.trim()) return false;
    
    const fundNameLower = fund.schemeName.toLowerCase();
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    
    return queryWords.every(word => fundNameLower.includes(word));
  }).slice(0, 20);

  const menuItems = filteredFunds.map(fund => ({
    label: fund.schemeName,
    id: fund.schemeCode
  }));

  return (
    <Block 
      ref={containerRef} 
      position="relative" 
      overrides={{
        Block: {
          style: {
            minWidth: '400px',
            flexGrow: 1,
            flexShrink: 1
          }
        }
      }}
    >
      <Input
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Type to search mutual funds..."
        size="compact"
        overrides={{
          Root: {
            style: {
              width: '100%'
            }
          }
        }}
      />
      
      {isOpen && menuItems.length > 0 && (
        <Block
          position="absolute"
          top="100%"
          left="0"
          right="0"
          backgroundColor="backgroundPrimary"
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                zIndex: 1000,
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderTopStyle: 'solid',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
                borderLeftStyle: 'solid',
                borderTopColor: $theme.colors.borderOpaque,
                borderRightColor: $theme.colors.borderOpaque,
                borderBottomColor: $theme.colors.borderOpaque,
                borderLeftColor: $theme.colors.borderOpaque,
                borderRadius: $theme.borders.radius200,
                boxShadow: $theme.lighting.shadow600,
                maxHeight: '300px',
                overflow: 'auto'
              })
            }
          }}
        >
          <StatefulMenu
            items={menuItems}
            onItemSelect={({ item }) => handleSelect(item)}
            overrides={{
              List: {
                style: ({ $theme }) => ({
                  outline: 'none',
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: 0,
                  marginLeft: 0,
                  paddingTop: 0,
                  paddingRight: 0,
                  paddingBottom: 0,
                  paddingLeft: 0
                })
              },
              Option: {
                style: ({ $theme, $isHighlighted }) => ({
                  paddingTop: $theme.sizing.scale300,
                  paddingBottom: $theme.sizing.scale300,
                  paddingLeft: $theme.sizing.scale600,
                  paddingRight: $theme.sizing.scale600,
                  backgroundColor: $isHighlighted ? $theme.colors.backgroundTertiary : 'transparent',
                  cursor: 'pointer',
                  fontSize: $theme.typography.font300.fontSize,
                  lineHeight: $theme.typography.font300.lineHeight
                })
              }
            }}
          />
        </Block>
      )}
      
      {isOpen && query.length > 0 && menuItems.length === 0 && (
        <Block
          position="absolute"
          top="100%"
          left="0"
          right="0"
          backgroundColor="backgroundPrimary"
          padding="scale600"
          overrides={{
            Block: {
              style: ({ $theme }) => ({
                zIndex: 1000,
                borderTopWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderLeftWidth: '1px',
                borderTopStyle: 'solid',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
                borderLeftStyle: 'solid',
                borderTopColor: $theme.colors.borderOpaque,
                borderRightColor: $theme.colors.borderOpaque,
                borderBottomColor: $theme.colors.borderOpaque,
                borderLeftColor: $theme.colors.borderOpaque,
                borderRadius: $theme.borders.radius200,
                boxShadow: $theme.lighting.shadow600,
                color: $theme.colors.contentSecondary,
                fontSize: $theme.typography.font300.fontSize
              })
            }
          }}
        >
          No funds found matching "{query}"
        </Block>
      )}
    </Block>
  );
};