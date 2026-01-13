import React, { useState, useEffect } from 'react';
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { Asset } from '../../types/asset';
import { HelpButton } from '../help';

interface YahooFinanceSelectorProps {
  onSelect: (asset: Asset | null) => void;
  value?: Asset;
}

export const YahooFinanceSelector: React.FC<YahooFinanceSelectorProps> = ({
  onSelect,
  value
}) => {
  const [symbol, setSymbol] = useState('');

  // Set initial value
  useEffect(() => {
    if (value && value.type === 'yahoo_finance') {
      setSymbol(value.symbol);
    } else {
      setSymbol('');
    }
  }, [value]);

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSymbol = e.target.value.toUpperCase();
    setSymbol(newSymbol);

    if (newSymbol.trim()) {
      const asset: Asset = {
        type: 'yahoo_finance',
        id: newSymbol.trim(),
        name: newSymbol.trim(),
        symbol: newSymbol.trim(),
        displayName: newSymbol.trim()
      };
      onSelect(asset);
    } else {
      onSelect(null);
    }
  };

  return (
    <Block
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
        value={symbol}
        onChange={handleSymbolChange}
        placeholder="Stock symbol"
        size="compact"
        overrides={{
          Root: {
            style: {
              width: '100%'
            }
          },
          After: () => (
            <Block display="flex" alignItems="center" paddingRight="scale300">
              <HelpButton topic="yahoo-tickers" />
            </Block>
          )
        }}
      />
    </Block>
  );
}; 