import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { mfapiMutualFund } from '../types/mfapiMutualFund';
import { fetchMutualFunds } from '../services/mfapiFundNamesService';

interface MutualFundsContextValue {
  funds: mfapiMutualFund[];
  loading: boolean;
  error: string | null;
}

const MutualFundsContext = createContext<MutualFundsContextValue>({
  funds: [],
  loading: true,
  error: null,
});

export const MutualFundsProvider = MutualFundsContext.Provider;

export const useMutualFundsContext = () => useContext(MutualFundsContext);

export const useMutualFunds = () => {
  const [funds, setFunds] = useState<mfapiMutualFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFunds = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMutualFunds();
        setFunds(data);
      } catch (err) {
        setError('Failed to fetch mutual funds');
        setFunds([]);
        console.error('Error fetching mutual funds:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFunds();
  }, []);

  return useMemo(() => ({ funds, loading, error }), [funds, loading, error]);
};
