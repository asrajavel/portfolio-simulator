import ReactGA from 'react-ga4';

// Google Analytics Measurement ID
const MEASUREMENT_ID = 'G-K2VND42Y6S';

export const initializeAnalytics = () => {
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

// Page view tracking
export const trackPageView = (page: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page });
  }
};

// Simulation events
export const trackSimulation = (type: 'SIP' | 'Lumpsum', action: 'Plot' | 'AddStrategy' | 'RemoveStrategy') => {
  if (MEASUREMENT_ID) {
    ReactGA.event({
      category: 'Simulation',
      action,
      label: type,
    });
  }
};

// Help events
export const trackHelp = (topic: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.event({
      category: 'Help',
      action: 'Open',
      label: topic,
    });
  }
};

