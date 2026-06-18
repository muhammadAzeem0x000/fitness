import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { isNativePlatform } from '../lib/platform';

export const useHardwareBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const handleBackButton = ({ canGoBack }) => {
      // Define root routes where back button should exit the app instead of navigating back
      const rootRoutes = ['/dashboard', '/auth', '/', '/onboarding'];
      
      if (rootRoutes.includes(location.pathname)) {
        CapacitorApp.exitApp();
      } else {
        // Navigate back in history
        navigate(-1);
      }
    };

    const listener = CapacitorApp.addListener('backButton', handleBackButton);

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);
};
