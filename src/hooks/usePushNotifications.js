import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';
import { getPlatform } from '../lib/platform';

const REPORT_NOTIFICATION_CHANNEL_ID = 'ai_reports';

export function usePushNotifications(userId) {
    const [token, setToken] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Only run on native Android/iOS
        if (getPlatform() !== 'android' && getPlatform() !== 'ios') return;
        if (!userId) return;

        let cancelled = false;
        const listenerHandles = [];

        const retainListener = async (listenerPromise) => {
            const handle = await listenerPromise;
            if (cancelled) {
                await handle.remove();
            } else {
                listenerHandles.push(handle);
            }
            return handle;
        };

        const registerPush = async () => {
            try {
                // Request permissions
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('User denied push notification permissions');
                    return;
                }

                if (getPlatform() === 'android') {
                    await PushNotifications.createChannel({
                        id: REPORT_NOTIFICATION_CHANNEL_ID,
                        name: 'AI Progress Reports',
                        description: 'Weekly and monthly AI progress report notifications',
                        importance: 4,
                        visibility: 1,
                        vibration: true,
                    });
                }

                // register() emits the registration event, so listeners must be
                // attached first or a fast token response can be lost.
                await retainListener(PushNotifications.addListener('registration', async (tokenData) => {
                    if (cancelled) return;
                    console.log('Push registration success, token: ' + tokenData.value);
                    setToken(tokenData.value);

                    // Save token to Supabase
                    const { error } = await supabase
                        .from('user_devices')
                        .upsert({
                            user_id: userId,
                            fcm_token: tokenData.value,
                            platform: getPlatform() === 'android' ? 'android' : 'ios'
                        }, { onConflict: 'fcm_token' });

                    if (error) {
                        console.error('Error saving push token to DB:', error);
                    }
                }));

                await retainListener(PushNotifications.addListener('registrationError', (err) => {
                    console.error('Push registration error: ', err.error);
                }));

                await retainListener(PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ', notification);
                }));

                await retainListener(PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed: ', notification);
                    // The payload from firebase v1 comes through under notification.notification.data
                    const data = notification.notification?.data || {};
                    if (data.route) {
                        navigate(data.route, { state: { openLatestReport: true, reportId: data.reportId } });
                    }
                }));

                if (cancelled) return;
                await PushNotifications.register();
            } catch (err) {
                console.error('Failed to initialize push notifications:', err);
            }
        };

        registerPush();

        return () => {
            cancelled = true;
            Promise.allSettled(listenerHandles.map((handle) => handle.remove()));
        };
    }, [userId, navigate]);

    return { token };
}
