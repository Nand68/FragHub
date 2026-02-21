import { MD3DarkTheme, MD3Theme } from 'react-native-paper';

export const colors = {
  background: '#050811',
  backgroundAlt: '#050511',
  surface: '#0f172a',
  surfaceSoft: '#020617',
  primary: '#6366f1',
  primarySoft: '#4f46e5',
  accent: '#22c55e',
  danger: '#ef4444',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  border: '#1f2937',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  full: 999,
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.accent,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceSoft,
    outline: colors.border,
    error: colors.danger,
    onBackground: colors.text,
    onSurface: colors.text,
  },
};

