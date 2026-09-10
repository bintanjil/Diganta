/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1B14',
    textSecondary: '#5B6B63',
    background: '#F6F8F6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EFE9',
    card: '#FFFFFF',
    border: '#E2E8E4',
    muted: '#EEF2EF',
    primary: '#00875A',
    primarySoft: '#DCF2E8',
    onPrimary: '#FFFFFF',
    danger: '#E5484D',
    dangerSoft: '#FCE8E8',
    success: '#2E9E5B',
    warning: '#D9820B',
    warningSoft: '#FDF0DA',
  },
  dark: {
    text: '#F2F5F3',
    textSecondary: '#9AA7A0',
    background: '#0D0F0E',
    backgroundElement: '#171A18',
    backgroundSelected: '#232824',
    card: '#171A18',
    border: '#2A2F2C',
    muted: '#1E2220',
    primary: '#34D399',
    primarySoft: '#123527',
    onPrimary: '#04231A',
    danger: '#FF6369',
    dangerSoft: '#3A1A1C',
    success: '#3DD68C',
    warning: '#FFB224',
    warningSoft: '#3A2A0E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const FontFamily = {
  en: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
    serif: 'PlayfairDisplay_500Medium',
    serifBold: 'PlayfairDisplay_700Bold',
    serifBlack: 'PlayfairDisplay_800ExtraBold',
  },
  bn: {
    regular: 'NotoSansBengali_400Regular',
    medium: 'NotoSansBengali_500Medium',
    semibold: 'NotoSansBengali_600SemiBold',
    bold: 'NotoSansBengali_700Bold',
    extrabold: 'NotoSansBengali_700Bold',
    serif: 'NotoSerifBengali_500Medium',
    serifBold: 'NotoSerifBengali_700Bold',
    serifBlack: 'NotoSerifBengali_700Bold',
  },
} as const;

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
export type SerifWeight = 'serif' | 'serifBold' | 'serifBlack';

export function fontFor(lang: 'en' | 'bn', weight: FontWeight = 'regular'): string {
  return FontFamily[lang][weight];
}

export function serifFor(lang: 'en' | 'bn', weight: SerifWeight = 'serif'): string {
  return FontFamily[lang][weight];
}

export const Shadow = {
  card: {
    shadowColor: '#0B1B14',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#04140D',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
