import { DarkTheme, DefaultTheme } from 'expo-router';

import { themes, type ThemeName } from '@/theme/colors';

type NavigationTheme = typeof DarkTheme;

export function createNavigationTheme(name: ThemeName): NavigationTheme {
  const base = name === 'dark' ? DarkTheme : DefaultTheme;
  const palette = themes[name];

  return {
    ...base,
    dark: name === 'dark',
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.danger,
    },
  };
}
