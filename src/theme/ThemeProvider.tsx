import * as SystemUI from 'expo-system-ui';
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import { DEFAULT_THEME, themes, type ThemeColors, type ThemeName } from '@/theme/colors';
import { createPaperTheme } from '@/theme/paperTheme';

type ThemeContextValue = {
  theme: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

let activeTheme: ThemeName = DEFAULT_THEME;

function applyNativeTheme(theme: ThemeName) {
  try {
    Appearance.setColorScheme(theme);
  } catch {
    // react-native-web does not implement Appearance.setColorScheme.
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.style.colorScheme = theme;
  }

  void SystemUI.setBackgroundColorAsync(themes[theme].background);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(activeTheme);
  const setTheme = useCallback((next: ThemeName) => {
    activeTheme = next;
    setThemeState(next);
  }, []);
  const paperTheme = useMemo(() => createPaperTheme(theme), [theme]);

  useLayoutEffect(() => {
    applyNativeTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: themes[theme],
      isDark: theme === 'dark',
      setTheme,
    }),
    [setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  useColorScheme();
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
