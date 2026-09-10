import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import type { TranslationKey } from '@/lib/i18n';

type AddType = 'expense' | 'income' | 'task' | 'habit' | 'bucket' | 'investment' | 'budget' | 'bill' | 'debt' | 'health' | 'goal';

const OPTIONS: { type: AddType; icon: keyof typeof Ionicons.glyphMap; color: string; label: TranslationKey }[] = [
  { type: 'expense', icon: 'arrow-down-circle', color: '#E5484D', label: 'addExpense' },
  { type: 'income', icon: 'arrow-up-circle', color: '#2E9E5B', label: 'addIncome' },
  { type: 'goal', icon: 'flag', color: '#0D9488', label: 'addGoal' },
  { type: 'task', icon: 'checkbox', color: '#0EA5E9', label: 'addTask' },
  { type: 'habit', icon: 'flame', color: '#F59E0B', label: 'logHabit' },
  { type: 'bucket', icon: 'wallet', color: '#14B8A6', label: 'addBucket' },
  { type: 'investment', icon: 'trending-up', color: '#8B5CF6', label: 'addInvestment' },
  { type: 'budget', icon: 'pie-chart', color: '#F97316', label: 'addBudget' },
  { type: 'bill', icon: 'receipt', color: '#D946EF', label: 'addBill' },
  { type: 'debt', icon: 'swap-horizontal', color: '#EF4444', label: 'addDebt' },
  { type: 'health', icon: 'heart', color: '#EC4899', label: 'addHealth' },
];

export function AddFab() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const choose = (type: AddType) => {
    setOpen(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // haptics unavailable (e.g. web)
    }
    router.push({ pathname: '/add', params: { type } });
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          Shadow.floating,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}>
        <Ionicons name="add" size={26} color={theme.onPrimary} />
        <ThemedText type="default" weight="bold" style={{ color: theme.onPrimary }}>
          {t('add')}
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.background, borderColor: theme.border }]}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <ThemedText type="heading" style={styles.title}>
              {t('quickAddTitle')}
            </ThemedText>
            <View style={styles.grid}>
              {OPTIONS.map((option) => (
                <Pressable
                  key={option.type}
                  onPress={() => choose(option.type)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <View style={[styles.optionIcon, { backgroundColor: `${option.color}22` }]}>
                    <Ionicons name={option.icon} size={24} color={option.color} />
                  </View>
                  <ThemedText type="caption" weight="semibold" style={styles.optionLabel} numberOfLines={1}>
                    {t(option.label)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Platform.select({ ios: 96, android: 84 }) ?? 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.four,
    height: 56,
    borderRadius: 28,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl + 8,
    borderTopRightRadius: Radius.xl + 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9AA7A0',
    opacity: 0.5,
  },
  title: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  option: {
    width: '31.5%',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { textAlign: 'center' },
});
