import { NavigationBar } from 'expo-navigation-bar';
import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { api, restoreAuthSession } from '@/api';
import { DialogProvider } from '@/components/AppDialog';
import '@/notifications/pushNotifications';
import { ToastProvider } from '@/components/AppToast';
import { ThemeProvider, useTheme } from '@/theme';
import { createNavigationTheme } from '@/theme/navigationTheme';

void ExpoSplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DialogProvider>
          <RootNavigator />
        </DialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { colors, isDark, theme } = useTheme();
  const navigationTheme = useMemo(() => createNavigationTheme(theme), [theme]);
  const [ready, setReady] = useState(Platform.OS === 'web');

  useEffect(() => {
    let active = true;
    void restoreAuthSession()
      .then((session) => {
        api.setAccessToken(session?.token ?? null);
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      void ExpoSplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
