import { useCallback } from 'react';
import { Instrument } from '../types/instrument';
import { fetchNavData } from '../services/mfapiNavService';
import { indexService } from '../services/indexService';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { fixedReturnService } from '../services/fixedReturnService';

export const useInstrumentNavData = () => {
  const loadNavData = useCallback(async (instrument: Instrument) => {
    switch (instrument.type) {
      case 'mutual_fund':
        return fetchNavData(instrument.schemeCode);
      case 'index_fund':
        return indexService.fetchIndexData(instrument.indexName);
      case 'yahoo_finance':
        return yahooFinanceService.fetchStockData(instrument.symbol);
      case 'fixed_return':
        return fixedReturnService.generateFixedReturnData(
          instrument.annualReturnPercentage,
          1990
        );
    }
  }, []);

  return { loadNavData };
};

