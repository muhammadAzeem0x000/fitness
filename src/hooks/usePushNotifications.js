import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';
import { getPlatform } from '../lib/platform';

export function usePushNotifications(userId) {
    const [token, setToken] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Only run on native Android/iOS
        if (getPlatform() !== 'android' && getPlatform() !== 'ios') return;
        if (!userId) return;

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

                // Register with Apple / Google to receive token
                await PushNotifications.register();

                // Listeners
                await PushNotifications.addListener('registration', async (tokenData) => {
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
                });

                await PushNotifications.addListener('registrationError', (err) => {
                    console.error('Push registration error: ', err.error);
                });

                await PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ', notification);
                });

                await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed: ', notification);
                    // The payload from firebase v1 comes through under notification.notification.data
                    const data = notification.notification?.data || {};
                    if (data.route) {
                        navigate(data.route, { state: { openLatestReport: true, reportId: data.reportId } });
                    }
                });

            } catch (err) {
                console.error('Failed to initialize push notifications:', err);
            }
        };

        registerPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [userId]);

    return { token };
}
