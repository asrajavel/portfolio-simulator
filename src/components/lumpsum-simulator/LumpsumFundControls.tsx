import React from 'react';
import { BaseFundControls } from '../common/BaseFundControls';
import { Instrument } from '../../types/instrument';

interface LumpsumFundControlsProps {
  selectedInstruments: (Instrument | null)[];
  allocations: (number | null)[];
  funds: { schemeCode: number; schemeName: string }[];
  onInstrumentSelect: (idx: number, instrument: Instrument | null) => void;
  onAddFund: () => void;
  onRemoveFund: (idx: number) => void;
  onAllocationChange: (idx: number, value: number) => void;
  disableControls: boolean;
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const LumpsumFundControls: React.FC<LumpsumFundControlsProps> = ({
  selectedInstruments,
  allocations,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  disableControls,
  useInstruments = true,
  defaultSchemeCode,
}) => {
  return (
    <BaseFundControls
      selectedInstruments={selectedInstruments}
      allocations={allocations}
      funds={funds}
      onInstrumentSelect={onInstrumentSelect}
      onAddFund={onAddFund}
      onRemoveFund={onRemoveFund}
      onAllocationChange={onAllocationChange}
      disableControls={disableControls}
      useInstruments={useInstruments}
      defaultSchemeCode={defaultSchemeCode}
    >
      {/* No additional controls for lumpsum */}
    </BaseFundControls>
  );
};

