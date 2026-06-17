import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { isNativePlatform } from './platform';

export const initNativeFeatures = async () => {
    if (!isNativePlatform()) return;

    try {
        // Status Bar configuration
        // We use the dark theme, so we want the status bar to match the slate-900 background
        await StatusBar.setStyle({ style: Style.Dark });
        
        // slate-900 is #0f172a
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
        
        // Ensure status bar isn't overlaying our web content (so Capacitor pushes the webview down)
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Keyboard configuration
        // Prevent the keyboard from squishing our layout, especially bottom nav bars
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });
        
        console.log("Native hardware features initialized.");
    } catch (error) {
        console.error("Error initializing native features:", error);
    }
};
