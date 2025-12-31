import React from 'react';
import { Button } from 'baseui/button';
import { useStyletron } from 'baseui';
import { useHelp } from './HelpContext';

interface HelpButtonProps {
  topic: string;
  size?: 'mini' | 'compact';
}

export const HelpButton: React.FC<HelpButtonProps> = ({ topic, size = 'mini' }) => {
  const [css] = useStyletron();
  const { openHelp } = useHelp();

  return (
    <Button
      onClick={() => openHelp(topic)}
      size={size}
      kind="tertiary"
      shape="circle"
      overrides={{
        BaseButton: {
          style: {
            padding: size === 'mini' ? '4px' : '6px',
          },
        },
      }}
    >
      <span className={css({ fontSize: size === 'mini' ? '14px' : '16px' })}>?</span>
    </Button>
  );
};

