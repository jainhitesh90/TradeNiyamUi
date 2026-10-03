import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image } from 'react-native';

import { readAuthSession } from '@/api';
import { Screen } from '@/components';
import { styles } from '@/screens/SplashScreen/styles';

const SPLASH_DURATION_MS = 1000;

export function SplashScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = readAuthSession()?.token;
      router.replace(token ? '/performance' : '/login');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Screen style={styles.container}>
      <Image
        accessibilityLabel="TradeRakshak"
        source={require('../../../assets/app_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Screen>
  );
}
