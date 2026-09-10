import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/misc';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import {
  EXPENSE_CATEGORIES,
  HABIT_PRESETS,
  INCOME_CATEGORIES,
  INVESTMENT_KINDS,
  PAYMENT_METHODS,
  PRIORITIES,
  SAVINGS_TYPES,
  TASK_CATEGORIES,
} from '@/lib/catalog';
import { dateKey, formatDate, formatMoney } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import type {
  BillFrequency,
  DebtDirection,
  GoalType,
  InvestmentKind,
  Language,
  PaymentType,
  Priority,
  SavingsType,
  TaskCategory,
  TransactionTag,
} from '@/lib/types';

const HABIT_ICONS = ['💧', '😴', '🏃', '🕌', '📖', '🚭', '🧘', '🥗', '💊', '🧹'];
const HABIT_COLORS = ['#0EA5E9', '#6366F1', '#2E9E5B', '#14B8A6', '#F59E0B', '#EC4899', '#EF4444'];
const BILL_ICONS = ['🧾', '💡', '🌐', '📱', '🚰', '🏠', '🔥', '💳'];
const ROUTINE_ICONS = ['🌅', '🕌', '💼', '🍽️', '🏃', '📚', '👨‍👩‍👧', '🌙'];
const ROUTINE_COLORS = ['#0EA5E9', '#6366F1', '#2E9E5B', '#14B8A6', '#F59E0B', '#EC4899'];
const GOAL_ICONS = ['🏍️', '📱', '💻', '🏠', '✈️', '🎓', '💍', '🚗', '🛡️', '📚', '🏋️', '🌍'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const BUCKET_COLORS: Record<SavingsType, string> = {
  dps: '#2E9E5B',
  fdr: '#0EA5E9',
  bank: '#6366F1',
  somiti: '#F59E0B',
  cash: '#14B8A6',
  other: '#8B5CF6',
};

export default function AddScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useT();
  const params = useLocalSearchParams<{ type?: string; id?: string }>();
  const type = params.type ?? 'expense';
  const editing = Boolean(params.id) && !['bucket', 'debt', 'budget', 'investment'].includes(type);
  const lang = useAppStore((s) => s.user?.language ?? 'en');

  const close = () => router.back();

  const titles: Record<string, string> = {
    expense: t('addExpenseTitle'),
    income: t('addIncomeTitle'),
    transfer: t('addExpenseTitle'),
    task: t('addTaskTitle'),
    habit: t('addHabitTitle'),
    bucket: t('addBucketTitle'),
    investment: t('addInvestment'),
    budget: t('addBudget'),
    bill: t('addBill'),
    debt: t('addDebt'),
    health: t('addHealth'),
    routine: t('addRoutine'),
    goal: t('addGoal'),
    'income-setting': t('updateIncome'),
  };
  const title = editing ? t('editTransaction') : titles[type] ?? t('quickAdd');

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="heading">{title}</ThemedText>
          <Pressable onPress={close} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {(type === 'expense' || type === 'income' || type === 'transfer') && (
              <TransactionForm income={type === 'income'} id={params.id} onDone={close} />
            )}
            {type === 'task' && <TaskForm onDone={close} />}
            {type === 'habit' && <HabitForm onDone={close} lang={lang} />}
            {type === 'bucket' && <BucketForm onDone={close} bucketId={params.id} />}
            {type === 'investment' && <InvestmentForm onDone={close} investmentId={params.id} />}
            {type === 'budget' && <BudgetForm onDone={close} budgetId={params.id} />}
            {type === 'bill' && <BillForm onDone={close} />}
            {type === 'debt' && <DebtForm onDone={close} debtId={params.id} />}
            {type === 'health' && <HealthForm onDone={close} />}
            {type === 'routine' && <RoutineForm onDone={close} />}
            {type === 'goal' && <GoalForm onDone={close} goalId={params.id} />}
            {type === 'income-setting' && <IncomeSettingForm onDone={close} />}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function TransactionForm({ income, id, onDone }: { income: boolean; id?: string; onDone: () => void }) {
  const theme = useTheme();
  const { t, l } = useT();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const updateTransaction = useAppStore((s) => s.updateTransaction);
  const existing = useAppStore((s) => s.transactions.find((tx) => tx.id === id));

  const categories = income ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0].id);
  const [methodId, setMethodId] = useState<PaymentType>(existing?.methodId ?? 'cash');
  const [tag, setTag] = useState<TransactionTag>(existing?.tag ?? 'personal');
  const [note, setNote] = useState(existing?.note ?? '');
  const [receipt, setReceipt] = useState<string | undefined>(existing?.receiptUri);

  const value = Number(amount) || 0;
  const valid = value > 0;

  const pick = async (camera: boolean) => {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.5 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, mediaTypes: ['images'] });
    if (!result.canceled) setReceipt(result.assets[0].uri);
  };

  const submit = () => {
    if (!valid) return;
    const patch = {
      type: (income ? 'income' : 'expense') as 'income' | 'expense',
      amount: value,
      categoryId,
      methodId,
      tag,
      note: note.trim() || undefined,
      receiptUri: receipt,
    };
    if (existing) updateTransaction(existing.id, patch);
    else addTransaction({ ...patch, date: new Date().toISOString() });
    onDone();
  };

  return (
    <View style={styles.form}>
      <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
        <TextInput
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          autoFocus={!existing}
          style={[styles.amountField, { color: theme.text }]}
        />
      </View>

      <Field label={t('category')}>
        <View style={styles.grid}>
          {categories.map((category) => {
            const active = category.id === categoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={[styles.catTile, { backgroundColor: active ? category.color : theme.card, borderColor: active ? category.color : theme.border }]}>
                <Text style={styles.catEmoji}>{category.icon}</Text>
                <ThemedText type="caption" weight="semibold" style={{ color: active ? '#FFFFFF' : theme.text }} numberOfLines={1}>
                  {l(category.label)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Field label={t('method')}>
        <View style={styles.wrapRow}>
          {PAYMENT_METHODS.map((method) => (
            <Chip key={method.id} label={method.short} color={method.color} selected={method.id === methodId} onPress={() => setMethodId(method.id)} />
          ))}
        </View>
      </Field>

      {!income && (
        <Field label={t('tag')}>
          <View style={styles.wrapRow}>
            <Chip label={t('tagPersonal')} selected={tag === 'personal'} onPress={() => setTag('personal')} />
            <Chip label={t('tagFamily')} selected={tag === 'family'} onPress={() => setTag('family')} />
            <Chip label={t('tagBusiness')} selected={tag === 'business'} onPress={() => setTag('business')} />
          </View>
        </Field>
      )}

      <Field label={`${t('note')} (${t('optional')})`}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('notePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        />
      </Field>

      {!income && (
        <Field label={t('receipt')}>
          {receipt ? (
            <View style={styles.receiptRow}>
              <Image source={{ uri: receipt }} style={styles.receiptImage} />
              <Button title={t('removeReceipt')} variant="danger" compact onPress={() => setReceipt(undefined)} />
            </View>
          ) : (
            <View style={styles.wrapRow}>
              <Chip icon="📷" label={t('takePhoto')} onPress={() => pick(true)} />
              <Chip icon="🖼️" label={t('choosePhoto')} onPress={() => pick(false)} />
            </View>
          )}
        </Field>
      )}

      <Button title={t('save')} onPress={submit} disabled={!valid} />
    </View>
  );
}

function TaskForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t, l } = useT();
  const addTask = useAppStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [due, setDue] = useState<'none' | 'today' | 'tomorrow'>('today');
  const valid = title.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    let dueAt: string | undefined;
    if (due !== 'none') {
      const d = new Date();
      if (due === 'tomorrow') d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
      dueAt = d.toISOString();
    }
    addTask({ title: title.trim(), priority, category, dueAt });
    onDone();
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('taskPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      <Field label={t('priority')}>
        <View style={styles.wrapRow}>
          {PRIORITIES.map((p) => (
            <Chip key={p.id} label={l(p.label)} color={p.color} selected={priority === p.id} onPress={() => setPriority(p.id)} />
          ))}
        </View>
      </Field>
      <Field label={t('category')}>
        <View style={styles.wrapRow}>
          {TASK_CATEGORIES.map((c) => (
            <Chip key={c.id} label={l(c.label)} color={c.color} selected={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </View>
      </Field>
      <Field label={t('dueDate')}>
        <View style={styles.wrapRow}>
          <Chip label={t('none')} selected={due === 'none'} onPress={() => setDue('none')} />
          <Chip label={t('today')} selected={due === 'today'} onPress={() => setDue('today')} />
          <Chip label={t('tomorrow')} selected={due === 'tomorrow'} onPress={() => setDue('tomorrow')} />
        </View>
      </Field>
      <Button title={t('save')} onPress={submit} disabled={!valid} />
    </View>
  );
}

function HabitForm({ onDone, lang }: { onDone: () => void; lang: Language }) {
  const theme = useTheme();
  const { t, l } = useT();
  const addHabit = useAppStore((s) => s.addHabit);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [target, setTarget] = useState('1');
  const [unit, setUnit] = useState('');
  const valid = name.trim().length > 0 && Number(target) > 0;

  const applyPreset = (index: number) => {
    const preset = HABIT_PRESETS[index];
    setName(preset.name[lang]);
    setIcon(preset.icon);
    setColor(preset.color);
    setTarget(String(preset.targetPerDay));
    setUnit(preset.unit[lang]);
  };

  const submit = () => {
    if (!valid) return;
    addHabit({ name: name.trim(), icon, color, targetPerDay: Number(target), unit: { en: unit.trim() || 'times', bn: unit.trim() || 'বার' } });
    onDone();
  };

  return (
    <View style={styles.form}>
      <Field label={t('pickHabit')}>
        <View style={styles.wrapRow}>
          {HABIT_PRESETS.map((preset, index) => (
            <Chip key={preset.name.en} icon={preset.icon} label={l(preset.name)} color={preset.color} onPress={() => applyPreset(index)} />
          ))}
        </View>
      </Field>
      <Field label={t('customHabit')}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('habitNamePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        />
      </Field>
      <View style={styles.inlineRow}>
        <View style={styles.flex}>
          <Field label={t('targetPerDay')}>
            <TextInput
              value={target}
              onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
        <View style={styles.flex}>
          <Field label={t('unit')}>
            <TextInput
              value={unit}
              onChangeText={setUnit}
              placeholder="times"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
      </View>
      <Field label="Icon">
        <View style={styles.wrapRow}>
          {HABIT_ICONS.map((item) => (
            <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconTile, { borderColor: icon === item ? theme.primary : theme.border, backgroundColor: theme.card }]}>
              <Text style={styles.iconText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Field>
      <Field label="Color">
        <View style={styles.wrapRow}>
          {HABIT_COLORS.map((item) => (
            <Pressable key={item} onPress={() => setColor(item)} style={[styles.colorDot, { backgroundColor: item, borderColor: color === item ? theme.text : 'transparent' }]} />
          ))}
        </View>
      </Field>
      <Button title={t('save')} onPress={submit} disabled={!valid} />
    </View>
  );
}

function BucketForm({ onDone, bucketId }: { onDone: () => void; bucketId?: string }) {
  const theme = useTheme();
  const { t, l } = useT();
  const addBucket = useAppStore((s) => s.addBucket);
  const updateBucket = useAppStore((s) => s.updateBucket);
  const bucket = useAppStore((s) => s.buckets.find((b) => b.id === bucketId));
  const [name, setName] = useState('');
  const [type, setType] = useState<SavingsType>('dps');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [add, setAdd] = useState('');

  if (bucket) {
    return (
      <View style={styles.form}>
        <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
          <TextInput
            value={add}
            onChangeText={(v) => setAdd(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[styles.amountField, { color: theme.text }]}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {bucket.name} · {t('current')}: ৳ {bucket.current}
        </ThemedText>
        <Button
          title={t('save')}
          onPress={() => {
            updateBucket(bucket.id, { current: Math.max(0, bucket.current + (Number(add) || 0)) });
            onDone();
          }}
          disabled={!Number(add)}
        />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('bucketNamePlaceholder')}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      <Field label={t('bucketType')}>
        <View style={styles.wrapRow}>
          {SAVINGS_TYPES.map((item) => (
            <Chip key={item.id} icon={item.icon} label={l(item.label)} color={BUCKET_COLORS[item.id]} selected={type === item.id} onPress={() => setType(item.id)} />
          ))}
        </View>
      </Field>
      <View style={styles.inlineRow}>
        <View style={styles.flex}>
          <Field label={t('current')}>
            <TextInput
              value={current}
              onChangeText={(v) => setCurrent(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
        <View style={styles.flex}>
          <Field label={`${t('target')} (${t('optional')})`}>
            <TextInput
              value={target}
              onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
      </View>
      <Button
        title={t('saveBucket')}
        onPress={() => {
          addBucket({ name: name.trim(), type, current: Number(current) || 0, target: Number(target) || undefined });
          onDone();
        }}
        disabled={!name.trim()}
      />
    </View>
  );
}

function InvestmentForm({ onDone, investmentId }: { onDone: () => void; investmentId?: string }) {
  const theme = useTheme();
  const { t, l } = useT();
  const addInvestment = useAppStore((s) => s.addInvestment);
  const updateInvestment = useAppStore((s) => s.updateInvestment);
  const existing = useAppStore((s) => s.investments.find((i) => i.id === investmentId));
  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<InvestmentKind>(existing?.kind ?? 'stocks');
  const [invested, setInvested] = useState(existing ? String(existing.invested) : '');
  const [current, setCurrent] = useState(existing ? String(existing.currentValue) : '');
  const valid = name.trim().length > 0 && Number(invested) > 0;

  const submit = () => {
    if (!valid) return;
    const investedValue = Number(invested) || 0;
    const currentValue = Number(current) || investedValue;
    if (existing) updateInvestment(existing.id, { name: name.trim(), kind, invested: investedValue, currentValue });
    else addInvestment({ name: name.trim(), kind, invested: investedValue, currentValue, date: new Date().toISOString() });
    onDone();
  };

  return (
    <View style={styles.form}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('investmentName')}
        placeholderTextColor={theme.textSecondary}
        autoFocus={!existing}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      <Field label={t('investmentKind')}>
        <View style={styles.wrapRow}>
          {INVESTMENT_KINDS.map((item) => (
            <Chip key={item.id} icon={item.icon} label={l(item.label)} color={item.color} selected={kind === item.id} onPress={() => setKind(item.id)} />
          ))}
        </View>
      </Field>
      <View style={styles.inlineRow}>
        <View style={styles.flex}>
          <Field label={t('investedAmount')}>
            <TextInput
              value={invested}
              onChangeText={(v) => setInvested(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
        <View style={styles.flex}>
          <Field label={t('currentValue')}>
            <TextInput
              value={current}
              onChangeText={(v) => setCurrent(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder={invested || '0'}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
      </View>
      <Button title={t('save')} onPress={submit} disabled={!valid} />
    </View>
  );
}

function BudgetForm({ onDone, budgetId }: { onDone: () => void; budgetId?: string }) {
  const theme = useTheme();
  const { t, l } = useT();
  const setBudget = useAppStore((s) => s.setBudget);
  const existing = useAppStore((s) => s.budgets.find((b) => b.id === budgetId));
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? EXPENSE_CATEGORIES[0].id);
  const [limit, setLimit] = useState(existing ? String(existing.limit) : '');
  const valid = Number(limit) > 0;

  return (
    <View style={styles.form}>
      <Field label={t('budgetFor')}>
        <View style={styles.grid}>
          {EXPENSE_CATEGORIES.map((category) => {
            const active = category.id === categoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={[styles.catTile, { backgroundColor: active ? category.color : theme.card, borderColor: active ? category.color : theme.border }]}>
                <Text style={styles.catEmoji}>{category.icon}</Text>
                <ThemedText type="caption" weight="semibold" style={{ color: active ? '#FFFFFF' : theme.text }} numberOfLines={1}>
                  {l(category.label)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Field>
      <Field label={t('monthlyLimit')}>
        <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
          <TextInput
            value={limit}
            onChangeText={(v) => setLimit(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            style={[styles.amountField, { color: theme.text }]}
          />
        </View>
      </Field>
      <ThemedText type="caption" themeColor="textSecondary">
        {t('budgetHint')}
      </ThemedText>
      <Button
        title={t('setBudget')}
        onPress={() => {
          setBudget(categoryId, Number(limit));
          onDone();
        }}
        disabled={!valid}
      />
    </View>
  );
}

function BillForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useT();
  const addBill = useAppStore((s) => s.addBill);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('monthly');
  const [dueDay, setDueDay] = useState('5');
  const [weekday, setWeekday] = useState(0);
  const [icon, setIcon] = useState(BILL_ICONS[0]);
  const valid = title.trim().length > 0 && Number(amount) > 0;

  const frequencies: { id: BillFrequency; label: string }[] = [
    { id: 'monthly', label: t('monthly') },
    { id: 'weekly', label: t('weekly') },
    { id: 'yearly', label: t('yearly') },
    { id: 'once', label: t('once') },
  ];

  return (
    <View style={styles.form}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('billName')}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      <Field label={t('amount')}>
        <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            style={[styles.amountField, { color: theme.text }]}
          />
        </View>
      </Field>
      <Field label={t('frequency')}>
        <View style={styles.wrapRow}>
          {frequencies.map((f) => (
            <Chip key={f.id} label={f.label} selected={frequency === f.id} onPress={() => setFrequency(f.id)} />
          ))}
        </View>
      </Field>
      {(frequency === 'monthly' || frequency === 'yearly') && (
        <Field label={t('dueDay')}>
          <TextInput
            value={dueDay}
            onChangeText={(v) => setDueDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
            keyboardType="number-pad"
            placeholder="1-31"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />
        </Field>
      )}
      {frequency === 'weekly' && (
        <Field label={t('dueDay')}>
          <View style={styles.wrapRow}>
            {WEEKDAYS.map((day, index) => (
              <Chip key={index} label={day} selected={weekday === index} onPress={() => setWeekday(index)} />
            ))}
          </View>
        </Field>
      )}
      <Field label="Icon">
        <View style={styles.wrapRow}>
          {BILL_ICONS.map((item) => (
            <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconTile, { borderColor: icon === item ? theme.primary : theme.border, backgroundColor: theme.card }]}>
              <Text style={styles.iconText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Field>
      <Button
        title={t('save')}
        onPress={() => {
          addBill({
            title: title.trim(),
            amount: Number(amount),
            frequency,
            dueDay: frequency === 'weekly' ? weekday : Number(dueDay) || 1,
            icon,
          });
          onDone();
        }}
        disabled={!valid}
      />
    </View>
  );
}

function DebtForm({ onDone, debtId }: { onDone: () => void; debtId?: string }) {
  const theme = useTheme();
  const { t } = useT();
  const addDebt = useAppStore((s) => s.addDebt);
  const payDebt = useAppStore((s) => s.payDebt);
  const existing = useAppStore((s) => s.debts.find((d) => d.id === debtId));
  const [name, setName] = useState('');
  const [direction, setDirection] = useState<DebtDirection>('owed_to_me');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState('');

  if (existing) {
    const remaining = Math.max(0, existing.amount - existing.paid);
    return (
      <View style={styles.form}>
        <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
          <TextInput
            value={payment}
            onChangeText={(v) => setPayment(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[styles.amountField, { color: theme.text }]}
          />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {existing.name} · {t('remaining')}: ৳ {remaining}
        </ThemedText>
        <Button
          title={t('recordPayment')}
          onPress={() => {
            payDebt(existing.id, Number(payment) || 0);
            onDone();
          }}
          disabled={!Number(payment)}
        />
      </View>
    );
  }

  const valid = name.trim().length > 0 && Number(amount) > 0;

  return (
    <View style={styles.form}>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('debtName')}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      <Field label={t('debtDirection')}>
        <View style={styles.wrapRow}>
          <Chip label={t('lent')} color="#2E9E5B" selected={direction === 'owed_to_me'} onPress={() => setDirection('owed_to_me')} />
          <Chip label={t('borrowed')} color="#E5484D" selected={direction === 'i_owe'} onPress={() => setDirection('i_owe')} />
        </View>
      </Field>
      <Field label={t('amount')}>
        <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
          <TextInput
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            style={[styles.amountField, { color: theme.text }]}
          />
        </View>
      </Field>
      <Field label={`${t('note')} (${t('optional')})`}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('notePlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        />
      </Field>
      <Button
        title={t('save')}
        onPress={() => {
          addDebt({ name: name.trim(), direction, amount: Number(amount), paid: 0, note: note.trim() || undefined });
          onDone();
        }}
        disabled={!valid}
      />
    </View>
  );
}

function HealthForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useT();
  const upsertHealthLog = useAppStore((s) => s.upsertHealthLog);
  const today = dateKey();
  const existing = useAppStore((s) => s.healthLogs.find((h) => h.date === today));
  const [weight, setWeight] = useState(existing?.weightKg ? String(existing.weightKg) : '');
  const [water, setWater] = useState(existing?.water ? String(existing.water) : '');
  const [sleep, setSleep] = useState(existing?.sleepHours ? String(existing.sleepHours) : '');
  const [calories, setCalories] = useState(existing?.calories ? String(existing.calories) : '');

  return (
    <View style={styles.form}>
      <Field label={`${t('weight')} (kg)`}>
        <TextInput
          value={weight}
          onChangeText={(v) => setWeight(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        />
      </Field>
      <View style={styles.inlineRow}>
        <View style={styles.flex}>
          <Field label={t('water')}>
            <TextInput
              value={water}
              onChangeText={(v) => setWater(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
        <View style={styles.flex}>
          <Field label={`${t('sleep')} (h)`}>
            <TextInput
              value={sleep}
              onChangeText={(v) => setSleep(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
      </View>
      <Field label={t('calories')}>
        <TextInput
          value={calories}
          onChangeText={(v) => setCalories(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
        />
      </Field>
      <Button
        title={t('save')}
        onPress={() => {
          upsertHealthLog(today, {
            weightKg: Number(weight) || undefined,
            water: Number(water) || undefined,
            sleepHours: Number(sleep) || undefined,
            calories: Number(calories) || undefined,
          });
          onDone();
        }}
      />
    </View>
  );
}

function RoutineForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useT();
  const addRoutine = useAppStore((s) => s.addRoutine);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('08:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [icon, setIcon] = useState(ROUTINE_ICONS[0]);
  const [color, setColor] = useState(ROUTINE_COLORS[0]);
  const valid = title.trim().length > 0 && days.length > 0;

  const toggleDay = (index: number) =>
    setDays((prev) => (prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]));

  return (
    <View style={styles.form}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('routineTitle')}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />
      <View style={styles.inlineRow}>
        <View style={styles.flex}>
          <Field label={t('startTime')}>
            <TextInput
              value={start}
              onChangeText={setStart}
              placeholder="07:00"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
        <View style={styles.flex}>
          <Field label={t('endTime')}>
            <TextInput
              value={end}
              onChangeText={setEnd}
              placeholder="08:00"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </View>
      </View>
      <Field label={t('daysOfWeek')}>
        <View style={styles.wrapRow}>
          {WEEKDAYS.map((day, index) => (
            <Chip key={index} label={day} selected={days.includes(index)} onPress={() => toggleDay(index)} />
          ))}
        </View>
      </Field>
      <Field label="Icon">
        <View style={styles.wrapRow}>
          {ROUTINE_ICONS.map((item) => (
            <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconTile, { borderColor: icon === item ? theme.primary : theme.border, backgroundColor: theme.card }]}>
              <Text style={styles.iconText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Field>
      <Field label="Color">
        <View style={styles.wrapRow}>
          {ROUTINE_COLORS.map((item) => (
            <Pressable key={item} onPress={() => setColor(item)} style={[styles.colorDot, { backgroundColor: item, borderColor: color === item ? theme.text : 'transparent' }]} />
          ))}
        </View>
      </Field>
      <Button
        title={t('save')}
        onPress={() => {
          addRoutine({ title: title.trim(), start, end, days, icon, color });
          onDone();
        }}
        disabled={!valid}
      />
    </View>
  );
}

function GoalForm({ onDone, goalId }: { onDone: () => void; goalId?: string }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const addGoal = useAppStore((s) => s.addGoal);
  const addGoalDeposit = useAppStore((s) => s.addGoalDeposit);
  const existing = useAppStore((s) => s.goals.find((g) => g.id === goalId));
  const user = useAppStore((s) => s.user);

  const [deposit, setDeposit] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<GoalType>('financial');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [months, setMonths] = useState('6');
  const [count, setCount] = useState('');
  const [unit, setUnit] = useState('');

  if (existing) {
    const total = existing.deposits.reduce((sum, d) => sum + d.amount, 0);
    return (
      <View style={styles.form}>
        <View style={styles.goalHead}>
          <Text style={styles.goalEmoji}>{existing.icon}</Text>
          <View style={styles.flex}>
            <ThemedText type="subtitle">{existing.title}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {formatMoney(total, lang)} / {formatMoney(existing.targetAmount, lang)}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
          <TextInput
            value={deposit}
            onChangeText={(v) => setDeposit(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            style={[styles.amountField, { color: theme.text }]}
          />
        </View>
        <Button
          title={t('addToGoal')}
          onPress={() => {
            addGoalDeposit(existing.id, Number(deposit) || 0);
            onDone();
          }}
          disabled={!Number(deposit)}
        />
      </View>
    );
  }

  const monthsNum = Math.max(1, Number(months) || 1);
  const deadlineDate = new Date();
  deadlineDate.setMonth(deadlineDate.getMonth() + monthsNum);
  const requiredMonthly =
    type === 'financial' ? Math.max(0, (Number(target) || 0) - (Number(saved) || 0)) / monthsNum : 0;
  const feasible = !user?.monthlyIncome || requiredMonthly <= user.monthlyIncome * 0.3;
  const valid = title.trim().length > 0 && (type === 'financial' ? Number(target) > 0 : Number(count) > 0);

  return (
    <View style={styles.form}>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t('goalNamePlaceholder')}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
      />

      <Field label={t('goalTitle')}>
        <View style={styles.wrapRow}>
          <Chip icon="💰" label={t('financialGoal')} color="#2E9E5B" selected={type === 'financial'} onPress={() => setType('financial')} />
          <Chip icon="🌱" label={t('lifeGoal')} color="#0EA5E9" selected={type === 'life'} onPress={() => setType('life')} />
        </View>
      </Field>

      <Field label={t('chooseIcon')}>
        <View style={styles.wrapRow}>
          {GOAL_ICONS.map((item) => (
            <Pressable key={item} onPress={() => setIcon(item)} style={[styles.iconTile, { borderColor: icon === item ? theme.primary : theme.border, backgroundColor: theme.card }]}>
              <Text style={styles.iconText}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      {type === 'financial' ? (
        <>
          <Field label={t('targetAmount')}>
            <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
              <TextInput
                value={target}
                onChangeText={(v) => setTarget(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                style={[styles.amountField, { color: theme.text }]}
              />
            </View>
          </Field>
          <Field label={t('savedSoFar')}>
            <TextInput
              value={saved}
              onChangeText={(v) => setSaved(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
          </Field>
        </>
      ) : (
        <View style={styles.inlineRow}>
          <View style={styles.flex}>
            <Field label={t('lifeTarget')}>
              <TextInput
                value={count}
                onChangeText={(v) => setCount(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="12"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              />
            </Field>
          </View>
          <View style={styles.flex}>
            <Field label={t('unitLabel')}>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="books"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              />
            </Field>
          </View>
        </View>
      )}

      <Field label={t('targetDate')}>
        <View style={styles.wrapRow}>
          {['3', '6', '12', '24'].map((m) => (
            <Chip key={m} label={`${m} ${t('months')}`} selected={months === m} onPress={() => setMonths(m)} />
          ))}
        </View>
      </Field>

      {type === 'financial' && Number(target) > 0 && (
        <View style={[styles.planCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
          <ThemedText type="label" style={{ color: theme.primary }}>
            {t('goalPlan')}
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: theme.primary }}>
            {t('needPerMonth')} {formatMoney(Math.round(requiredMonthly), lang)}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.primary }}>
            {t('reachBy')} {formatDate(deadlineDate.toISOString(), lang)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.primary }}>
            {feasible ? `✓ ${t('goalFeasible')}` : `⚠ ${t('goalStretch')}`}
          </ThemedText>
        </View>
      )}

      <Button
        title={t('createGoal')}
        onPress={() => {
          addGoal({
            title: title.trim(),
            type,
            icon,
            color: '#0D9488',
            targetAmount: type === 'financial' ? Number(target) || 0 : 0,
            targetCount: type === 'life' ? Number(count) || 0 : 0,
            currentCount: 0,
            unit: { en: unit.trim() || 'times', bn: unit.trim() || 'বার' },
            deadline: deadlineDate.toISOString(),
            deposits:
              type === 'financial' && Number(saved) > 0
                ? [{ amount: Number(saved), date: new Date().toISOString() }]
                : [],
          });
          onDone();
        }}
        disabled={!valid}
      />
    </View>
  );
}

function IncomeSettingForm({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useT();
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);
  const [value, setValue] = useState(user?.monthlyIncome ? String(user.monthlyIncome) : '');

  return (
    <View style={styles.form}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('monthlyIncomeSub')}
      </ThemedText>
      <View style={[styles.amountBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.amountSymbol, { color: theme.textSecondary }]}>৳</Text>
        <TextInput
          value={value}
          onChangeText={(v) => setValue(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          autoFocus
          style={[styles.amountField, { color: theme.text }]}
        />
      </View>
      <Button
        title={t('save')}
        onPress={() => {
          updateUser({ monthlyIncome: Number(value) || 0 });
          onDone();
        }}
        disabled={!Number(value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  goalEmoji: { fontSize: 40 },
  planCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  form: { gap: Spacing.four },
  field: { gap: Spacing.two },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  amountSymbol: { fontSize: 26, fontWeight: '700' },
  amountField: { fontSize: 38, fontWeight: '800', minWidth: 80, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  catTile: {
    width: '31%',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    gap: 3,
  },
  catEmoji: { fontSize: 20 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 15,
  },
  inlineRow: { flexDirection: 'row', gap: Spacing.three },
  iconTile: { width: 46, height: 46, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  receiptImage: { width: 72, height: 72, borderRadius: Radius.md },
});
