import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MiniBarChart } from '@/components/ui/charts';
import { Chip, SectionHeader } from '@/components/ui/misc';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode } from '@/hooks/use-appearance';
import { analyze, type AdviceTone } from '@/lib/ai';
import {
  categoryBreakdown,
  daysWithoutExpenseLog,
  habitProgress,
  inMonth,
  investmentTotals,
  missedTasks,
  monthsWithData,
  monthlyTrend,
  totalsOf,
} from '@/lib/analytics';
import { exportBackup, pickBackup } from '@/lib/backup';
import { formatMoney, formatMonthYear, toBanglaDigits } from '@/lib/format';
import { ensurePermission, syncReminders } from '@/lib/notifications';
import { useAppStore } from '@/lib/store';
import { isCloudConfigured, sendOtp, signOut, verifyOtp, currentUserId } from '@/lib/supabase';
import { pullSnapshot, pushSnapshot } from '@/lib/sync';

type Tab = 'advice' | 'reports' | 'data';

export default function CoachScreen() {
  const theme = useTheme();
  const { t, l, lang } = useT();
  const router = useRouter();
  const themeMode = useThemeMode();

  const user = useAppStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const buckets = useAppStore((s) => s.buckets);
  const investments = useAppStore((s) => s.investments);
  const budgets = useAppStore((s) => s.budgets);
  const bills = useAppStore((s) => s.bills);
  const debts = useAppStore((s) => s.debts);
  const goals = useAppStore((s) => s.goals);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const updateUser = useAppStore((s) => s.updateUser);
  const importData = useAppStore((s) => s.importData);
  const resetData = useAppStore((s) => s.resetData);

  const [tab, setTab] = useState<Tab>('advice');
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const advisor = useMemo(
    () =>
      analyze({
        user,
        transactions,
        budgets,
        bills,
        debts,
        habits,
        habitLogs,
        buckets,
        investments,
        tasks,
        goals,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, transactions, budgets, bills, debts, habits, habitLogs, buckets, investments, tasks, goals, refreshKey],
  );

  const data = useMemo(() => {
    const now = new Date();
    const current = totalsOf(inMonth(transactions, now));
    const lifetime = totalsOf(transactions);
    const months = monthsWithData(transactions);
    const breakdown = categoryBreakdown(inMonth(transactions, now));
    const progress = habitProgress(habits, habitLogs);
    const invest = investmentTotals(investments);
    const saved = buckets.reduce((sum, b) => sum + b.current, 0);
    return {
      current,
      lifetime,
      months,
      breakdown,
      skipped: progress.filter((h) => !h.done).length,
      missed: missedTasks(tasks).length,
      withoutLog: daysWithoutExpenseLog(transactions, 7),
      trend: monthlyTrend(transactions, 6),
      netWorth: saved + invest.current,
      now,
    };
  }, [transactions, tasks, habits, habitLogs, buckets, investments]);

  const savingsRate =
    data.current.income > 0 ? Math.round((data.current.balance / data.current.income) * 100) : 0;
  const selectedMonth = useMemo(
    () => data.months.find((m) => m.key === selected) ?? null,
    [data.months, selected],
  );
  const num = (n: number) => (lang === 'bn' ? toBanglaDigits(String(n)) : String(n));

  const onExport = async () => {
    try {
      setBusy(true);
      await exportBackup();
      Alert.alert(t('exportData'), t('exportHint'));
    } catch {
      Alert.alert(t('exportData'), t('noData'));
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    try {
      setBusy(true);
      const payload = await pickBackup();
      Alert.alert(t('importData'), `${payload.data.transactions.length} ${t('transactions')}`, [
        { text: t('cancel'), style: 'cancel' },
        { text: t('importData'), onPress: () => importData(payload.data) },
      ]);
    } catch (error) {
      if ((error as Error).message !== 'cancelled') {
        Alert.alert(t('importData'), t('noResults'));
      }
    } finally {
      setBusy(false);
    }
  };

  const onReset = () =>
    Alert.alert(t('resetData'), t('resetConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('resetData'), style: 'destructive', onPress: () => resetData() },
    ]);

  const onToggleReminders = async (value: boolean) => {
    updateUser({ notificationsEnabled: value });
    if (value) {
      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert(t('notifications'), t('remindersOff'));
        updateUser({ notificationsEnabled: false });
        return;
      }
    }
    await syncReminders({ bills, language: lang });
  };

  const recordRows = [
    { label: t('totalTransactions'), value: transactions.length },
    { label: t('tasks'), value: tasks.length },
    { label: t('habits'), value: habits.length },
    { label: t('savingsBuckets'), value: buckets.length },
    { label: t('investments'), value: investments.length },
    { label: t('bills'), value: bills.length },
    { label: t('debts'), value: debts.length },
  ];

  const toneColor: Record<AdviceTone, string> = {
    positive: theme.success,
    warning: theme.warning,
    danger: theme.danger,
    info: theme.primary,
  };
  const toneIcon: Record<AdviceTone, keyof typeof Ionicons.glyphMap> = {
    positive: 'checkmark-circle',
    warning: 'alert-circle',
    danger: 'warning',
    info: 'information-circle',
  };

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{t('coach')}</Text>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'advice', label: t('advice') },
          { value: 'reports', label: t('reports') },
          { value: 'data', label: t('dataBackup') },
        ]}
      />

      {tab === 'advice' && (
        <>
          <Button
            title={t('askAssistant')}
            onPress={() => router.push('/assistant')}
            icon={<Ionicons name="sparkles" size={18} color={theme.onPrimary} />}
          />
          <Card>
            <SectionHeader title={t('yourProfile')} />
            <ThemedText type="subtitle">{l(advisor.profile.title)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {l(advisor.profile.description)}
            </ThemedText>
            {advisor.profile.traits.map((trait) => (
              <View key={trait.key} style={styles.traitRow}>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.traitLabel} numberOfLines={1}>
                  {l(trait.label)}
                </ThemedText>
                <View style={styles.traitBar}>
                  <ProgressBar progress={trait.value / 100} height={6} />
                </View>
                <ThemedText type="caption" weight="bold" style={styles.traitValue}>
                  {num(trait.value)}
                </ThemedText>
              </View>
            ))}
            <View style={[styles.targetRow, { borderTopColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('savingsTargetLabel')}
              </ThemedText>
              <ThemedText type="small" weight="bold" style={{ color: theme.primary }}>
                {formatMoney(advisor.profile.savingsTarget, lang)}
              </ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('profileNote')}
            </ThemedText>
          </Card>
          <Card style={styles.scoreCard}>
            <ProgressRing progress={advisor.score / 100} size={128} strokeWidth={12}>
              <ThemedText type="display" style={{ color: theme.primary }}>
                {num(advisor.score)}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {t('financialScore')}
              </ThemedText>
            </ProgressRing>
            <View style={styles.scoreInfo}>
              <ThemedText type="subtitle">{l(advisor.scoreLabel)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {l(advisor.headline)}
              </ThemedText>
            </View>
          </Card>

          <Card>
            <SectionHeader title={t('advice')} />
            <ThemedText type="caption" themeColor="textSecondary">
              {t('coachIntro')}
            </ThemedText>
            {advisor.advice.map((item) => (
              <View key={item.id} style={styles.adviceRow}>
                <View style={[styles.adviceIcon, { backgroundColor: `${toneColor[item.tone]}22` }]}>
                  <Ionicons name={toneIcon[item.tone]} size={20} color={toneColor[item.tone]} />
                </View>
                <View style={styles.adviceInfo}>
                  <ThemedText type="default" weight="semibold">
                    {l(item.title)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {l(item.body)}
                  </ThemedText>
                </View>
              </View>
            ))}
            <Button
              title={t('refreshAdvice')}
              variant="secondary"
              onPress={() => setRefreshKey((k) => k + 1)}
            />
          </Card>
        </>
      )}

      {tab === 'reports' && (
        <>
          <Card>
            <SectionHeader title={t('monthlySummary')} />
            <ThemedText type="caption" themeColor="textSecondary">
              {formatMonthYear(data.now, lang)}
            </ThemedText>
            <View style={styles.grid}>
              <Metric label={t('totalSpent')} value={formatMoney(data.current.expense, lang)} color={theme.danger} />
              <Metric label={t('totalIncome')} value={formatMoney(data.current.income, lang)} color={theme.success} />
              <Metric label={t('saved')} value={formatMoney(data.current.balance, lang)} color={theme.primary} />
              <Metric label={t('savingsRate')} value={data.current.income > 0 ? `${num(savingsRate)}%` : '—'} color={theme.text} />
            </View>
          </Card>

          <Card>
            <SectionHeader title={t('lifetime')} />
            <View style={styles.grid}>
              <Metric label={t('lifetimeIncome')} value={formatMoney(data.lifetime.income, lang)} color={theme.success} />
              <Metric label={t('lifetimeExpense')} value={formatMoney(data.lifetime.expense, lang)} color={theme.danger} />
              <Metric label={t('lifetimeSaved')} value={formatMoney(data.lifetime.balance, lang)} color={theme.primary} />
              <Metric label={t('netWorth')} value={formatMoney(data.netWorth, lang)} color={theme.text} />
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('monthsTracked')}: {num(data.months.length)} · {t('totalTransactions')}: {num(transactions.length)}
            </ThemedText>
          </Card>

          <Card>
            <SectionHeader title={t('missed')} />
            <MissedRow label={t('missedTasks')} value={num(data.missed)} warn={data.missed > 0} />
            <MissedRow label={t('skippedHabits')} value={num(data.skipped)} warn={data.skipped > 0} />
            <MissedRow label={t('daysWithoutLog')} value={num(data.withoutLog)} warn={data.withoutLog > 0} />
          </Card>

          {data.breakdown.length > 0 && (
            <Card>
              <SectionHeader title={t('topSpend')} />
              {data.breakdown.slice(0, 5).map((slice) => (
                <View key={slice.category.id} style={styles.catRow}>
                  <Text style={styles.catIcon}>{slice.category.icon}</Text>
                  <View style={styles.catInfo}>
                    <View style={styles.catTop}>
                      <ThemedText type="small" weight="semibold" numberOfLines={1} style={styles.flex}>
                        {l(slice.category.label)}
                      </ThemedText>
                      <ThemedText type="small" weight="bold">
                        {formatMoney(slice.amount, lang)}
                      </ThemedText>
                    </View>
                    <ProgressBar progress={slice.share} color={slice.category.color} height={6} />
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Card>
            <SectionHeader title={t('thisMonth')} />
            <MiniBarChart
              data={data.trend.map((m, i) => ({
                label: formatMonthYear(m.label, lang).split(' ')[0],
                value: m.expense,
                active: i === data.trend.length - 1,
              }))}
              formatValue={(v) => formatMoney(v, lang, false)}
            />
          </Card>

          <SectionHeader title={t('monthEnd')} />
          {data.months.length === 0 ? (
            <Card>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t('noInsights')}
              </ThemedText>
            </Card>
          ) : (
            <Card padded={false} style={styles.listCard}>
              {data.months.map((month) => {
                const active = month.key === selected;
                return (
                  <Pressable
                    key={month.key}
                    onPress={() => setSelected(active ? null : month.key)}
                    style={[styles.monthRow, { borderBottomColor: theme.border }]}>
                    <View>
                      <ThemedText type="default" weight="semibold">
                        {formatMonthYear(month.date, lang)}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {num(month.count)} {t('transactions')}
                      </ThemedText>
                    </View>
                    <View style={styles.monthRight}>
                      <ThemedText
                        type="small"
                        weight="bold"
                        style={{ color: month.saved >= 0 ? theme.success : theme.danger }}>
                        {month.saved >= 0 ? '+' : ''}
                        {formatMoney(month.saved, lang)}
                      </ThemedText>
                      <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textSecondary} />
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          )}

          {selectedMonth && (
            <Card>
              <SectionHeader title={formatMonthYear(selectedMonth.date, lang)} />
              <View style={styles.grid}>
                <Metric label={t('totalIncome')} value={formatMoney(selectedMonth.income, lang)} color={theme.success} />
                <Metric label={t('totalSpent')} value={formatMoney(selectedMonth.expense, lang)} color={theme.danger} />
                <Metric label={t('saved')} value={formatMoney(selectedMonth.saved, lang)} color={theme.primary} />
                <Metric
                  label={t('savingsRate')}
                  value={
                    selectedMonth.income > 0
                      ? `${num(Math.round((selectedMonth.saved / selectedMonth.income) * 100))}%`
                      : '—'
                  }
                  color={theme.text}
                />
              </View>
            </Card>
          )}
        </>
      )}

      {tab === 'data' && (
        <>
          <Card>
            <View style={styles.storageRow}>
              <View style={[styles.storageIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="phone-portrait" size={22} color={theme.primary} />
              </View>
              <View style={styles.flex}>
                <ThemedText type="default" weight="semibold">
                  {t('storedLocally')}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('backupDesc')}
                </ThemedText>
              </View>
            </View>
            {recordRows.map((row) => (
              <View key={row.label} style={styles.recordRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {row.label}
                </ThemedText>
                <ThemedText type="small" weight="bold">
                  {num(row.value)}
                </ThemedText>
              </View>
            ))}
          </Card>

          <Card>
            <SectionHeader title={t('notifications')} />
            <View style={styles.switchRow}>
              <ThemedText type="small" style={styles.flex}>
                {user?.notificationsEnabled ? t('remindersOn') : t('enableReminders')}
              </ThemedText>
              <Switch value={Boolean(user?.notificationsEnabled)} onValueChange={onToggleReminders} />
            </View>
          </Card>

          <CloudCard />

          <MembersCard />

          <Card>
            <SectionHeader title={t('exportData')} />
            <ThemedText type="caption" themeColor="textSecondary">
              {t('exportHint')}
            </ThemedText>
            <Button title={t('exportData')} onPress={onExport} disabled={busy} />
          </Card>

          <Card>
            <SectionHeader title={t('importData')} />
            <ThemedText type="caption" themeColor="textSecondary">
              {t('importHint')}
            </ThemedText>
            <Button title={t('importData')} variant="secondary" onPress={onImport} disabled={busy} />
          </Card>

          <SectionHeader title={t('settings')} />
          <Card>
            <ThemedText type="label" themeColor="textSecondary">
              {t('appearance')}
            </ThemedText>
            <View style={styles.langRow}>
              <Chip label={t('themeSystem')} selected={themeMode === 'system'} onPress={() => updateUser({ themeMode: 'system' })} />
              <Chip label={t('themeLight')} selected={themeMode === 'light'} onPress={() => updateUser({ themeMode: 'light' })} />
              <Chip label={t('themeDark')} selected={themeMode === 'dark'} onPress={() => updateUser({ themeMode: 'dark' })} />
            </View>
            <ThemedText type="label" themeColor="textSecondary">
              {t('language')}
            </ThemedText>
            <View style={styles.langRow}>
              <Chip label="English" selected={lang === 'en'} onPress={() => setLanguage('en')} />
              <Chip label="বাংলা" selected={lang === 'bn'} onPress={() => setLanguage('bn')} />
            </View>
            <ThemedText type="label" themeColor="textSecondary">
              {t('incomeHint')}
            </ThemedText>
            <View style={[styles.amountInput, { borderColor: theme.border }]}>
              <Text style={[styles.symbol, { color: theme.textSecondary }]}>৳</Text>
              <TextInput
                value={user?.monthlyIncome ? String(user.monthlyIncome) : ''}
                onChangeText={(v) => updateUser({ monthlyIncome: Number(v.replace(/[^0-9]/g, '')) || 0 })}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                style={[styles.amountField, { color: theme.text }]}
              />
            </View>
          </Card>

          <Card>
            <SectionHeader title={t('resetData')} />
            <ThemedText type="caption" themeColor="textSecondary">
              {t('resetConfirm')}
            </ThemedText>
            <Button title={t('resetData')} variant="danger" onPress={onReset} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function CloudCard() {
  const theme = useTheme();
  const { t } = useT();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    currentUserId().then(setUserId);
  }, []);

  const onSend = async () => {
    setBusy(true);
    const result = await sendOtp(phone.trim());
    setBusy(false);
    if (result.error) {
      Alert.alert(t('signIn'), result.error);
      return;
    }
    setSent(true);
  };

  const onVerify = async () => {
    setBusy(true);
    const result = await verifyOtp(phone.trim(), code.trim());
    setBusy(false);
    if (result.error) {
      Alert.alert(t('verifyCode'), result.error);
      return;
    }
    setUserId(await currentUserId());
  };

  const onPush = async () => {
    setBusy(true);
    const result = await pushSnapshot();
    setBusy(false);
    Alert.alert(t('pushCloud'), result.error ?? t('synced'));
  };

  const onPull = async () => {
    setBusy(true);
    const result = await pullSnapshot();
    setBusy(false);
    Alert.alert(t('pullCloud'), result.error ?? (result.pulled ? t('synced') : t('noData')));
  };

  if (!isCloudConfigured) {
    return (
      <Card>
        <SectionHeader title={t('cloudSync')} />
        <View style={styles.storageRow}>
          <View style={[styles.storageIcon, { backgroundColor: theme.muted }]}>
            <Ionicons name="cloud-offline" size={22} color={theme.textSecondary} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            {t('cloudNotConfigured')}
          </ThemedText>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title={t('cloudSync')} />
      {userId ? (
        <>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('cloudConfigured')} · {userId.slice(0, 8)}…
          </ThemedText>
          <Button title={t('pushCloud')} onPress={onPush} disabled={busy} />
          <Button title={t('pullCloud')} variant="secondary" onPress={onPull} disabled={busy} />
          <Button
            title={t('signOut')}
            variant="ghost"
            onPress={async () => {
              await signOut();
              setUserId(null);
              setSent(false);
            }}
          />
        </>
      ) : (
        <>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+8801XXXXXXXXX"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />
          {sent && (
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={t('otpCode')}
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          )}
          <Button
            title={sent ? t('verifyCode') : t('sendCode')}
            onPress={sent ? onVerify : onSend}
            disabled={busy || phone.trim().length < 6}
          />
        </>
      )}
    </Card>
  );
}

function MembersCard() {
  const theme = useTheme();
  const { t } = useT();
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const deleteMember = useAppStore((s) => s.deleteMember);
  const [name, setName] = useState('');
  const colors = ['#0EA5E9', '#6366F1', '#2E9E5B', '#F59E0B', '#EC4899', '#EF4444'];

  return (
    <Card>
      <SectionHeader title={t('sharedWallet')} />
      <ThemedText type="caption" themeColor="textSecondary">
        {t('members')}
      </ThemedText>
      {members.length === 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {t('noMembers')}
        </ThemedText>
      ) : (
        <View style={styles.langRow}>
          {members.map((member) => (
            <Pressable
              key={member.id}
              onLongPress={() => deleteMember(member.id)}
              style={[styles.memberChip, { backgroundColor: `${member.color}22`, borderColor: member.color }]}>
              <View style={[styles.memberDot, { backgroundColor: member.color }]} />
              <ThemedText type="small" weight="semibold">
                {member.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.inlineAdd}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('memberName')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, styles.flex, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        />
        <Button
          title={t('add')}
          compact
          onPress={() => {
            if (!name.trim()) return;
            addMember({ name: name.trim(), color: colors[members.length % colors.length] });
            setName('');
          }}
        />
      </View>
    </Card>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {  return (
    <View style={styles.metric}>
      <ThemedText type="heading" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function MissedRow({ label, value, warn }: { label: string; value: string; warn: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.missedRow}>
      <ThemedText type="small" style={styles.flex}>
        {label}
      </ThemedText>
      <View style={[styles.missedBadge, { backgroundColor: warn ? theme.warningSoft : theme.primarySoft }]}>
        <ThemedText type="small" weight="bold" style={{ color: warn ? theme.warning : theme.primary }}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700' },
  center: { textAlign: 'center', paddingVertical: Spacing.three },
  flex: { flex: 1 },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, paddingVertical: Spacing.four },
  scoreInfo: { flex: 1, gap: Spacing.two },
  adviceRow: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.two },
  adviceIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  adviceEmoji: { fontSize: 20 },
  adviceInfo: { flex: 1, gap: 2 },
  traitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  traitLabel: { width: 110 },
  traitBar: { flex: 1 },
  traitValue: { width: 28, textAlign: 'right' },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.two },
  metric: { minWidth: '40%', gap: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  catIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  catInfo: { flex: 1, gap: Spacing.one },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  listCard: { paddingHorizontal: Spacing.three, overflow: 'hidden' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  missedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  missedBadge: { minWidth: 34, paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: Radius.pill, alignItems: 'center' },
  storageRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center', marginBottom: Spacing.two },
  storageIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.two },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  langRow: { flexDirection: 'row', gap: Spacing.two, marginVertical: Spacing.one },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  symbol: { fontSize: 16, fontWeight: '700', marginRight: Spacing.two },
  amountField: { flex: 1, paddingVertical: Spacing.two, fontSize: 16, fontWeight: '700' },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  memberDot: { width: 10, height: 10, borderRadius: 5 },
  inlineAdd: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
});
