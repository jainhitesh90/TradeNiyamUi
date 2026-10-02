import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api, endpoints, readAuthSession } from '@/api';

type PushPlatform = 'android' | 'ios';

type RegisterFcmTokenRequest = {
  token: string;
  platform: PushPlatform;
};

const ANDROID_CHANNEL_ID = 'default';

let registered: { sessionToken: string; fcmToken: string } | null = null;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function isNativePlatform(platform: string): platform is PushPlatform {
  return platform === 'android' || platform === 'ios';
}

export async function syncFcmToken(fcmToken: string, platform: PushPlatform): Promise<void> {
  const sessionToken = readAuthSession()?.token;
  if (!sessionToken || !fcmToken) {
    return;
  }

  if (registered?.sessionToken === sessionToken && registered.fcmToken === fcmToken) {
    return;
  }

  const body: RegisterFcmTokenRequest = { token: fcmToken, platform };
  await api.post(endpoints.fcmToken, body);
  registered = { sessionToken, fcmToken };
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS !== 'android' || !readAuthSession()?.token) {
    return null;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') {
    return null;
  }

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  if (!isNativePlatform(deviceToken.type) || typeof deviceToken.data !== 'string' || !deviceToken.data) {
    return null;
  }

  await syncFcmToken(deviceToken.data, deviceToken.type);
  return deviceToken.data;
}

export function usePushNotifications(): void {
  useEffect(() => {
    void registerForPushNotifications().catch(() => undefined);

    const subscription = Notifications.addPushTokenListener((deviceToken) => {
      if (deviceToken.type !== 'android' || typeof deviceToken.data !== 'string') {
        return;
      }
      void syncFcmToken(deviceToken.data, deviceToken.type).catch(() => undefined);
    });

    return () => subscription.remove();
  }, []);
}
