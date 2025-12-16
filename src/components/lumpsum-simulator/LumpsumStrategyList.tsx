import React from 'react';
import { LumpsumFundControls } from './LumpsumFundControls';
import { StrategyListLayout } from '../common/StrategyListLayout';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { LumpsumStrategy } from '../../types/lumpsumStrategy';
import { Instrument } from '../../types/instrument';

interface LumpsumStrategyListProps {
  lumpsumStrategies: LumpsumStrategy[];
  setLumpsumStrategies: React.Dispatch<React.SetStateAction<LumpsumStrategy[]>>;
  funds: mfapiMutualFund[];
  onInstrumentSelect: (pIdx: number, idx: number, instrument: Instrument | null) => void;
  onAddFund: (pIdx: number) => void;
  onRemoveFund: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onAddStrategy: () => void;
  COLORS: string[];
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const LumpsumStrategyList: React.FC<LumpsumStrategyListProps> = ({
  lumpsumStrategies,
  setLumpsumStrategies,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  onAddStrategy,
  COLORS,
  useInstruments = false,
  defaultSchemeCode
}) => {
  const getAllocationSum = (strategy: LumpsumStrategy) => 
    (strategy.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);

  const renderStrategyControls = (strategy: LumpsumStrategy, pIdx: number) => (
    <LumpsumFundControls
      selectedInstruments={strategy.selectedInstruments || []}
      allocations={strategy.allocations}
      funds={funds}
      onInstrumentSelect={(idx, instrument) => onInstrumentSelect(pIdx, idx, instrument)}
      onAddFund={() => onAddFund(pIdx)}
      onRemoveFund={idx => onRemoveFund(pIdx, idx)}
      onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
      useInstruments={useInstruments}
      defaultSchemeCode={defaultSchemeCode}
    />
  );

  return (
    <StrategyListLayout
      strategies={lumpsumStrategies}
      setStrategies={setLumpsumStrategies}
      COLORS={COLORS}
      onAddStrategy={onAddStrategy}
      getAllocationSum={getAllocationSum}
      renderStrategyControls={renderStrategyControls}
    />
  );
};
