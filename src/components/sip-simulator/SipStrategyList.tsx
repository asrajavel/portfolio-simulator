import React from 'react';
import { SipFundControls } from './SipFundControls';
import { StrategyListLayout } from '../common/StrategyListLayout';
import { mfapiMutualFund } from '../../types/mfapiMutualFund';
import { SipStrategy } from '../../types/sipStrategy';
import { Instrument } from '../../types/instrument';

interface SipStrategyListProps {
  sipStrategies: SipStrategy[];
  setSipStrategies: React.Dispatch<React.SetStateAction<SipStrategy[]>>;
  funds: mfapiMutualFund[];
  onInstrumentSelect: (pIdx: number, idx: number, instrument: Instrument | null) => void;
  onAddFund: (pIdx: number) => void;
  onRemoveFund: (pIdx: number, idx: number) => void;
  onAllocationChange: (pIdx: number, idx: number, value: number) => void;
  onToggleRebalancing: (pIdx: number) => void;
  onRebalancingThresholdChange: (pIdx: number, value: number) => void;
  onToggleStepUp: (pIdx: number) => void;
  onStepUpPercentageChange: (pIdx: number, value: number) => void;
  onAddStrategy: () => void;
  COLORS: string[];
  useInstruments?: boolean;
  defaultSchemeCode?: number;
}

export const SipStrategyList: React.FC<SipStrategyListProps> = ({
  sipStrategies,
  setSipStrategies,
  funds,
  onInstrumentSelect,
  onAddFund,
  onRemoveFund,
  onAllocationChange,
  onToggleRebalancing,
  onRebalancingThresholdChange,
  onToggleStepUp,
  onStepUpPercentageChange,
  onAddStrategy,
  COLORS,
  useInstruments = false,
  defaultSchemeCode
}) => {
  const getAllocationSum = (strategy: SipStrategy) => 
    (strategy.allocations || []).reduce((a, b) => a + (Number(b) || 0), 0);

  const renderStrategyControls = (strategy: SipStrategy, pIdx: number) => (
    <SipFundControls
      selectedInstruments={strategy.selectedInstruments || []}
      allocations={strategy.allocations}
      funds={funds}
      onInstrumentSelect={(idx, instrument) => onInstrumentSelect(pIdx, idx, instrument)}
      onAddFund={() => onAddFund(pIdx)}
      onRemoveFund={idx => onRemoveFund(pIdx, idx)}
      onAllocationChange={(idx, value) => onAllocationChange(pIdx, idx, value)}
      rebalancingEnabled={strategy.rebalancingEnabled}
      onToggleRebalancing={() => onToggleRebalancing(pIdx)}
      rebalancingThreshold={strategy.rebalancingThreshold}
      onRebalancingThresholdChange={value => onRebalancingThresholdChange(pIdx, value)}
      stepUpEnabled={strategy.stepUpEnabled}
      onToggleStepUp={() => onToggleStepUp(pIdx)}
      stepUpPercentage={strategy.stepUpPercentage}
      onStepUpPercentageChange={value => onStepUpPercentageChange(pIdx, value)}
      useInstruments={useInstruments}
      defaultSchemeCode={defaultSchemeCode}
    />
  );

  return (
    <StrategyListLayout
      strategies={sipStrategies}
      setStrategies={setSipStrategies}
      COLORS={COLORS}
      onAddStrategy={onAddStrategy}
      getAllocationSum={getAllocationSum}
      renderStrategyControls={renderStrategyControls}
    />
  );
};
