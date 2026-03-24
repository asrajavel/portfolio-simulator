import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { Checkbox } from 'baseui/checkbox';
import { matchSorter } from 'match-sorter';
import { Asset } from '../../types/asset';
import { useMutualFundsContext } from '../../hooks/useMutualFunds';

interface MutualFundSelectorProps {
  onSelect: (asset: Asset) => void;
  value?: Asset;
  defaultSchemeCode?: number;
  excludeSchemeCodes?: number[];
}

const isPlaceholderName = (name: string) => /^Scheme \d+$/.test(name);

export const MutualFundSelector: React.FC<MutualFundSelectorProps> = ({ 
  onSelect, 
  value,
  defaultSchemeCode,
  excludeSchemeCodes = [],
}) => {
  const { funds, loading, error } = useMutualFundsContext();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>('');
  const [includeRegular, setIncludeRegular] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set initial value or default
  useEffect(() => {
    if (value && value.type === 'mutual_fund') {
      // If we have a value but the name looks like a placeholder, find the real fund name
      if (isPlaceholderName(value.schemeName)) {
        const actualFund = funds.find(f => f.schemeCode === value.schemeCode);
        if (actualFund) {
          // Update the asset with the correct name
          const correctedAsset: Asset = {
            ...value,
            name: actualFund.schemeName,
            schemeName: actualFund.schemeName
          };
          setSelectedName(actualFund.schemeName);
          setQuery(actualFund.schemeName);
          onSelect(correctedAsset); // Update the parent with correct details
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
        const defaultAsset: Asset = {
          type: 'mutual_fund',
          id: defaultFund.schemeCode,
          name: defaultFund.schemeName,
          schemeCode: defaultFund.schemeCode,
          schemeName: defaultFund.schemeName
        };
        setSelectedName(defaultFund.schemeName);
        setQuery(defaultFund.schemeName);
        onSelect(defaultAsset);
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
    
    const asset: Asset = {
      type: 'mutual_fund',
      id: selectedSchemeCode,
      name: selectedSchemeName,
      schemeCode: selectedSchemeCode,
      schemeName: selectedSchemeName
    };
    
    onSelect(asset);
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

  const eligibleFunds = useMemo(() => {
    let filtered = funds;
    if (!includeRegular) {
      filtered = filtered.filter(f => f.schemeName.toLowerCase().includes('direct'));
    }
    if (excludeSchemeCodes.length > 0) {
      const excludeSet = new Set(excludeSchemeCodes);
      filtered = filtered.filter(f => !excludeSet.has(f.schemeCode));
    }
    return filtered;
  }, [funds, includeRegular, excludeSchemeCodes]);

  const filteredFunds = query.trim()
    ? matchSorter(eligibleFunds, query, { keys: ['schemeName'] }).slice(0, 20)
    : [];

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
        value={(error || loading) && isPlaceholderName(query) ? '' : query}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={loading ? "Loading mutual funds..." : error ? "Mutual fund data unavailable, try again later" : "Type to search mutual funds..."}
        disabled={loading || !!error}
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
          <Block
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  position: 'sticky' as const,
                  top: 0,
                  zIndex: 1,
                  backgroundColor: $theme.colors.backgroundSecondary,
                  paddingTop: $theme.sizing.scale200,
                  paddingBottom: $theme.sizing.scale200,
                  paddingLeft: $theme.sizing.scale600,
                  paddingRight: $theme.sizing.scale600,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: $theme.colors.borderOpaque,
                })
              }
            }}
          >
            <Checkbox
              checked={includeRegular}
              onChange={() => setIncludeRegular(prev => !prev)}
            >
              Include regular funds
            </Checkbox>
          </Block>
          {menuItems.map(item => (
            <Block
              key={item.id}
              onClick={() => handleSelect(item)}
              overrides={{
                Block: {
                  style: ({ $theme }) => ({
                    ...$theme.typography.font300,
                    paddingTop: $theme.sizing.scale300,
                    paddingBottom: $theme.sizing.scale300,
                    paddingLeft: $theme.sizing.scale600,
                    paddingRight: $theme.sizing.scale600,
                    cursor: 'pointer',
                    ':hover': {
                      backgroundColor: $theme.colors.backgroundTertiary,
                    },
                  })
                }
              }}
            >
              {item.label}
            </Block>
          ))}
        </Block>
      )}
      
      {isOpen && query.length > 0 && menuItems.length === 0 && (
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
              })
            }
          }}
        >
          <Block
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  backgroundColor: $theme.colors.backgroundSecondary,
                  paddingTop: $theme.sizing.scale200,
                  paddingBottom: $theme.sizing.scale200,
                  paddingLeft: $theme.sizing.scale600,
                  paddingRight: $theme.sizing.scale600,
                  borderBottomWidth: '1px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: $theme.colors.borderOpaque,
                })
              }
            }}
          >
            <Checkbox
              checked={includeRegular}
              onChange={() => setIncludeRegular(prev => !prev)}
            >
              Include regular funds
            </Checkbox>
          </Block>
          <Block
            padding="scale600"
            overrides={{
              Block: {
                style: ({ $theme }) => ({
                  color: $theme.colors.contentSecondary,
                  fontSize: $theme.typography.font300.fontSize,
                })
              }
            }}
          >
            No funds found matching "{query}"
          </Block>
        </Block>
      )}
    </Block>
  );
};