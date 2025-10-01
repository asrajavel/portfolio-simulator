import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'baseui/input';
import { StatefulMenu } from 'baseui/menu';
import { Block } from 'baseui/block';

interface MutualFundDropdownProps {
  funds: { schemeCode: number; schemeName: string }[];
  onSelect: (code: number) => void;
  value?: number;
}

export const MutualFundDropdown: React.FC<MutualFundDropdownProps> = ({ funds, onSelect, value }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial value
  useEffect(() => {
    if (value) {
      const fund = funds.find(f => f.schemeCode === value);
      if (fund) {
        setSelectedFund(fund.schemeName);
        setQuery(fund.schemeName);
      }
    }
  }, [value, funds]);

  // Filter funds based on query
  const filteredFunds = funds.filter(fund => {
    if (!query.trim()) return false;
    
    const fundNameLower = fund.schemeName.toLowerCase();
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    
    // Check if all query words are present in the fund name
    return queryWords.every(word => fundNameLower.includes(word));
  }).slice(0, 20); // Limit to 20 suggestions

  // Convert to menu items
  const menuItems = filteredFunds.map(fund => ({
    label: fund.schemeName,
    id: fund.schemeCode
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(newQuery.length > 0);
    
    // Clear selection if query doesn't match selected fund
    if (selectedFund && !selectedFund.toLowerCase().includes(newQuery.toLowerCase())) {
      setSelectedFund('');
    }
  };

  const handleInputFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleMenuItemSelect = (item: any) => {
    const selectedSchemeCode = item.id;
    const selectedSchemeName = item.label;
    
    setQuery(selectedSchemeName);
    setSelectedFund(selectedSchemeName);
    setIsOpen(false);
    onSelect(selectedSchemeCode);
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
        onChange={handleInputChange}
        onFocus={handleInputFocus}
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
                border: `1px solid ${$theme.colors.borderOpaque}`,
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
            onItemSelect={({ item }) => handleMenuItemSelect(item)}
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
                border: `1px solid ${$theme.colors.borderOpaque}`,
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