import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';

// Hide splash screen after app is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Hide splash screen
    await SplashScreen.hide();
    
    // Check network status
    const status = await Network.getStatus();
    console.log('Network status:', status);
    
    // Listen for network status changes
    Network.addListener('networkStatusChange', status => {
      console.log('Network status changed', status);
    });
  } catch (error) {
    console.error('Error initializing Capacitor plugins:', error);
  }
});