import React, { useState, useEffect } from 'react';
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { Checkbox, STYLE_TYPE } from 'baseui/checkbox';
import { Asset, YahooFinanceAsset } from '../../types/asset';
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
  const [convertToINR, setConvertToINR] = useState(false);

  useEffect(() => {
    if (value && value.type === 'yahoo_finance') {
      setSymbol(value.symbol);
      setConvertToINR(value.convertToINR);
    } else {
      setSymbol('');
      setConvertToINR(false);
    }
  }, [value]);

  const buildAsset = (sym: string, convert: boolean): YahooFinanceAsset => ({
    type: 'yahoo_finance',
    id: sym,
    name: convert ? `${sym} (INR)` : sym,
    symbol: sym,
    displayName: convert ? `${sym} (INR)` : sym,
    convertToINR: convert
  });

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newSymbol = e.target.value.toUpperCase();
    setSymbol(newSymbol);

    if (newSymbol.trim()) {
      onSelect(buildAsset(newSymbol.trim(), convertToINR));
    } else {
      onSelect(null);
    }
  };

  const handleConvertToggle = () => {
    const newConvert = !convertToINR;
    setConvertToINR(newConvert);
    if (symbol.trim()) {
      onSelect(buildAsset(symbol.trim(), newConvert));
    }
  };

  return (
    <Block display="flex" alignItems="center" $style={{ gap: '8px', minWidth: '400px', flexGrow: 1, flexShrink: 1 }}>
      <Block $style={{ flexGrow: 1 }}>
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
      <Checkbox
        checked={convertToINR}
        onChange={handleConvertToggle}
        checkmarkType={STYLE_TYPE.toggle_round}
        overrides={{
          Label: {
            style: { fontSize: '13px', whiteSpace: 'nowrap', paddingLeft: '4px' }
          },
          Root: {
            style: { marginBottom: 0 }
          }
        }}
      >
        INR
      </Checkbox>
    </Block>
  );
}; 