import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <View style={styles.headerRow}>
      <ThemedText type="heading">{title}</ThemedText>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <ThemedText type="small" weight="bold" style={{ color: theme.primary }}>
            {action}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

interface EmptyStateProps {
  icon: IoniconName;
  text: string;
  hint?: string;
}

export function EmptyState({ icon, text, hint }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={26} color={theme.primary} />
      </View>
      <ThemedText type="small" weight="semibold" themeColor="textSecondary" style={styles.center}>
        {text}
      </ThemedText>
      {hint ? (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: string;
}

export function Chip({ label, selected, onPress, color, icon }: ChipProps) {
  const theme = useTheme();
  const bg = selected ? color ?? theme.primary : theme.muted;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: bg, borderColor: selected ? bg : theme.border }]}>
      {icon ? <Text style={styles.chipIcon}>{icon}</Text> : null}
      <ThemedText
        type="small"
        weight={selected ? 'bold' : 'medium'}
        style={{ color: selected ? '#FFFFFF' : theme.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  accent?: string;
  icon?: IoniconName;
}

export function StatTile({ label, value, accent, icon }: StatTileProps) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, Shadow.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {icon ? <Ionicons name={icon} size={18} color={accent ?? theme.primary} /> : null}
      <ThemedText type="heading" style={{ color: accent ?? theme.text }} numberOfLines={1}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

interface RowProps {
  left: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}

export function ListRow({ left, title, subtitle, right, onPress }: RowProps) {
  const content = (
    <View style={styles.rowInner}>
      {left}
      <View style={styles.rowText}>
        <ThemedText type="default" weight="semibold" numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      {content}
    </Pressable>
  );
}

export function Avatar({ text, color }: { text: string; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: `${color}22` }]}>
      <Text style={styles.avatarText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.two,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipIcon: { fontSize: 14 },
  tile: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  tileIcon: { fontSize: 18 },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  row: { width: '100%' },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  rowText: { flex: 1, gap: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18 },
});
