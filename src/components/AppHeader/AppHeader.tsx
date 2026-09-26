import { router, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readAuthSession } from '@/api';
import { styles } from '@/components/AppHeader/styles';
import { CustomText } from '@/components/CustomText';
import { useTheme } from '@/theme';
import { initialsFrom } from '@/utils';

export function AppHeader() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const session = readAuthSession();
  const initials = initialsFrom(session?.name, session?.emailId);
  const showBack = pathname.split('/').filter(Boolean).pop() === 'settings';

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.surface }}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.brand}>
          {showBack ? (
            <Pressable
              testID="app-header-back"
              nativeID="app-header-back"
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              onPress={() => router.back()}
              style={styles.back}
            >
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor={colors.text}
                size={24}
              />
            </Pressable>
          ) : (
            <Image
              accessibilityLabel="TradeNiyam"
              source={require('../../../assets/app_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <CustomText id="app-header-title" variant="medium" numberOfLines={1} style={styles.title}>
            {pageTitle(pathname)}
          </CustomText>
        </View>
        {showBack ? null : (
          <Pressable
            testID="app-header-avatar"
            nativeID="app-header-avatar"
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={8}
            onPress={() => router.push('/settings')}
            style={[styles.avatar, { backgroundColor: colors.primary }]}
          >
            <CustomText id="app-header-initials" variant="label" style={{ color: colors.onPrimary }}>
              {initials}
            </CustomText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const pageTitles: Record<string, string> = {
  performance: 'Performance',
  position: 'Position',
  orders: 'Orders',
  rules: 'Rules',
  profile: 'Profile',
  'connect-broker': 'Brokers',
  home: 'Home',
  settings: 'Settings',
};

function pageTitle(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean).pop() ?? '';
  return pageTitles[segment] ?? 'TradeNiyam';
}

