import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MiniBarChart } from '@/components/ui/charts';
import { EmptyState, SectionHeader } from '@/components/ui/misc';
import { ProgressBar } from '@/components/ui/progress';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import { habitProgress, healthSeries, isOverdue, latestHealth, pendingTasks } from '@/lib/analytics';
import { PRIORITIES, TASK_CATEGORIES } from '@/lib/catalog';
import { dateKey, formatDate, toBanglaDigits } from '@/lib/format';
import { formatPrayerTime, nextPrayer, prayerTimesFor } from '@/lib/prayer';
import { useAppStore } from '@/lib/store';
import type { HabitWithProgress } from '@/lib/types';

type Tab = 'tasks' | 'habits' | 'health' | 'routine';

const DHAKA = { lat: 23.8103, lng: 90.4125 };
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function LifeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, l, lang } = useT();

  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const healthLogs = useAppStore((s) => s.healthLogs);
  const routine = useAppStore((s) => s.routine);
  const user = useAppStore((s) => s.user);
  const toggleTask = useAppStore((s) => s.toggleTask);
  const deleteTask = useAppStore((s) => s.deleteTask);
  const deleteHabit = useAppStore((s) => s.deleteHabit);
  const incrementHabit = useAppStore((s) => s.incrementHabit);
  const setHabitValue = useAppStore((s) => s.setHabitValue);
  const upsertHealthLog = useAppStore((s) => s.upsertHealthLog);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);
  const updateUser = useAppStore((s) => s.updateUser);

  const [tab, setTab] = useState<Tab>('tasks');
  const today = dateKey();
  const progress = useMemo(() => habitProgress(habits, habitLogs, today), [habits, habitLogs, today]);
  const pending = useMemo(() => pendingTasks(tasks), [tasks]);
  const completed = useMemo(() => tasks.filter((t) => t.done), [tasks]);
  const healthToday = useMemo(() => healthLogs.find((h) => h.date === today) ?? null, [healthLogs, today]);
  const health14 = useMemo(() => healthSeries(healthLogs, 14), [healthLogs]);
  const latest = useMemo(() => latestHealth(healthLogs), [healthLogs]);

  const num = (n: number) => (lang === 'bn' ? toBanglaDigits(String(n)) : String(n));

  const prayerEnabled = Boolean(user?.prayerEnabled);
  const lat = user?.prayerLat ?? DHAKA.lat;
  const lng = user?.prayerLng ?? DHAKA.lng;
  const prayers = useMemo(
    () => (prayerEnabled ? prayerTimesFor(new Date(), lat, lng) : []),
    [prayerEnabled, lat, lng],
  );
  const upcoming = useMemo(() => (prayerEnabled ? nextPrayer(lat, lng) : null), [prayerEnabled, lat, lng]);
  const todayBlocks = useMemo(
    () => routine.filter((block) => block.days.includes(new Date().getDay())).sort((a, b) => a.start.localeCompare(b.start)),
    [routine],
  );

  const enablePrayer = async () => {
    let coords = DHAKA;
    let city = 'Dhaka';
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        city = '';
      }
    } catch {
      // use default
    }
    updateUser({ prayerEnabled: true, prayerLat: coords.lat, prayerLng: coords.lng, prayerCity: city });
  };

  const confirmDeleteTask = (id: string, title: string) =>
    Alert.alert(t('delete'), title, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteTask(id) },
    ]);

  const confirmDeleteHabit = (id: string, title: string) =>
    Alert.alert(t('delete'), title, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteHabit(id) },
    ]);

  const confirmDeleteRoutine = (id: string, title: string) =>
    Alert.alert(t('delete'), title, [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteRoutine(id) },
    ]);

  return (
    <Screen>
      <ThemedText type="title">{t('life')}</ThemedText>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'tasks', label: t('tasks') },
          { value: 'habits', label: t('habits') },
          { value: 'health', label: t('health') },
          { value: 'routine', label: t('routine') },
        ]}
      />

      {tab === 'tasks' && (
        <>
          {pending.length === 0 && completed.length === 0 ? (
            <Card>
              <EmptyState icon="checkbox-outline" text={t('noTasks')} />
            </Card>
          ) : (
            <>
              {pending.length > 0 && (
                <Card padded={false} style={styles.listCard}>
                  {pending.map((task) => {
                    const category = TASK_CATEGORIES.find((c) => c.id === task.category);
                    const priority = PRIORITIES.find((p) => p.id === task.priority);
                    const overdue = isOverdue(task.dueAt);
                    return (
                      <Pressable
                        key={task.id}
                        onPress={() => toggleTask(task.id)}
                        onLongPress={() => confirmDeleteTask(task.id, task.title)}
                        style={({ pressed }) => [styles.taskRow, pressed && { opacity: 0.6 }]}>
                        <Ionicons name="ellipse-outline" size={24} color={theme.textSecondary} />
                        <View style={styles.flex}>
                          <ThemedText type="default" weight="semibold" numberOfLines={1}>
                            {task.title}
                          </ThemedText>
                          <View style={styles.taskMeta}>
                            <View style={[styles.dot, { backgroundColor: priority?.color }]} />
                            <ThemedText type="caption" themeColor="textSecondary">
                              {l(category?.label)}
                              {task.dueAt ? ` · ${overdue ? t('overdue') : formatDate(task.dueAt, lang)}` : ''}
                            </ThemedText>
                          </View>
                        </View>
                        {overdue ? (
                          <View style={[styles.badge, { backgroundColor: theme.dangerSoft }]}>
                            <ThemedText type="caption" weight="bold" style={{ color: theme.danger }}>
                              {t('overdue')}
                            </ThemedText>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </Card>
              )}
              {completed.length > 0 && (
                <>
                  <SectionHeader title={`${t('completed')} (${num(completed.length)})`} />
                  <Card padded={false} style={styles.listCard}>
                    {completed.map((task) => (
                      <Pressable
                        key={task.id}
                        onPress={() => toggleTask(task.id)}
                        onLongPress={() => confirmDeleteTask(task.id, task.title)}
                        style={styles.taskRow}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                        <ThemedText
                          type="default"
                          themeColor="textSecondary"
                          numberOfLines={1}
                          style={[styles.flex, styles.strike]}>
                          {task.title}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </Card>
                </>
              )}
            </>
          )}
          <Button title={`+ ${t('addTask')}`} onPress={() => router.push({ pathname: '/add', params: { type: 'task' } })} />
        </>
      )}

      {tab === 'habits' && (
        <>
          {progress.length === 0 ? (
            <Card>
              <EmptyState icon="flame-outline" text={t('noHabits')} />
            </Card>
          ) : (
            progress.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                lang={lang}
                onDelete={() => confirmDeleteHabit(habit.id, habit.name)}
                onMinus={() => incrementHabit(habit.id, today, -1)}
                onPlus={() => incrementHabit(habit.id, today, 1)}
                onToggle={() => setHabitValue(habit.id, today, habit.done ? 0 : habit.targetPerDay)}
              />
            ))
          )}
          <Button title={`+ ${t('addHabit')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'habit' } })} />
        </>
      )}

      {tab === 'health' && (
        <>
          {latest ? (
            <Card style={styles.healthTop}>
              <View style={styles.healthStat}>
                <ThemedText type="heading" style={{ color: theme.primary }}>
                  {latest.weightKg ? `${num(Math.round(latest.weightKg * 10) / 10)} kg` : '—'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('weight')}
                </ThemedText>
              </View>
              <View style={styles.healthStat}>
                <ThemedText type="heading">{num(latest.water ?? 0)}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('water')}
                </ThemedText>
              </View>
              <View style={styles.healthStat}>
                <ThemedText type="heading">{num(latest.sleepHours ?? 0)}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('sleep')}
                </ThemedText>
              </View>
            </Card>
          ) : null}

          <Card>
            <SectionHeader title={t('logToday')} />
            <HealthField
              label={`${t('weight')} (kg)`}
              value={healthToday?.weightKg ? String(healthToday.weightKg) : ''}
              onChange={(v) => upsertHealthLog(today, { weightKg: Number(v) || undefined })}
            />
            <HealthField
              label={`${t('sleep')} (h)`}
              value={healthToday?.sleepHours ? String(healthToday.sleepHours) : ''}
              onChange={(v) => upsertHealthLog(today, { sleepHours: Number(v) || undefined })}
            />
            <HealthField
              label={t('calories')}
              value={healthToday?.calories ? String(healthToday.calories) : ''}
              onChange={(v) => upsertHealthLog(today, { calories: Number(v) || undefined })}
            />
            <HealthField
              label={t('steps')}
              value={healthToday?.steps ? String(healthToday.steps) : ''}
              onChange={(v) => upsertHealthLog(today, { steps: Number(v) || undefined })}
            />
            <View style={styles.waterRow}>
              <ThemedText type="small" style={styles.flex}>
                {t('water')}
              </ThemedText>
              <Pressable
                onPress={() => upsertHealthLog(today, { water: Math.max(0, (healthToday?.water ?? 0) - 1) })}
                style={[styles.stepBtn, { borderColor: theme.border }]}>
                <Ionicons name="remove" size={16} color={theme.textSecondary} />
              </Pressable>
              <ThemedText type="heading">{num(healthToday?.water ?? 0)}</ThemedText>
              <Pressable
                onPress={() => upsertHealthLog(today, { water: (healthToday?.water ?? 0) + 1 })}
                style={[styles.stepBtn, { borderColor: theme.border }]}>
                <Ionicons name="add" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          </Card>

          <Card>
            <SectionHeader title={t('weight')} />
            <MiniBarChart
              data={health14.map((h, i) => ({
                label: '',
                value: h.weightKg ?? 0,
                active: i === health14.length - 1,
              }))}
              formatValue={(v) => String(Math.round(v))}
            />
          </Card>
        </>
      )}

      {tab === 'routine' && (
        <>
          <Card>
            <SectionHeader
              title={t('prayerTimes')}
              action={prayerEnabled ? undefined : t('enablePrayer')}
              onAction={prayerEnabled ? undefined : enablePrayer}
            />
            {prayerEnabled ? (
              <>
                {upcoming ? (
                  <View style={styles.nextPrayer}>
                    <Ionicons name="moon" size={20} color={theme.primary} />
                    <ThemedText type="default" weight="semibold" style={styles.flex}>
                      {t('nextPrayer')}: {l(upcoming.name)}
                    </ThemedText>
                    <ThemedText type="heading" style={{ color: theme.primary }}>
                      {formatPrayerTime(upcoming.time, lang)}
                    </ThemedText>
                  </View>
                ) : null}
                {prayers.map((prayer) => (
                  <View key={prayer.key} style={styles.prayerRow}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                      {l(prayer.name)}
                    </ThemedText>
                    <ThemedText type="small" weight="semibold">
                      {formatPrayerTime(prayer.time, lang)}
                    </ThemedText>
                  </View>
                ))}
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {t('prayerDisabled')}
              </ThemedText>
            )}
          </Card>

          <SectionHeader title={t('routine')} />
          {todayBlocks.length === 0 ? (
            <Card>
              <EmptyState icon="calendar-outline" text={t('noRoutine')} />
            </Card>
          ) : (
            todayBlocks.map((block) => (
              <Card key={block.id}>
                <Pressable onLongPress={() => confirmDeleteRoutine(block.id, block.title)} style={styles.routineRow}>
                  <View style={[styles.routineIcon, { backgroundColor: `${block.color}22` }]}>
                    <Text style={styles.routineEmoji}>{block.icon}</Text>
                  </View>
                  <View style={styles.flex}>
                    <ThemedText type="default" weight="semibold">
                      {block.title}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {block.start} – {block.end}
                    </ThemedText>
                  </View>
                  <View style={styles.weekDots}>
                    {WEEKDAYS.map((day, index) => (
                      <View
                        key={index}
                        style={[
                          styles.weekDay,
                          {
                            backgroundColor: block.days.includes(index) ? block.color : theme.muted,
                          },
                        ]}>
                        <Text style={styles.weekDayText}>{day}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              </Card>
            ))
          )}
          <Button title={`+ ${t('addRoutine')}`} variant="secondary" onPress={() => router.push({ pathname: '/add', params: { type: 'routine' } })} />
        </>
      )}
    </Screen>
  );
}

function HealthField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.healthField}>
      <ThemedText type="small" style={styles.flex}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        style={[styles.healthInput, { borderColor: theme.border, color: theme.text }]}
      />
    </View>
  );
}

function HabitCard({
  habit,
  lang,
  onDelete,
  onMinus,
  onPlus,
  onToggle,
}: {
  habit: HabitWithProgress;
  lang: 'en' | 'bn';
  onDelete: () => void;
  onMinus: () => void;
  onPlus: () => void;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const { t, l } = useT();
  const num = (n: number) => (lang === 'bn' ? toBanglaDigits(String(n)) : String(n));

  return (
    <Card>
      <Pressable onLongPress={onDelete}>
        <View style={styles.habitTop}>
          <View style={[styles.habitIcon, { backgroundColor: `${habit.color}22` }]}>
            <Text style={styles.habitEmoji}>{habit.icon}</Text>
          </View>
          <View style={styles.flex}>
            <ThemedText type="default" weight="semibold" numberOfLines={1}>
              {habit.name}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('streak')}: {num(habit.streak)} {t('days')}
            </ThemedText>
          </View>
          <Pressable
            onPress={onToggle}
            hitSlop={8}
            style={[styles.checkBtn, { backgroundColor: habit.done ? habit.color : theme.muted }]}>
            <Ionicons name={habit.done ? 'checkmark' : 'add'} size={20} color={habit.done ? '#FFFFFF' : theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.habitProgress}>
          <ProgressBar progress={habit.today / habit.targetPerDay} color={habit.color} height={6} />
          <View style={styles.habitControls}>
            <Pressable onPress={onMinus} hitSlop={6} style={[styles.stepBtn, { borderColor: theme.border }]}>
              <Ionicons name="remove" size={16} color={theme.textSecondary} />
            </Pressable>
            <ThemedText type="small" weight="semibold">
              {num(habit.today)} / {num(habit.targetPerDay)} {l(habit.unit)}
            </ThemedText>
            <Pressable onPress={onPlus} hitSlop={6} style={[styles.stepBtn, { borderColor: theme.border }]}>
              <Ionicons name="add" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.dots}>
          {habit.last7.map((done, i) => (
            <View key={i} style={[styles.weekDot, { backgroundColor: done ? habit.color : theme.muted }]} />
          ))}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listCard: { paddingHorizontal: Spacing.three, overflow: 'hidden' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: { width: 7, height: 7, borderRadius: 4 },
  strike: { textDecorationLine: 'line-through' },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.pill },
  habitTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  habitIcon: { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 22 },
  checkBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  habitProgress: { marginTop: Spacing.three, gap: Spacing.two },
  habitControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 32, height: 32, borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.two },
  weekDot: { flex: 1, height: 6, borderRadius: 3 },
  healthTop: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.four },
  healthStat: { alignItems: 'center', gap: 2 },
  healthField: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  healthInput: {
    minWidth: 90,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    textAlign: 'right',
  },
  waterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  nextPrayer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  prayerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.two },
  routineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  routineIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  routineEmoji: { fontSize: 22 },
  weekDots: { flexDirection: 'row', gap: 3 },
  weekDay: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weekDayText: { fontSize: 9, color: '#FFFFFF', fontWeight: '700' },
});
