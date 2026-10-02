import { router, useFocusEffect } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Switch } from 'react-native-paper';

import { ApiError, api, clearAuthSession, endpoints, readAuthSession } from '@/api';
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
  const [pauseTill, setPauseTill] = useState<number | null>(null);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  const loadKillSwitch = useCallback(() => {
    return api
      .get<FnoKillSwitch>(endpoints.fnoKillSwitch, { headers: { Accept: '*/*' } })
      .then((data) => parseEpoch(data?.fno_kill_switch?.pauseTill));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setBrokerConnected(readAuthSession()?.brokerStatus === 'CONNECTED');
      loadKillSwitch()
        .then((epoch) => {
          if (!cancelled) {
            setPauseTill(epoch);
            setLockError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setLockError(messageFrom(err));
          }
        });
      return () => {
        cancelled = true;
      };
    }, [loadKillSwitch]),
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

  const fnoLocked = pauseTill !== null && pauseTill > Date.now();
  const canLockFno = pauseTill !== null && pauseTill <= Date.now();

  async function lockFno(enabled: boolean) {
    if (!enabled || locking || fnoLocked) {
      return;
    }
    setLocking(true);
    setLockError(null);
    try {
      await api.patch(endpoints.fnoKillSwitch, { pauseTill: Date.now() + 5 * 60 * 1000 });
      setPauseTill(await loadKillSwitch());
      setLockError(null);
    } catch (err: unknown) {
      setLockError(messageFrom(err));
    } finally {
      setLocking(false);
    }
  }

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
        <View style={rowStyle}>
          <View style={styles.rowMain}>
            <SettingIcon name={{ ios: 'lock', android: 'lock', web: 'lock' }} color={colors.text} />
            <View style={styles.copy}>
              <CustomText id="settings-lock-fno" variant="body">
                Lock F&O trading
              </CustomText>
              {fnoLocked && pauseTill !== null ? (
                <CustomText id="settings-lock-fno-until" variant="error">
                  F&O trading locked until {formatIst(pauseTill)}
                </CustomText>
              ) : null}
              {lockError ? (
                <CustomText id="settings-lock-fno-error" variant="error">
                  {lockError}
                </CustomText>
              ) : null}
            </View>
            {canLockFno ? (
              <Switch
                value={false}
                disabled={locking}
                onValueChange={lockFno}
                color={colors.primary}
              />
            ) : null}
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

type FnoKillSwitch = {
  fno_kill_switch?: {
    pauseTill?: string | number | null;
  };
};

function parseEpoch(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function formatIst(epochMs: number): string {
  return new Date(epochMs).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function messageFrom(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error instanceof Error ? error.message : 'Request failed';
}

function SettingIcon({ name, color }: { name: SymbolViewProps['name']; color: string }) {
  return <SymbolView name={name} tintColor={color} size={22} />;
}
