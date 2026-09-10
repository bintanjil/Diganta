import { useMemo } from 'react';

import { localized, translate, type TranslationKey } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import type { Language } from '@/lib/types';

export interface Translator {
  lang: Language;
  t: (key: TranslationKey) => string;
  l: (text?: { en: string; bn: string }) => string;
}

export function useT(): Translator {
  const lang = useAppStore((state) => state.user?.language ?? 'en');
  return useMemo(
    () => ({
      lang,
      t: (key: TranslationKey) => translate(lang, key),
      l: (text?: { en: string; bn: string }) => localized(lang, text),
    }),
    [lang],
  );
}
