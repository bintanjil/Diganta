import { Text, type TextProps } from 'react-native';

import { fontFor, serifFor, type FontWeight, type ThemeColor } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';

export type TextType =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'default'
  | 'small'
  | 'smallBold'
  | 'label'
  | 'caption'
  | 'code';

interface TypeConfig {
  fontSize: number;
  lineHeight: number;
  weight: FontWeight;
  serif?: boolean;
  letterSpacing?: number;
}

const TYPES: Record<TextType, TypeConfig> = {
  display: { fontSize: 34, lineHeight: 42, weight: 'bold', serif: true, letterSpacing: -0.3 },
  title: { fontSize: 27, lineHeight: 34, weight: 'bold', serif: true, letterSpacing: -0.2 },
  subtitle: { fontSize: 21, lineHeight: 28, weight: 'semibold', serif: true },
  heading: { fontSize: 17, lineHeight: 23, weight: 'semibold' },
  default: { fontSize: 15, lineHeight: 22, weight: 'medium' },
  small: { fontSize: 13, lineHeight: 18, weight: 'medium' },
  smallBold: { fontSize: 13, lineHeight: 18, weight: 'bold' },
  label: { fontSize: 12, lineHeight: 16, weight: 'semibold' },
  caption: { fontSize: 11, lineHeight: 14, weight: 'medium' },
  code: { fontSize: 12, lineHeight: 16, weight: 'medium' },
};

export type ThemedTextProps = TextProps & {
  type?: TextType;
  themeColor?: ThemeColor;
  weight?: FontWeight;
};

export function ThemedText({ style, type = 'default', themeColor, weight, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { lang } = useT();
  const config = TYPES[type];
  const fontFamily = config.serif
    ? serifFor(lang, weight === 'bold' || weight === 'extrabold' ? 'serifBold' : 'serif')
    : fontFor(lang, weight ?? config.weight);

  return (
    <Text
      style={[
        {
          color: theme[themeColor ?? 'text'],
          fontFamily,
          fontSize: config.fontSize,
          lineHeight: config.lineHeight,
          letterSpacing: config.letterSpacing,
        },
        style,
      ]}
      {...rest}
    />
  );
}
