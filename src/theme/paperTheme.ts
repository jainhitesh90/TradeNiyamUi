import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { themes, type ThemeName } from '@/theme/colors';

export function createPaperTheme(name: ThemeName): MD3Theme {
  const palette = themes[name];
  const base = name === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    dark: name === 'dark',
    roundness: 3,
    colors: {
      ...base.colors,
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      primaryContainer: name === 'dark' ? '#14352C' : '#D8F5EC',
      onPrimaryContainer: name === 'dark' ? '#FFFFFF' : '#06382A',
      secondary: palette.link,
      onSecondary: palette.onPrimary,
      secondaryContainer: name === 'dark' ? '#14352C' : '#D8F5EC',
      onSecondaryContainer: palette.text,
      background: palette.background,
      onBackground: palette.text,
      surface: palette.surface,
      onSurface: palette.text,
      surfaceVariant: palette.surface,
      onSurfaceVariant: palette.textMuted,
      outline: palette.border,
      outlineVariant: palette.border,
      error: palette.error,
      onError: '#FFFFFF',
      errorContainer: name === 'dark' ? '#3D221C' : '#FDE4DE',
      onErrorContainer: palette.error,
      inverseSurface: palette.surface,
      inverseOnSurface: palette.text,
      inversePrimary: palette.primary,
      elevation: {
        ...base.colors.elevation,
        level0: palette.background,
        level1: palette.surface,
        level2: palette.surface,
        level3: palette.surface,
      },
    },
  };
}
