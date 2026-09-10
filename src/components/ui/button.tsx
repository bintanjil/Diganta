import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  style,
  compact,
}: ButtonProps) {
  const theme = useTheme();

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: theme.muted, fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.text, border: 'transparent' },
    danger: { bg: theme.dangerSoft, fg: theme.danger, border: 'transparent' },
  };
  const colors = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {icon}
      <ThemedText type="default" weight="bold" style={{ color: colors.fg }} numberOfLines={1}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  regular: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  compact: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
