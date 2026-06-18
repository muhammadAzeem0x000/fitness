import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { isNativePlatform } from '../lib/platform';

// Global stack for back button interceptors
const backButtonInterceptors = [];

export const useBackInterceptor = (handler, active = true) => {
  useEffect(() => {
    if (!active) return;
    
    // Add handler to the top of the stack
    backButtonInterceptors.push(handler);
    
    return () => {
      // Remove handler from the stack
      const index = backButtonInterceptors.indexOf(handler);
      if (index !== -1) {
        backButtonInterceptors.splice(index, 1);
      }
    };
  }, [handler, active]);
};

export const useHardwareBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativePlatform()) return;

    const handleBackButton = ({ canGoBack }) => {
      // 1. Check if there are any active interceptors
      if (backButtonInterceptors.length > 0) {
        // Call the most recent interceptor
        const handler = backButtonInterceptors[backButtonInterceptors.length - 1];
        handler();
        return;
      }

      // 2. Default behavior
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
