import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * On web the system color scheme is available synchronously; fall back to light
 * when it cannot be determined (for example during static rendering).
 */
export function useColorScheme() {
  return useRNColorScheme() ?? 'light';
}
