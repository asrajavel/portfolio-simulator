import React, { useState, useEffect } from 'react';
import { Block } from 'baseui/block';
import { ParagraphMedium } from 'baseui/typography';
import { InflationCalculatorControls } from '../components/inflation-calculator/InflationCalculatorControls';
import { InflationCalculatorChart } from '../components/inflation-calculator/InflationCalculatorChart';
import { useInflationCalculator, InflationSource } from '../hooks/useInflationCalculator';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { getInflationCalcParams, setInflationCalcParams } from '../utils/browser/queryParams';
import { useLocation } from 'react-router-dom';

export const InflationCalculatorTab: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === '/inflation';

  const [source, setSource] = useState<InflationSource>(() => getInflationCalcParams().source);
  const [customRate, setCustomRate] = useState(() => getInflationCalcParams().customRate);
  const [amount, setAmount] = useState(() => getInflationCalcParams().amount);
  const [selectedYear, setSelectedYear] = useState(() => getInflationCalcParams().year);

  const { data, loading, yearRange } = useInflationCalculator(
    source,
    customRate,
    amount,
    selectedYear
  );

  useEffect(() => {
    const clamped = Math.max(yearRange.start, Math.min(yearRange.end, selectedYear));
    if (clamped !== selectedYear) setSelectedYear(clamped);
  }, [yearRange, selectedYear]);

  useEffect(() => {
    if (isActive) {
      setInflationCalcParams(source, customRate, amount, selectedYear);
    }
  }, [source, customRate, amount, selectedYear, isActive]);

  return (
    <Block position="relative">
      <LoadingOverlay active={loading} />

      <Block maxWidth="900px" margin="0 auto" marginBottom="scale400" paddingTop="0" display="flex" justifyContent="center">
        <ParagraphMedium color="contentTertiary" marginTop="0" marginBottom="0">
          See how inflation changes the purchasing power of your money over time.
        </ParagraphMedium>
      </Block>

      <Block maxWidth="900px" margin="0 auto">
        <InflationCalculatorControls
          source={source}
          onSourceChange={setSource}
          customRate={customRate}
          onCustomRateChange={setCustomRate}
          amount={amount}
          onAmountChange={setAmount}
          selectedYear={selectedYear}
          onSelectedYearChange={setSelectedYear}
          yearRange={yearRange}
        />
      </Block>

      <Block maxWidth="90%" margin="0 auto">
        <InflationCalculatorChart
          data={data}
          selectedYear={selectedYear}
          amount={amount}
        />
      </Block>
    </Block>
  );
};
