import { Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { DialogProvider } from '@/components/AppDialog';
import '@/notifications/pushNotifications';
import { ToastProvider } from '@/components/AppToast';
import { ThemeProvider, useTheme } from '@/theme';
import { createNavigationTheme } from '@/theme/navigationTheme';

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

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
