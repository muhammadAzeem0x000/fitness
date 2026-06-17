import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from './platform';

export const hapticLight = async () => {
    if (!isNativePlatform()) return;
    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) { /* ignore on unsupported devices */ }
};

export const hapticMedium = async () => {
    if (!isNativePlatform()) return;
    try {
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) { /* ignore */ }
};

export const hapticHeavy = async () => {
    if (!isNativePlatform()) return;
    try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) { /* ignore */ }
};

export const hapticSuccess = async () => {
    if (!isNativePlatform()) return;
    try {
        await Haptics.notification({ type: NotificationType.Success });
    } catch (e) { /* ignore */ }
};

export const hapticError = async () => {
    if (!isNativePlatform()) return;
    try {
        await Haptics.notification({ type: NotificationType.Error });
    } catch (e) { /* ignore */ }
};
