/**
 * Design tokens mirrored 1:1 from the web app (src/app/globals.css + Tailwind slate/cyan
 * scales used across src/app and src/components). The web defaults to dark mode
 * (see src/app/layout.tsx -> <ThemeProvider defaultTheme="dark">), so `dark` is the
 * baseline palette here too. Keep these values in sync if the web palette changes.
 */

import { Platform } from 'react-native';

// Raw Tailwind scale values actually used across the web app. Prefer the semantic
// `Colors` tokens below in screens; reach for these only for one-off accents
// (status badges, chart bars, icon tints) that map directly to a Tailwind class.
export const Palette = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  slate950: '#020617',
  white: '#ffffff',

  cyan400: '#22d3ee',
  cyan500: '#06b6d4',
  cyan600: '#0891b2', // == --color-primary on web
  cyan50: '#ecfeff',

  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',

  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber50: '#fffbeb',

  orange400: '#fb923c',
  orange500: '#f97316',
  orange50: '#fff7ed',

  rose400: '#fb7185',
  rose500: '#f43f5e',
  rose50: '#fff1f2',

  red400: '#f87171',
  red500: '#ef4444',
  red50: '#fef2f2',

  violet400: '#a78bfa',
  violet600: '#7c3aed',
  violet50: '#f5f3ff',
} as const;

export const Primary = Palette.cyan600;

/**
 * Semantic tokens. Names map to the role a color plays on the web page, so a
 * component ports 1:1: `bg-white dark:bg-slate-900` -> `colors.surface`,
 * `text-slate-900 dark:text-white` -> `colors.textPrimary`, etc.
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryAccent: string;
  primarySoft: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: Palette.slate50, // bg-slate-50 (DashboardLayout)
    surface: Palette.white, // bg-white (cards)
    surfaceAlt: Palette.slate100, // bg-slate-100 (pills, chips)
    surfaceSunken: Palette.slate50, // bg-slate-50 (inset panels)
    border: Palette.slate200, // border-slate-200
    borderLight: Palette.slate100,
    textPrimary: Palette.slate900, // text-slate-900
    textSecondary: Palette.slate500, // text-slate-500
    textMuted: Palette.slate400, // text-slate-400 (uppercase labels)
    primary: Palette.cyan600, // text-primary / bg-primary
    primaryAccent: Palette.cyan600, // cyan accent text in light mode
    primarySoft: Palette.cyan50, // bg-cyan-50
    icon: Palette.slate500,
    tabIconDefault: Palette.slate400,
    tabIconSelected: Palette.cyan600,
  },
  dark: {
    background: Palette.slate950, // bg-slate-950
    surface: Palette.slate900, // bg-slate-900
    surfaceAlt: 'rgba(255,255,255,0.05)', // bg-white/5
    surfaceSunken: 'rgba(2,6,23,0.4)', // bg-slate-950/40
    border: Palette.slate800, // border-slate-800
    borderLight: 'rgba(255,255,255,0.1)', // border-white/10
    textPrimary: Palette.white,
    textSecondary: Palette.slate400, // text-slate-400
    textMuted: Palette.slate500, // text-slate-500
    primary: Palette.cyan600,
    primaryAccent: Palette.cyan400, // dark:text-cyan-400
    primarySoft: 'rgba(8,145,178,0.15)', // dark:bg-cyan-950/30 approximation
    icon: Palette.slate400,
    tabIconDefault: Palette.slate500,
    tabIconSelected: Palette.cyan400,
  },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
