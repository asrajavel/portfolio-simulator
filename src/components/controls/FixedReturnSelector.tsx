import React, { useState } from 'react';
import { Block } from 'baseui/block';
import { Input } from 'baseui/input';
import { Instrument, FixedReturnInstrument } from '../../types/instrument';

interface FixedReturnSelectorProps {
  onSelect: (instrument: Instrument | null) => void;
  value?: Instrument;
}

export const FixedReturnSelector: React.FC<FixedReturnSelectorProps> = ({ onSelect, value }) => {
  const [percentage, setPercentage] = useState<string>(() => {
    if (value && value.type === 'fixed_return') {
      return value.annualReturnPercentage.toString();
    }
    return '8'; // Default to 8%
  });

  const handlePercentageChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newPercentage = event.target.value;
    setPercentage(newPercentage);
    
    const numValue = parseFloat(newPercentage);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      const fixedReturnInstrument: FixedReturnInstrument = {
        type: 'fixed_return',
        id: `fixed_${numValue}`,
        name: `Fixed ${numValue}% Return`,
        annualReturnPercentage: numValue,
        displayName: `Fixed ${numValue}% Return`
      };
      onSelect(fixedReturnInstrument);
    } else if (newPercentage === '') {
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
        type="number"
        min={0}
        max={50}
        step={0.1}
        value={percentage}
        onChange={handlePercentageChange}
        placeholder="8"
        size="compact"
        overrides={{
          Root: {
            style: {
              width: '100%'
            }
          },
          After: () => (
            <Block
              overrides={{
                Block: {
                  style: {
                    fontSize: '14px',
                    color: '#6b7280',
                    paddingRight: '8px',
                    alignSelf: 'center'
                  }
                }
              }}
            >
              % 
            </Block>
          ),
        }}
      />
    </Block>
  );
};