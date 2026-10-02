import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { readAuthSession } from '@/api';
import { AppHeader } from '@/components';
import { usePushNotifications } from '@/notifications/pushNotifications';
import { useTheme } from '@/theme';

export default function AppLayout() {
  const { colors } = useTheme();
  usePushNotifications();

  if (!readAuthSession()?.token) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </View>
  );
}
