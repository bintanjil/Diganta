import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, StatTile } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import { debtTotals, goalProgress, investmentTotals } from '@/lib/analytics';
import { INVESTMENT_BY_ID, SAVINGS_TYPES } from '@/lib/catalog';
import { formatDate, formatMoney, toBanglaDigits } from '@/lib/format';
import { useAppStore } from '@/lib/store';

type Tab = 'goals' | 'savings' | 'investments' | 'debts';

export default function WealthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, l, lang } = useT();

  const buckets = useAppStore((s) => s.buckets);
  const investments = useAppStore((s) => s.investments);
  const debts = useAppStore((s) => s.debts);
  const goals = useAppStore((s) => s.goals);
  const deleteBucket = useAppStore((s) => s.deleteBucket);
  const deleteInvestment = useAppStore((s) => s.deleteInvestment);
  const deleteDebt = useAppStore((s) => s.deleteDebt);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const updateGoal = useAppStore((s) => s.updateGoal);

  const [tab, setTab] = useState<Tab>('goals');

  const totalSaved = useMemo(() => buckets.reduce((sum, b) => sum + b.current, 0), [buckets]);
  const totals = useMemo(() => investmentTotals(investments), [investments]);
  const debtSum = useMemo(() => debtTotals(debts), [debts]);
  const goalRows = useMemo(() => goals.map((g) => goalProgress(g)), [goals]);

  const num = (n: number) => (lang === 'bn' ? toBanglaDigits(String(n)) : String(n));

  const confirm = (title: string, onConfirm: () => void) =>
    Alert.alert(t('delete'), title, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: onConfirm },
    ]);

  return (
    <Screen>
      <ThemedText type="title">{t('wealth')}</ThemedText>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'goals', label: t('goals') },
          { value: 'savings', label: t('savings') },
          { value: 'investments', label: t('investments') },
          { value: 'debts', label: t('debts') },
        ]}
      />

      {tab === 'goals' && (
        <>
          {goalRows.length === 0 ? (
            <Card>
              <EmptyState icon="flag-outline" text={t('noGoals')} hint={t('goalEmptyHint')} />
              <Button title={`+ ${t('quickGoal')}`} onPress={() => router.push({ pathname: '/add', params: { type: 'goal' } })} />
            </Card>
          ) : (
            goalRows.map((row) => {
              const isLife = row.goal.type === 'life';
              const onTrack = row.onTrack || row.done;
              return (
                <Card key={row.goal.id}>
                  <Pressable onLongPress={() => confirm(row.goal.title, () => deleteGoal(row.goal.id))}>
                    <View style={styles.row}>
                      <View style={[styles.icon, { backgroundColor: `${row.goal.color}22` }]}>
                        <Text style={styles.bigEmoji}>{row.goal.icon}</Text>
                      </View>
                      <View style={styles.flex}>
                        <ThemedText type="default" weight="semibold" numberOfLines={1}>
                          {row.goal.title}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {isLife
                            ? `${num(row.current)} / ${num(row.target)} ${l(row.goal.unit)}`
                            : `${formatMoney(row.current, lang)} / ${formatMoney(row.target, lang)}`}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: row.done ? theme.primarySoft : onTrack ? theme.primarySoft : theme.warningSoft },
                        ]}>
                        <ThemedText
                          type="caption"
                          weight="bold"
                          style={{ color: row.done ? theme.primary : onTrack ? theme.primary : theme.warning }}>
                          {row.done ? t('completedGoal') : onTrack ? t('onTrack') : t('behind')}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.progress}>
                      <ProgressBar progress={row.progress} color={row.goal.color} height={8} />
                      <View style={styles.goalMeta}>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {Math.round(row.progress * 100)}% · {num(Math.max(0, Math.round(row.monthsLeft)))} {t('monthsLeft')}
                        </ThemedText>
                        {!isLife && !row.done && row.requiredMonthly > 0 ? (
                          <ThemedText type="caption" weight="bold" style={{ color: theme.primary }}>
                            {formatMoney(Math.round(row.requiredMonthly), lang)}/{t('monthsShort')}
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>

                    {!row.done && row.projectedDate && !onTrack ? (
                      <ThemedText type="caption" themeColor="textSecondary">
                        {t('projectedDate')}: {formatDate(row.projectedDate.toISOString(), lang)}
                      </ThemedText>
                    ) : null}
                  </Pressable>

                  {isLife ? (
                    <Button
                      title={`+1 ${l(row.goal.unit)}`}
                      variant="secondary"
                      compact
                      onPress={() => updateGoal(row.goal.id, { currentCount: row.goal.currentCount + 1 })}
                    />
                  ) : (
                    <Button
                      title={t('addToGoal')}
                      variant="secondary"
                      compact
                      onPress={() => router.push({ pathname: '/add', params: { type: 'goal', id: row.goal.id } })}
                    />
                  )}
                </Card>
              );
            })
          )}
          {goalRows.length > 0 && (
            <Button title={`+ ${t('quickGoal')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'goal' } })} />
          )}
        </>
      )}

      {tab === 'savings' && (
        <>
          <Card style={styles.totalCard}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('totalSaved')}
            </ThemedText>
            <ThemedText type="display" style={{ color: theme.primary }}>
              {formatMoney(totalSaved, lang)}
            </ThemedText>
          </Card>

          {buckets.length === 0 ? (
            <Card>
              <EmptyState icon="wallet-outline" text={t('noBuckets')} />
            </Card>
          ) : (
            buckets.map((bucket) => {
              const type = SAVINGS_TYPES.find((s) => s.id === bucket.type);
              const progress = bucket.target ? bucket.current / bucket.target : 0;
              return (
                <Card key={bucket.id}>
                  <Pressable
                    onLongPress={() => confirm(bucket.name, () => deleteBucket(bucket.id))}
                    onPress={() => router.push({ pathname: '/add', params: { type: 'bucket', id: bucket.id } })}>
                    <View style={styles.row}>
                      <Text style={styles.bigEmoji}>{type?.icon ?? '✨'}</Text>
                      <View style={styles.flex}>
                        <ThemedText type="default" weight="semibold">
                          {bucket.name}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {l(type?.label)} · {t('updateValue')}
                        </ThemedText>
                      </View>
                      <ThemedText type="heading">{formatMoney(bucket.current, lang)}</ThemedText>
                    </View>
                    {bucket.target ? (
                      <View style={styles.progress}>
                        <ProgressBar progress={progress} />
                        <ThemedText type="caption" themeColor="textSecondary">
                          {t('target')}: {formatMoney(bucket.target, lang)}
                        </ThemedText>
                      </View>
                    ) : null}
                  </Pressable>
                </Card>
              );
            })
          )}
          <Button title={`+ ${t('addBucket')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'bucket' } })} />
        </>
      )}

      {tab === 'investments' && (
        <>
          <View style={styles.tiles}>
            <StatTile icon="download-outline" label={t('totalInvested')} value={formatMoney(totals.invested, lang)} />
            <StatTile icon="stats-chart-outline" label={t('currentValue')} value={formatMoney(totals.current, lang)} accent={theme.primary} />
          </View>
          <Card style={styles.gainCard}>
            <View>
              <ThemedText type="caption" themeColor="textSecondary">
                {totals.gain >= 0 ? t('gain') : t('loss')}
              </ThemedText>
              <ThemedText type="title" style={{ color: totals.gain >= 0 ? theme.success : theme.danger }}>
                {totals.gain >= 0 ? '+' : ''}
                {formatMoney(totals.gain, lang)}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" style={{ color: totals.gain >= 0 ? theme.success : theme.danger }}>
              {totals.invested > 0 ? `${totals.gainPct >= 0 ? '+' : ''}${Math.round(totals.gainPct * 100)}%` : '—'}
            </ThemedText>
          </Card>

          {investments.length === 0 ? (
            <Card>
              <EmptyState icon="trending-up-outline" text={t('noInvestments')} />
            </Card>
          ) : (
            investments.map((inv) => {
              const kind = INVESTMENT_BY_ID[inv.kind];
              const gain = inv.currentValue - inv.invested;
              const pct = inv.invested > 0 ? gain / inv.invested : 0;
              return (
                <Card key={inv.id}>
                  <Pressable
                    onLongPress={() => confirm(inv.name, () => deleteInvestment(inv.id))}
                    onPress={() => router.push({ pathname: '/add', params: { type: 'investment', id: inv.id } })}
                    style={styles.row}>
                    <View style={[styles.icon, { backgroundColor: `${kind?.color ?? theme.primary}22` }]}>
                      <Text style={styles.bigEmoji}>{kind?.icon ?? '✨'}</Text>
                    </View>
                    <View style={styles.flex}>
                      <ThemedText type="default" weight="semibold">
                        {inv.name}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {l(kind?.label)} · {t('investedAmount')}: {formatMoney(inv.invested, lang)}
                      </ThemedText>
                    </View>
                    <View style={styles.right}>
                      <ThemedText type="heading">{formatMoney(inv.currentValue, lang)}</ThemedText>
                      <ThemedText type="caption" weight="bold" style={{ color: gain >= 0 ? theme.success : theme.danger }}>
                        {gain >= 0 ? '+' : ''}
                        {Math.round(pct * 100)}%
                      </ThemedText>
                    </View>
                  </Pressable>
                </Card>
              );
            })
          )}
          <Button title={`+ ${t('addInvestment')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'investment' } })} />
        </>
      )}

      {tab === 'debts' && (
        <>
          <View style={styles.tiles}>
            <StatTile icon="arrow-down-outline" label={t('owedToMe')} value={formatMoney(debtSum.owedToMe, lang)} accent={theme.success} />
            <StatTile icon="arrow-up-outline" label={t('iOwe')} value={formatMoney(debtSum.iOwe, lang)} accent={theme.danger} />
          </View>
          <Card style={styles.gainCard}>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('netDebt')}
            </ThemedText>
            <ThemedText type="title" style={{ color: debtSum.net >= 0 ? theme.success : theme.danger }}>
              {formatMoney(debtSum.net, lang)}
            </ThemedText>
          </Card>

          {debts.length === 0 ? (
            <Card>
              <EmptyState icon="swap-horizontal-outline" text={t('noDebts')} />
            </Card>
          ) : (
            debts.map((debt) => {
              const remaining = Math.max(0, debt.amount - debt.paid);
              const progress = debt.amount > 0 ? debt.paid / debt.amount : 0;
              const isOwedToMe = debt.direction === 'owed_to_me';
              return (
                <Card key={debt.id}>
                  <Pressable
                    onLongPress={() => confirm(debt.name, () => deleteDebt(debt.id))}
                    onPress={() => router.push({ pathname: '/add', params: { type: 'debt', id: debt.id } })}>
                    <View style={styles.row}>
                      <View style={[styles.icon, { backgroundColor: isOwedToMe ? theme.primarySoft : theme.dangerSoft }]}>
                        <Text style={styles.bigEmoji}>{isOwedToMe ? '📥' : '📤'}</Text>
                      </View>
                      <View style={styles.flex}>
                        <ThemedText type="default" weight="semibold" numberOfLines={1}>
                          {debt.name}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {isOwedToMe ? t('lent') : t('borrowed')} · {t('remaining')}: {formatMoney(remaining, lang)}
                        </ThemedText>
                      </View>
                      <ThemedText type="heading">{formatMoney(debt.amount, lang)}</ThemedText>
                    </View>
                    <View style={styles.progress}>
                      <ProgressBar progress={progress} color={isOwedToMe ? theme.primary : theme.danger} />
                      <ThemedText type="caption" themeColor="textSecondary">
                        {formatMoney(debt.paid, lang)} {t('paid')}
                      </ThemedText>
                    </View>
                  </Pressable>
                </Card>
              );
            })
          )}
          <Button title={`+ ${t('addDebt')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'debt' } })} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  totalCard: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.four },
  tiles: { flexDirection: 'row', gap: Spacing.two },
  gainCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 24 },
  right: { alignItems: 'flex-end' },
  progress: { marginTop: Spacing.two, gap: Spacing.one },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: Radius.pill },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
