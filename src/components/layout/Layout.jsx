import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { isNativePlatform } from '../../lib/platform';
import { WebLayout } from './WebLayout';
import { MobileLayout } from './MobileLayout';

export function Layout({ children }) {
    const location = useLocation();
    const mainRef = useRef(null);

    useEffect(() => {
        const path = location.pathname;
        let title = 'SmartFit';

        if (path === '/' || path === '/dashboard') {
            title = 'Training | SmartFit';
        } else if (path === '/log') {
            title = 'Log Workout | SmartFit';
        } else if (path === '/ai-coach') {
            title = 'AI Coach | SmartFit';
        }

        document.title = title;

        // Reset scroll position on route change to prevent jitter
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    if (isNativePlatform()) {
        return <MobileLayout mainRef={mainRef}>{children}</MobileLayout>;
    }

    return <WebLayout mainRef={mainRef}>{children}</WebLayout>;
}
