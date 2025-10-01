import React, { useState, useEffect } from 'react';
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { StatefulTooltip } from 'baseui/tooltip';
import { LabelSmall } from 'baseui/typography';
import { Instrument } from '../../types/instrument';
import { Alert } from 'baseui/icon';

interface YahooFinanceSelectorProps {
  onSelect: (instrument: Instrument | null) => void;
  value?: Instrument;
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
      const instrument: Instrument = {
        type: 'yahoo_finance',
        id: newSymbol.trim(),
        name: newSymbol.trim(),
        symbol: newSymbol.trim(),
        displayName: newSymbol.trim()
      };
      onSelect(instrument);
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
            <StatefulTooltip
              content={
                <Block padding="scale300">
                  <LabelSmall>
                    Examples:<br />
                    • TCS.NS (Indian stock - NSE)<br />
                    • RELIANCE.BO (Indian stock - BSE)<br />
                    • AAPL (US stock - Apple Inc.)<br />
                    • TSLA (US stock - Tesla)<br />
                    • ^GSPC (S&P 500 index - S&P 500)<br />
                    • ^NSEI (Index - NIFTY 50)<br />
                    • USDINR=X (Currency - USD to INR)<br />
                    • EURUSD=X (Currency - Euro to USD)<br />
                    • BTC-USD (Crypto - Bitcoin in INR)<br />
                    • GC=F (Commodity - Gold Futures in USD)<br />
                    • MCX:GOLD1! (Commodity - Gold in INR on MCX)<br />
                  </LabelSmall>
                </Block>
              }
              placement="top"
              accessibilityType={'tooltip'}
              overrides={{
                Body: {
                  style: ({ $theme }) => ({
                    backgroundColor: $theme.colors.backgroundPrimary,
                    color: $theme.colors.contentPrimary,
                    boxShadow: $theme.lighting.shadow600,
                  }),
                },
                Inner: {
                  style: ({ $theme }) => ({
                    backgroundColor: $theme.colors.backgroundPrimary,
                  }),
                },
              }}
            >
              <Block
                display="flex"
                alignItems="center"
                paddingRight="scale300"
              >
                <Alert size="18px" cursor="help" />
              </Block>
            </StatefulTooltip>
          )
        }}
      />
    </Block>
  );
}; 