import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ListRow, SectionHeader, StatTile } from '@/components/ui/misc';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import { analyze } from '@/lib/ai';
import {
  budgetStatus,
  dueTodayTasks,
  effectiveIncome,
  goalProgress,
  habitProgress,
  inMonth,
  investmentTotals,
  missedTasks,
  onDay,
  totalsOf,
} from '@/lib/analytics';
import { CATEGORY_BY_ID, PAYMENT_BY_ID } from '@/lib/catalog';
import { dateKey, formatDate, formatMoney, formatMonthYear } from '@/lib/format';
import { formatPrayerTime, nextPrayer } from '@/lib/prayer';
import { useAppStore } from '@/lib/store';

export default function HomeScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const router = useRouter();
  const { t, l, lang } = useT();

  const user = useAppStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const budgets = useAppStore((s) => s.budgets);
  const investments = useAppStore((s) => s.investments);
  const buckets = useAppStore((s) => s.buckets);
  const bills = useAppStore((s) => s.bills);
  const debts = useAppStore((s) => s.debts);
  const goals = useAppStore((s) => s.goals);
  const guideDismissed = useAppStore((s) => s.guideDismissed);
  const dismissGuide = useAppStore((s) => s.dismissGuide);

  const data = useMemo(() => {
    const monthTx = inMonth(transactions);
    const totals = totalsOf(monthTx);
    const spentToday = onDay(transactions, dateKey())
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const due = [...dueTodayTasks(tasks), ...missedTasks(tasks)].length;
    const progress = habitProgress(habits, habitLogs);
    const habitsDone = progress.filter((h) => h.done).length;
    const income = effectiveIncome(user, transactions);
    const invest = investmentTotals(investments);
    const saved = buckets.reduce((sum, b) => sum + b.current, 0);
    return {
      spent: totals.expense,
      income,
      spentToday,
      due,
      habitsDone,
      habitTotal: habits.length,
      ring: income > 0 ? totals.expense / income : 0,
      recent: transactions.slice(0, 5),
      alerts: budgetStatus(budgets, transactions).filter((b) => b.state !== 'ok'),
      netWorth: saved + invest.current,
    };
  }, [transactions, tasks, habits, habitLogs, budgets, investments, buckets, user]);

  const coach = useMemo(
    () => analyze({ user, transactions, budgets, bills, debts, habits, habitLogs, buckets, investments, tasks, goals }),
    [user, transactions, budgets, bills, debts, habits, habitLogs, buckets, investments, tasks, goals],
  );

  const upcomingPrayer = useMemo(() => {
    if (!user?.prayerEnabled) return null;
    return nextPrayer(user.prayerLat ?? 23.8103, user.prayerLng ?? 90.4125);
  }, [user]);

  const goalRows = useMemo(() => goals.map((g) => goalProgress(g)).filter((g) => !g.done), [goals]);

  const steps = [
    { key: 'expense', label: t('guideExpense'), done: transactions.some((tx) => tx.type === 'expense') },
    { key: 'task', label: t('guideTask'), done: tasks.length > 0 },
    { key: 'habit', label: t('guideHabit'), done: habits.length > 0 },
    { key: 'budget', label: t('guideBudget'), done: budgets.length > 0 },
    { key: 'investment', label: t('guideInvestment'), done: investments.length > 0 },
  ];
  const remainingSteps = steps.filter((s) => !s.done).length;
  const showGuide = !guideDismissed && remainingSteps > 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const remaining = Math.max(0, data.income - data.spent);
  const gradient: [string, string] = scheme === 'dark' ? ['#0C3B2A', '#13251D'] : ['#00875A', '#0FA36B'];
  const goAdd = (type: string) => router.push({ pathname: '/add', params: { type } });

  return (
    <Screen>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.flex}>
            <ThemedText type="caption" style={styles.heroGreeting}>
              {greeting}, {user?.name || ''}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroDate}>
              {formatMonthYear(new Date(), lang)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.heroRow}>
          <View style={styles.heroBlock}>
            <ThemedText type="caption" style={styles.heroLabel}>
              {t('totalWealth')}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroValue}>
              {formatMoney(data.netWorth, lang)}
            </ThemedText>
          </View>
          <View style={styles.heroBlock}>
            <ThemedText type="caption" style={styles.heroLabel}>
              {t('thisMonth')}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroValue}>
              {formatMoney(data.spent, lang)}
            </ThemedText>
          </View>
        </View>
        {upcomingPrayer ? (
          <View style={styles.prayerChip}>
            <Ionicons name="moon" size={14} color="#FFFFFF" />
            <ThemedText type="caption" style={styles.prayerChipText}>
              {t('nextPrayer')}: {l(upcomingPrayer.name)} · {formatPrayerTime(upcomingPrayer.time, lang)}
            </ThemedText>
          </View>
        ) : null}
      </LinearGradient>

      <Card>
        <Pressable
          onPress={() => router.push({ pathname: '/add', params: { type: 'income-setting' } })}
          style={styles.incomeRow}>
          <View style={[styles.coachIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="cash-outline" size={20} color={theme.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText type="label" themeColor="textSecondary">
              {t('monthlyIncome')}
            </ThemedText>
            <ThemedText type="subtitle">{formatMoney(data.income, lang)}</ThemedText>
          </View>
          <View style={styles.incomeTarget}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('savingsTargetLabel')}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {formatMoney(coach.profile.savingsTarget, lang)}
            </ThemedText>
          </View>
          <Ionicons name="create-outline" size={18} color={theme.textSecondary} />
        </Pressable>
      </Card>

      <Card>
        <Pressable onPress={() => router.push('/(tabs)/insights')} style={styles.coachRow}>
          <View style={[styles.coachIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="sparkles" size={22} color={theme.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText type="label" themeColor="textSecondary">
              {t('coach')} · {t('financialScore')} {coach.score}
            </ThemedText>
            <ThemedText type="small" numberOfLines={2}>
              {l(coach.headline)}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </Pressable>
      </Card>

      <Button
        title={t('askAssistant')}
        variant="secondary"
        onPress={() => router.push('/assistant')}
        icon={<Ionicons name="sparkles" size={16} color={theme.text} />}
      />

      <Card>
        <SectionHeader
          title={t('goals')}
          action={goalRows.length > 0 ? t('viewAll') : undefined}
          onAction={() => router.push('/(tabs)/wealth')}
        />
        {goalRows.length === 0 ? (
          <Pressable onPress={() => goAdd('goal')} style={styles.goalEmpty}>
            <Ionicons name="flag-outline" size={20} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary }}>
              {t('quickGoal')}
            </ThemedText>
          </Pressable>
        ) : (
          goalRows.slice(0, 2).map((row) => (
            <Pressable key={row.goal.id} onPress={() => router.push('/(tabs)/wealth')} style={styles.goalRow}>
              <Text style={styles.goalEmoji}>{row.goal.icon}</Text>
              <View style={styles.flex}>
                <View style={styles.goalTop}>
                  <ThemedText type="small" weight="semibold" numberOfLines={1} style={styles.flex}>
                    {row.goal.title}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {Math.round(row.progress * 100)}%
                  </ThemedText>
                </View>
                <ProgressBar progress={row.progress} color={row.goal.color} height={6} />
                <ThemedText type="caption" themeColor="textSecondary">
                  {row.onTrack
                    ? `✓ ${t('onTrack')}`
                    : `${t('needPerMonth')} ${formatMoney(Math.round(row.requiredMonthly), lang)}/${t('monthsShort')}`}
                </ThemedText>
              </View>
            </Pressable>
          ))
        )}
      </Card>

      <Card style={styles.ringCard}>
        <View style={styles.ringWrap}>
          <ProgressRing progress={data.ring} size={132} strokeWidth={12} color={theme.primary}>
            <ThemedText type="heading">{formatMoney(data.spent, lang)}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('monthProgress')}
            </ThemedText>
          </ProgressRing>
        </View>
        <View style={styles.ringInfo}>
          <Row label={t('spentOfIncome')} value={formatMoney(data.income, lang)} color={theme.text} />
          <Row label={t('remaining')} value={formatMoney(remaining, lang)} color={theme.primary} />
          <Row label={t('netWorth')} value={formatMoney(data.netWorth, lang)} color={theme.text} />
          <Pressable onPress={() => router.push('/(tabs)/money')} style={styles.reportLink}>
            <ThemedText type="small" weight="semibold" style={{ color: theme.primary }}>
              {t('monthEnd')}
            </ThemedText>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </Pressable>
        </View>
      </Card>

      {showGuide && (
        <Card>
          <SectionHeader title={t('gettingStarted')} action={t('hideGuide')} onAction={dismissGuide} />
          {steps.map((step) => (
            <Pressable key={step.key} onPress={() => !step.done && goAdd(step.key)} style={styles.stepRow}>
              <Ionicons
                name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={step.done ? theme.success : theme.textSecondary}
              />
              <ThemedText
                type="small"
                themeColor={step.done ? 'textSecondary' : 'text'}
                style={step.done ? styles.strike : undefined}>
                {step.label}
              </ThemedText>
            </Pressable>
          ))}
        </Card>
      )}

      {data.alerts.length > 0 && (
        <Card>
          <SectionHeader title={t('budgetAlerts')} />
          {data.alerts.slice(0, 3).map((alert) => (
            <View key={alert.budget.id} style={styles.alertRow}>
              <Text style={styles.alertIcon}>{alert.category.icon}</Text>
              <View style={styles.flex}>
                <View style={styles.alertTop}>
                  <ThemedText type="small" weight="semibold" numberOfLines={1} style={styles.flex}>
                    {l(alert.category.label)}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    weight="bold"
                    style={{ color: alert.state === 'over' ? theme.danger : theme.warning }}>
                    {alert.state === 'over' ? t('overBudget') : t('nearLimit')}
                  </ThemedText>
                </View>
                <ProgressBar
                  progress={alert.ratio}
                  color={alert.state === 'over' ? theme.danger : theme.warning}
                  height={6}
                />
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatMoney(alert.spent, lang)} {t('budgetSpentOf')} {formatMoney(alert.limit, lang)}
                </ThemedText>
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.tiles}>
        <StatTile icon="trending-down-outline" label={t('spentToday')} value={formatMoney(data.spentToday, lang)} accent={theme.danger} />
        <StatTile icon="checkbox-outline" label={t('tasksDue')} value={String(data.due)} accent={theme.warning} />
        <StatTile
          icon="flame-outline"
          label={t('habitsDone')}
          value={`${data.habitsDone}/${data.habitTotal}`}
          accent={theme.primary}
        />
      </View>

      <SectionHeader
        title={t('recentActivity')}
        action={data.recent.length > 0 ? t('viewAll') : undefined}
        onAction={() => router.push('/(tabs)/money')}
      />
      <Card padded={false} style={styles.listCard}>
        {data.recent.length === 0 ? (
          <EmptyState icon="leaf-outline" text={t('noActivity')} />
        ) : (
          data.recent.map((tx) => {
            const category = CATEGORY_BY_ID[tx.categoryId];
            const method = PAYMENT_BY_ID[tx.methodId];
            const isIncome = tx.type === 'income';
            return (
              <ListRow
                key={tx.id}
                onPress={() => router.push({ pathname: '/add', params: { type: tx.type, id: tx.id } })}
                left={
                  <View style={[styles.txIcon, { backgroundColor: `${category?.color ?? theme.primary}22` }]}>
                    <Text style={styles.txEmoji}>{category?.icon ?? '💠'}</Text>
                  </View>
                }
                title={l(category?.label)}
                subtitle={`${formatDate(tx.date, lang)} · ${method?.short ?? ''}`}
                right={
                  <ThemedText type="small" weight="bold" style={{ color: isIncome ? theme.success : theme.text }}>
                    {isIncome ? '+' : '-'}
                    {formatMoney(tx.amount, lang)}
                  </ThemedText>
                }
              />
            );
          })
        )}
      </Card>
    </Screen>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.ringRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small" weight="bold" style={{ color }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.four, ...Shadow.card },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroGreeting: { color: 'rgba(255,255,255,0.85)' },
  heroDate: { color: '#FFFFFF' },
  heroLogo: { fontSize: 30 },
  heroRow: { flexDirection: 'row', gap: Spacing.four },
  heroBlock: { flex: 1, gap: 2 },
  heroLabel: { color: 'rgba(255,255,255,0.8)' },
  heroValue: { color: '#FFFFFF' },
  prayerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  prayerChipText: { color: '#FFFFFF' },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  coachIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  incomeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  incomeTarget: { alignItems: 'flex-end', marginRight: Spacing.two },
  goalEmpty: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  goalEmoji: { fontSize: 28 },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.one },
  ringCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  ringWrap: { alignItems: 'center' },
  ringInfo: { flex: 1, gap: Spacing.one },
  ringRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reportLink: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: Spacing.one },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  strike: { textDecorationLine: 'line-through' },
  alertRow: { flexDirection: 'row', gap: Spacing.two, paddingVertical: Spacing.two },
  alertIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, marginBottom: Spacing.one },
  tiles: { flexDirection: 'row', gap: Spacing.two },
  listCard: { paddingHorizontal: Spacing.three, overflow: 'hidden' },
  txIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  txEmoji: { fontSize: 18 },
});
