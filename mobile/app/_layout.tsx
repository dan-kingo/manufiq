import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import * as SystemUI from "expo-system-ui";
import * as Linking from 'expo-linking';
import { AuthProvider } from '../contexts/AuthContext';
import { theme } from '../theme/theme';
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { colors } from '../theme/colors';
import { NotificationHandler } from "./components/NotificationHandler";
import { AppState } from 'react-native';
import syncManager from '../services/syncManager.service';
function RootNavigator() {
  const router = useRouter();
  useEffect(() => {
    console.log('🚀 Initializing sync manager in root layout...');
    
    // Initialize sync manager
    syncManager.init();

    // Set up app state listener for foreground/background
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground, checking sync...');
        // Small delay to ensure network is ready
        setTimeout(() => {
          syncManager.syncPendingOperations();
        }, 1000);
      }
    });

    // Cleanup
    return () => {
      subscription?.remove();
      syncManager.destroy();
    };
  }, []);


  useEffect(() => {
    // ensure system bars match app surface color
    SystemUI.setBackgroundColorAsync(colors.surface);
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path, queryParams } = Linking.parse(url);

      if (path === 'verify-email' && queryParams?.token) {
        router.push(`/auth/verify-email?token=${queryParams.token}`);
      } else if (path === 'reset-password' && queryParams?.token) {
        router.push(`/auth/reset-password?token=${queryParams.token}`);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
    <NotificationHandler />
    <Stack

      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
    </>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      {/* Android: set a non-translucent status bar background so the color is visible */}
      {Platform.OS === 'android' && (
        <RNStatusBar backgroundColor={colors.background} barStyle="light-content" translucent={false} />
      )}
      {/* expo StatusBar for consistent style across platforms */}
      <StatusBar style="light" />

      {/* top safe-area background for cases where status bar is translucent or iOS overlay */}
      {Platform.OS === 'android' && (
        <View style={{ height: RNStatusBar.currentHeight || 0, backgroundColor: colors.secondary }} />
      )}

      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
