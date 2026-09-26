import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, View } from 'react-native';
import { Switch } from 'react-native-paper';

import { api, clearAuthSession } from '@/api';
import { CustomText, Screen } from '@/components';
import { styles } from '@/screens/SettingsScreen/styles';
import { DEFAULT_THEME, useTheme } from '@/theme';

const BALANCE_MARGIN = '₹1,25,430.50';

export function SettingsScreen() {
  const { colors, isDark, setTheme } = useTheme();
  const rowStyle = [styles.row, { borderBottomColor: colors.border }];

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
              <CustomText id="settings-balance-label" variant="body">
                Balance Margin
              </CustomText>
              <CustomText id="settings-balance-value" variant="small">
                {BALANCE_MARGIN}
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
