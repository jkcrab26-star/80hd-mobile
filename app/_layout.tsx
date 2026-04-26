import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { AppProvider, useApp } from '../lib/AppContext';
import UpgradeModal from '../components/UpgradeModal';

// Required for expo-web-browser auth session on Android
WebBrowser.maybeCompleteAuthSession();

function UpgradeLayer() {
  const { showUpgrade, setShowUpgrade, activatePro } = useApp();

  // Handle Stripe success deep-link: 80hd://pro-success
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('pro-success')) {
        activatePro();
        setShowUpgrade(false);
      }
    });
    Linking.getInitialURL().then(url => {
      if (url?.includes('pro-success')) activatePro();
    });
    return () => sub.remove();
  }, [activatePro, setShowUpgrade]);

  return (
    <UpgradeModal
      visible={showUpgrade}
      onClose={() => setShowUpgrade(false)}
      onActivatePro={() => { activatePro(); setShowUpgrade(false); }}
    />
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="focus" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="reflect" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <UpgradeLayer />
    </AppProvider>
  );
}
