import React from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SpinnerAreaProps {
  loadingNav: boolean;
  loadingXirr: boolean;
}

export const SpinnerArea: React.FC<SpinnerAreaProps> = ({ loadingNav, loadingXirr }) => (
  <>
    {loadingNav && <LoadingSpinner text="Fetching NAV data..." />}
    {loadingXirr && <LoadingSpinner text="Calculating XIRR..." />}
  </>
); 