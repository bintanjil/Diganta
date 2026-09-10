import { useEffect } from 'react';

import { useAppStore } from '@/lib/store';

export function useHydrated(): boolean {
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      useAppStore.setState({ hydrated: true });
    }
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      useAppStore.setState({ hydrated: true });
    });
    return unsubscribe;
  }, []);

  return hydrated;
}
