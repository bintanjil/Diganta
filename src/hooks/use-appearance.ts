import { useColorScheme } from 'react-native';

import { useAppStore } from '@/lib/store';
import type { ThemeMode } from '@/lib/types';

export function useThemeMode(): ThemeMode {
  return useAppStore((state) => state.user?.themeMode ?? 'system');
}

export function useResolvedScheme(): 'light' | 'dark' {
  const mode = useThemeMode();
  const system = useColorScheme();
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}
