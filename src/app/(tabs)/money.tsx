import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MiniBarChart } from '@/components/ui/charts';
import { Chip, EmptyState, ListRow, SectionHeader, StatTile } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import {
  billStatuses,
  budgetStatus,
  categoryBreakdown,
  inMonth,
  methodBreakdown,
  monthlyTrend,
  totalsOf,
} from '@/lib/analytics';
import { CATEGORY_BY_ID, EXPENSE_CATEGORIES, PAYMENT_BY_ID } from '@/lib/catalog';
import { formatDate, formatMoney, formatMonthYear } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import type { Transaction } from '@/lib/types';

type Tab = 'expenses' | 'budgets' | 'bills' | 'report';
type TypeFilter = 'all' | 'expense' | 'income';

export default function MoneyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, l, lang } = useT();

  const transactions = useAppStore((s) => s.transactions);
  const budgets = useAppStore((s) => s.budgets);
  const bills = useAppStore((s) => s.bills);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const deleteBudget = useAppStore((s) => s.deleteBudget);
  const toggleBillPaid = useAppStore((s) => s.toggleBillPaid);
  const deleteBill = useAppStore((s) => s.deleteBill);

  const [tab, setTab] = useState<Tab>('expenses');
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterType, setFilterType] = useState<TypeFilter>('all');

  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }, [offset]);

  const monthTx = useMemo(() => inMonth(transactions, monthDate), [transactions, monthDate]);
  const totals = useMemo(() => totalsOf(monthTx), [monthTx]);
  const breakdown = useMemo(() => categoryBreakdown(monthTx), [monthTx]);
  const methods = useMemo(() => methodBreakdown(monthTx), [monthTx]);
  const trend = useMemo(() => monthlyTrend(transactions, 6), [transactions]);
  const budgetRows = useMemo(() => budgetStatus(budgets, transactions, monthDate), [budgets, transactions, monthDate]);
  const billRows = useMemo(() => billStatuses(bills), [bills]);

  const searching = query.trim().length > 0 || filterCat !== 'all' || filterType !== 'all';
  const source = searching ? transactions : monthTx;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterCat !== 'all' && tx.categoryId !== filterCat) return false;
      if (!q) return true;
      const category = CATEGORY_BY_ID[tx.categoryId];
      const haystack = `${tx.note ?? ''} ${category?.label.en ?? ''} ${category?.label.bn ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [source, query, filterType, filterCat]);

  const monthLabel = formatMonthYear(monthDate, lang);

  const confirmDeleteTx = (tx: Transaction) => {
    const category = CATEGORY_BY_ID[tx.categoryId];
    Alert.alert(t('delete'), `${l(category?.label)} · ${formatMoney(tx.amount, lang)}`, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteTransaction(tx.id) },
    ]);
  };

  const confirmDeleteBudget = (id: string, title: string) =>
    Alert.alert(t('delete'), title, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteBudget(id) },
    ]);

  const confirmDeleteBill = (id: string, title: string) =>
    Alert.alert(t('delete'), title, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteBill(id) },
    ]);

  const editTransaction = (tx: Transaction) =>
    router.push({ pathname: '/add', params: { type: tx.type, id: tx.id } });

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="title">{t('money')}</ThemedText>
        {tab === 'expenses' || tab === 'report' ? (
          <View style={styles.monthNav}>
            <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={10}>
              <Text style={[styles.nav, { color: theme.primary }]}>‹</Text>
            </Pressable>
            <ThemedText type="small" weight="semibold" style={styles.monthLabel}>
              {monthLabel}
            </ThemedText>
            <Pressable onPress={() => setOffset((o) => Math.min(0, o + 1))} hitSlop={10} disabled={offset >= 0}>
              <Text style={[styles.nav, { color: offset >= 0 ? theme.border : theme.primary }]}>›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'expenses', label: t('expenses') },
          { value: 'budgets', label: t('budgets') },
          { value: 'bills', label: t('bills') },
          { value: 'report', label: t('report') },
        ]}
      />

      {tab === 'expenses' && (
        <>
          <View style={styles.tiles}>
            <StatTile icon="arrow-down-circle-outline" label={t('expense')} value={formatMoney(totals.expense, lang)} accent={theme.danger} />
            <StatTile icon="arrow-up-circle-outline" label={t('income')} value={formatMoney(totals.income, lang)} accent={theme.success} />
            <StatTile icon="wallet-outline" label={t('balance')} value={formatMoney(totals.balance, lang)} />
          </View>

          <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searching ? (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setQuery('');
                  setFilterCat('all');
                  setFilterType('all');
                }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filters}>
            <Chip label={t('allCategories')} selected={filterType === 'all'} onPress={() => setFilterType('all')} />
            <Chip label={t('expense')} selected={filterType === 'expense'} onPress={() => setFilterType('expense')} />
            <Chip label={t('income')} selected={filterType === 'income'} onPress={() => setFilterType('income')} />
          </View>

          <View style={styles.filters}>
            <Chip label={t('allCategories')} selected={filterCat === 'all'} onPress={() => setFilterCat('all')} />
            {EXPENSE_CATEGORIES.slice(0, 8).map((category) => (
              <Chip
                key={category.id}
                icon={category.icon}
                label={l(category.label)}
                color={category.color}
                selected={filterCat === category.id}
                onPress={() => setFilterCat(category.id)}
              />
            ))}
          </View>

          <SectionHeader title={`${filtered.length} ${t('transactions')}`} />
          <Card padded={false} style={styles.listCard}>
            {filtered.length === 0 ? (
              <EmptyState icon="receipt-outline" text={searching ? t('noResults') : t('noTransactions')} />
            ) : (
              filtered.map((tx) => {
                const category = CATEGORY_BY_ID[tx.categoryId];
                const method = PAYMENT_BY_ID[tx.methodId];
                const isIncome = tx.type === 'income';
                return (
                  <ListRow
                    key={tx.id}
                    onPress={() => editTransaction(tx)}
                    left={
                      <View style={[styles.txIcon, { backgroundColor: `${category?.color ?? theme.primary}22` }]}>
                        <Text style={styles.txEmoji}>{category?.icon ?? '💠'}</Text>
                      </View>
                    }
                    title={l(category?.label)}
                    subtitle={`${formatDate(tx.date, lang)} · ${method?.short ?? ''}${tx.note ? ` · ${tx.note}` : ''}`}
                    right={
                      <View style={styles.txRight}>
                        <ThemedText type="small" weight="bold" style={{ color: isIncome ? theme.success : theme.text }}>
                          {isIncome ? '+' : '-'}
                          {formatMoney(tx.amount, lang)}
                        </ThemedText>
                        <Pressable hitSlop={8} onPress={() => confirmDeleteTx(tx)}>
                          <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    }
                  />
                );
              })
            )}
          </Card>
        </>
      )}

      {tab === 'budgets' && (
        <>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('budgetHint')}
          </ThemedText>
          {budgetRows.length === 0 ? (
            <Card>
              <EmptyState icon="pie-chart-outline" text={t('noBudgets')} />
            </Card>
          ) : (
            budgetRows.map((row) => {
              const color = row.state === 'over' ? theme.danger : row.state === 'warn' ? theme.warning : theme.primary;
              return (
                <Card key={row.budget.id}>
                  <Pressable
                    onLongPress={() => confirmDeleteBudget(row.budget.id, l(row.category.label))}
                    onPress={() => router.push({ pathname: '/add', params: { type: 'budget', id: row.budget.id } })}>
                    <View style={styles.budgetTop}>
                      <Text style={styles.budgetIcon}>{row.category.icon}</Text>
                      <ThemedText type="default" weight="semibold" style={styles.flex} numberOfLines={1}>
                        {l(row.category.label)}
                      </ThemedText>
                      <ThemedText type="caption" weight="bold" style={{ color }}>
                        {row.state === 'over' ? t('overBudget') : row.state === 'warn' ? t('nearLimit') : ''}
                      </ThemedText>
                    </View>
                    <ProgressBar progress={row.ratio} color={color} />
                    <View style={styles.budgetBottom}>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {formatMoney(row.spent, lang)} {t('budgetSpentOf')} {formatMoney(row.limit, lang)}
                      </ThemedText>
                      <ThemedText type="caption" weight="bold" style={{ color }}>
                        {Math.round(row.ratio * 100)}%
                      </ThemedText>
                    </View>
                  </Pressable>
                </Card>
              );
            })
          )}
          <Button title={`+ ${t('addBudget')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'budget' } })} />
        </>
      )}

      {tab === 'bills' && (
        <>
          {billRows.length === 0 ? (
            <Card>
              <EmptyState icon="receipt-outline" text={t('noBills')} />
            </Card>
          ) : (
            billRows.map((row) => {
              const overdue = !row.paid && row.daysUntil < 0;
              const soon = !row.paid && row.daysUntil >= 0 && row.daysUntil <= 3;
              const color = row.paid ? theme.success : overdue ? theme.danger : soon ? theme.warning : theme.textSecondary;
              return (
                <Card key={row.bill.id}>
                  <Pressable onLongPress={() => confirmDeleteBill(row.bill.id, row.bill.title)}>
                    <View style={styles.billTop}>
                      <View style={[styles.billIcon, { backgroundColor: `${theme.primary}18` }]}>
                        <Text style={styles.billEmoji}>{row.bill.icon}</Text>
                      </View>
                      <View style={styles.flex}>
                        <ThemedText type="default" weight="semibold" numberOfLines={1}>
                          {row.bill.title}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color }}>
                          {row.paid
                            ? t('paid')
                            : overdue
                              ? t('overdue')
                              : row.daysUntil === 0
                                ? t('dueToday')
                                : `${t('dueIn')} ${row.daysUntil}`}
                        </ThemedText>
                      </View>
                      <ThemedText type="heading">{formatMoney(row.bill.amount, lang)}</ThemedText>
                    </View>
                    <Button
                      title={row.paid ? t('paid') : t('markPaid')}
                      variant={row.paid ? 'secondary' : 'primary'}
                      compact
                      style={styles.billAction}
                      onPress={() => toggleBillPaid(row.bill.id, row.period)}
                    />
                  </Pressable>
                </Card>
              );
            })
          )}
          <Button title={`+ ${t('addBill')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'bill' } })} />
        </>
      )}

      {tab === 'report' && (
        <>
          <Card>
            <SectionHeader title={t('monthlySummary')} />
            <ThemedText type="caption" themeColor="textSecondary">
              {monthLabel}
            </ThemedText>
            <View style={styles.reportGrid}>
              <ReportItem label={t('totalSpent')} value={formatMoney(totals.expense, lang)} color={theme.danger} />
              <ReportItem label={t('totalIncome')} value={formatMoney(totals.income, lang)} color={theme.success} />
              <ReportItem label={t('saved')} value={formatMoney(totals.balance, lang)} color={theme.primary} />
              <ReportItem
                label={t('savingsRate')}
                value={totals.income > 0 ? `${Math.round((totals.balance / totals.income) * 100)}%` : '—'}
                color={theme.text}
              />
            </View>
          </Card>

          <Card>
            <SectionHeader title={t('thisMonth')} />
            <MiniBarChart
              data={trend.map((m, i) => ({
                label: formatMonthYear(m.label, lang).split(' ')[0],
                value: m.expense,
                active: i === trend.length - 1,
              }))}
              formatValue={(v) => formatMoney(v, lang, false)}
            />
          </Card>

          {breakdown.length > 0 && (
            <Card>
              <SectionHeader title={t('topSpend')} />
              {breakdown.map((slice) => (
                <View key={slice.category.id} style={styles.catRow}>
                  <Text style={styles.catIcon}>{slice.category.icon}</Text>
                  <View style={styles.catInfo}>
                    <View style={styles.catTop}>
                      <ThemedText type="small" weight="semibold" numberOfLines={1} style={styles.flex}>
                        {l(slice.category.label)}
                      </ThemedText>
                      <ThemedText type="small" weight="bold">
                        {formatMoney(slice.amount, lang)} · {Math.round(slice.share * 100)}%
                      </ThemedText>
                    </View>
                    <ProgressBar progress={slice.share} color={slice.category.color} height={6} />
                  </View>
                </View>
              ))}
            </Card>
          )}

          {methods.length > 0 && (
            <Card>
              <SectionHeader title={t('byPaymentMethod')} />
              {methods.map((m) => {
                const method = PAYMENT_BY_ID[m.methodId];
                const max = methods[0]?.amount || 1;
                return (
                  <View key={m.methodId} style={styles.catRow}>
                    <View style={[styles.methodDot, { backgroundColor: method?.color }]} />
                    <View style={styles.catInfo}>
                      <View style={styles.catTop}>
                        <ThemedText type="small" weight="semibold">
                          {method?.short}
                        </ThemedText>
                        <ThemedText type="small" weight="bold">
                          {formatMoney(m.amount, lang)}
                        </ThemedText>
                      </View>
                      <ProgressBar progress={m.amount / max} color={method?.color} height={6} />
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
            {t('reportNote')}
          </ThemedText>
        </>
      )}
    </Screen>
  );
}

function ReportItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.reportItem}>
      <ThemedText type="heading" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  nav: { fontSize: 22, fontWeight: '700', paddingHorizontal: Spacing.one },
  monthLabel: { minWidth: 78, textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: Spacing.two },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.three - 2, fontSize: 15 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  listCard: { paddingHorizontal: Spacing.three, overflow: 'hidden' },
  txIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  txEmoji: { fontSize: 18 },
  txRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  budgetIcon: { fontSize: 22 },
  budgetBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  billTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  billIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  billEmoji: { fontSize: 22 },
  billAction: { width: '100%' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.two },
  reportItem: { minWidth: '40%', gap: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  catIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  catInfo: { flex: 1, gap: Spacing.one },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  methodDot: { width: 12, height: 12, borderRadius: 6 },
});
