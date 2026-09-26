import { router, useFocusEffect } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Switch } from 'react-native-paper';

import { api, clearAuthSession, endpoints, readAuthSession } from '@/api';
import { CustomText, Screen } from '@/components';
import { styles } from '@/screens/SettingsScreen/styles';
import { DEFAULT_THEME, useTheme } from '@/theme';
import { formatBalance } from '@/utils';

type UserBalance = {
  balance: number | string | null;
};

export function SettingsScreen() {
  const { colors, isDark, setTheme } = useTheme();
  const rowStyle = [styles.row, { borderBottomColor: colors.border }];
  const [balance, setBalance] = useState('—');
  const [brokerConnected, setBrokerConnected] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setBrokerConnected(readAuthSession()?.brokerStatus === 'CONNECTED');
    }, []),
  );

  useEffect(() => {
    let cancelled = false;

    api
      .get<UserBalance>(endpoints.balance, {
        headers: { Accept: '*/*' },
      })
      .then((data) => {
        if (!cancelled) {
          setBalance(formatBalance(data.balance));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBalance('—');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    clearAuthSession();
    api.setAccessToken(null);
    setTheme(DEFAULT_THEME);
    router.dismissAll();
    router.replace('/login');
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.list}>
        <View style={rowStyle}>
          <View style={styles.rowMain}>
            <SettingIcon name={{ ios: 'moon', android: 'dark_mode', web: 'dark_mode' }} color={colors.text} />
            <CustomText id="settings-dark-mode-label" variant="body" style={styles.copy}>
              Dark Mode
            </CustomText>
            <Switch
              value={isDark}
              onValueChange={(enabled) => setTheme(enabled ? 'dark' : 'light')}
              color={colors.primary}
            />
          </View>
        </View>
        <View style={rowStyle}>
          <View style={styles.rowMain}>
            <SettingIcon
              name={{ ios: 'indianrupeesign', android: 'account_balance_wallet', web: 'account_balance_wallet' }}
              color={colors.text}
            />
            <View style={styles.copy}>
              <CustomText id="settings-balance-value" variant="medium" style={styles.balanceValue}>
                {balance}
              </CustomText>
              <CustomText id="settings-balance-label" variant="caption">
                Stocks, F&O balance
              </CustomText>
            </View>
          </View>
        </View>
        <View accessibilityState={{ disabled: true }} style={rowStyle}>
          <View style={styles.rowMain}>
            <SettingIcon
              name={{ ios: 'doc.text', android: 'description', web: 'description' }}
              color={colors.textDim}
            />
            <CustomText id="settings-reports" variant="body" style={[styles.copy, { color: colors.textDim }]}>
              Reports
            </CustomText>
          </View>
        </View>
        <View accessibilityState={{ disabled: true }} style={rowStyle}>
          <View style={styles.rowMain}>
            <SettingIcon name={{ ios: 'lock', android: 'lock', web: 'lock' }} color={colors.textDim} />
            <CustomText id="settings-lock-fno" variant="body" style={[styles.copy, { color: colors.textDim }]}>
              Lock F&O trading
            </CustomText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/connect-broker')}
          style={rowStyle}
        >
          <View style={styles.rowMain}>
            <SettingIcon
              name={
                brokerConnected
                  ? { ios: 'link', android: 'link_off', web: 'link_off' }
                  : { ios: 'link', android: 'link', web: 'link' }
              }
              color={colors.text}
            />
            <CustomText
              id={brokerConnected ? 'settings-disconnect-broker' : 'settings-connect-broker'}
              variant="body"
              style={styles.copy}
            >
              {brokerConnected ? 'Disconnect broker' : 'Connect broker'}
            </CustomText>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={logout} style={rowStyle}>
          <View style={styles.rowMain}>
            <SettingIcon
              name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
              color={colors.danger}
            />
            <CustomText id="settings-logout" variant="body" style={[styles.copy, { color: colors.danger }]}>
              Logout
            </CustomText>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
}

function SettingIcon({ name, color }: { name: SymbolViewProps['name']; color: string }) {
  return <SymbolView name={name} tintColor={color} size={22} />;
}
