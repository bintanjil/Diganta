import { CATEGORY_BY_ID } from './catalog';
import { dateKey, daysInMonth, monthKey } from './format';
import type {
  Bill,
  Budget,
  Category,
  Debt,
  Goal,
  Habit,
  HabitLog,
  HabitWithProgress,
  HealthLog,
  Investment,
  PaymentType,
  Task,
  Transaction,
  User,
} from './types';

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export function totalsOf(transactions: Transaction[]): Totals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

/** Planning income: the user's declared monthly income wins, otherwise actual logged income. */
export function effectiveIncome(user: User | null, transactions: Transaction[], date: Date = new Date()): number {
  const actual = totalsOf(inMonth(transactions, date)).income;
  return user?.monthlyIncome && user.monthlyIncome > 0 ? user.monthlyIncome : actual;
}

export function inMonth(transactions: Transaction[], date: Date = new Date()): Transaction[] {
  const key = monthKey(date);
  return transactions.filter((t) => monthKey(new Date(t.date)) === key);
}

export function onDay(transactions: Transaction[], key: string = dateKey()): Transaction[] {
  return transactions.filter((t) => dateKey(new Date(t.date)) === key);
}

export interface CategorySlice {
  category: Category;
  amount: number;
  share: number;
}

export function categoryBreakdown(transactions: Transaction[]): CategorySlice[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map.entries()]
    .map(([id, amount]) => ({
      category: CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID.other_expense,
      amount,
      share: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function methodBreakdown(transactions: Transaction[]): { methodId: PaymentType; amount: number }[] {
  const map = new Map<PaymentType, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    map.set(t.methodId, (map.get(t.methodId) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([methodId, amount]) => ({ methodId, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlyTrend(
  transactions: Transaction[],
  months = 6,
): { key: string; label: Date; income: number; expense: number }[] {
  const out: { key: string; label: Date; income: number; expense: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const tx = transactions.filter((t) => monthKey(new Date(t.date)) === key);
    const totals = totalsOf(tx);
    out.push({ key, label: d, income: totals.income, expense: totals.expense });
  }
  return out;
}

export function habitProgress(
  habits: Habit[],
  logs: HabitLog[],
  today: string = dateKey(),
): HabitWithProgress[] {
  return habits.map((habit) => {
    const value = logs.find((l) => l.habitId === habit.id && l.date === today)?.value ?? 0;
    const last7: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const v = logs.find((l) => l.habitId === habit.id && l.date === dateKey(d))?.value ?? 0;
      last7.push(v >= habit.targetPerDay);
    }
    return {
      ...habit,
      today: value,
      done: value >= habit.targetPerDay,
      streak: habitStreak(habit, logs, today),
      last7,
    };
  });
}

export function habitStreak(habit: Habit, logs: HabitLog[], today: string = dateKey()): number {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const key = dateKey(cursor);
    const v = logs.find((l) => l.habitId === habit.id && l.date === key)?.value ?? 0;
    const hit = v >= habit.targetPerDay;
    if (hit) {
      streak++;
    } else if (key !== today) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function isOverdue(dueAt?: string): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
}

export function missedTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done && isOverdue(t.dueAt))
    .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));
}

export function dueTodayTasks(tasks: Task[], key: string = dateKey()): Task[] {
  return tasks.filter((t) => !t.done && t.dueAt && dateKey(new Date(t.dueAt)) === key);
}

export function pendingTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done)
    .sort((a, b) => {
      if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function daysWithoutExpenseLog(
  transactions: Transaction[],
  window = 7,
): number {
  let count = 0;
  for (let i = 0; i < window; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    if (!transactions.some((t) => t.type === 'expense' && dateKey(new Date(t.date)) === key)) {
      count++;
    }
  }
  return count;
}

export interface BudgetStatus {
  budget: Budget;
  category: Category;
  spent: number;
  limit: number;
  ratio: number;
  state: 'ok' | 'warn' | 'over';
}

export function budgetStatus(
  budgets: Budget[],
  transactions: Transaction[],
  date: Date = new Date(),
): BudgetStatus[] {
  const monthTx = inMonth(transactions, date);
  return budgets
    .map((budget) => {
      const spent = monthTx
        .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      const ratio = budget.limit > 0 ? spent / budget.limit : 0;
      return {
        budget,
        category: CATEGORY_BY_ID[budget.categoryId] ?? CATEGORY_BY_ID.other_expense,
        spent,
        limit: budget.limit,
        ratio,
        state: ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok',
      } as BudgetStatus;
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export interface InvestmentTotals {
  invested: number;
  current: number;
  gain: number;
  gainPct: number;
}

export function investmentTotals(investments: Investment[]): InvestmentTotals {
  const invested = investments.reduce((sum, i) => sum + i.invested, 0);
  const current = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const gain = current - invested;
  return { invested, current, gain, gainPct: invested > 0 ? gain / invested : 0 };
}

export interface MonthSummary {
  key: string;
  date: Date;
  income: number;
  expense: number;
  saved: number;
  count: number;
}

export function monthsWithData(transactions: Transaction[]): MonthSummary[] {
  const map = new Map<string, MonthSummary>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = monthKey(d);
    const entry =
      map.get(key) ?? {
        key,
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        income: 0,
        expense: 0,
        saved: 0,
        count: 0,
      };
    if (t.type === 'income') entry.income += t.amount;
    else if (t.type === 'expense') entry.expense += t.amount;
    entry.count += 1;
    entry.saved = entry.income - entry.expense;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

export interface BillStatus {
  bill: Bill;
  period: string;
  dueDate: Date;
  paid: boolean;
  daysUntil: number;
}

export function billStatuses(bills: Bill[], date: Date = new Date()): BillStatus[] {
  const now = new Date(date);
  now.setHours(0, 0, 0, 0);

  return bills
    .map((bill) => {
      const created = new Date(bill.createdAt);
      let period = 'once';
      let dueDate = new Date(now);

      if (bill.frequency === 'monthly') {
        period = monthKey(now);
        const day = Math.min(bill.dueDay, daysInMonth(now));
        dueDate = new Date(now.getFullYear(), now.getMonth(), day);
      } else if (bill.frequency === 'weekly') {
        period = isoWeekKey(now);
        dueDate = startOfWeek(now);
        dueDate.setDate(dueDate.getDate() + bill.dueDay);
      } else if (bill.frequency === 'yearly') {
        period = String(now.getFullYear());
        const day = Math.min(bill.dueDay, daysInMonth(new Date(now.getFullYear(), created.getMonth(), 1)));
        dueDate = new Date(now.getFullYear(), created.getMonth(), day);
      } else {
        period = 'once';
        dueDate = new Date(created);
      }

      const paid = bill.paidPeriods.includes(period);
      const daysUntil = Math.round((dueDate.getTime() - now.getTime()) / 86400000);
      return { bill, period, dueDate, paid, daysUntil };
    })
    .sort((a, b) => Number(a.paid) - Number(b.paid) || a.daysUntil - b.daysUntil);
}

export interface DebtTotals {
  owedToMe: number;
  iOwe: number;
  net: number;
}

export function debtTotals(debts: Debt[]): DebtTotals {
  let owedToMe = 0;
  let iOwe = 0;
  for (const debt of debts) {
    const remaining = Math.max(0, debt.amount - debt.paid);
    if (debt.direction === 'owed_to_me') owedToMe += remaining;
    else iOwe += remaining;
  }
  return { owedToMe, iOwe, net: owedToMe - iOwe };
}

export function latestHealth(logs: HealthLog[]): HealthLog | null {
  if (logs.length === 0) return null;
  return [...logs].sort((a, b) => b.date.localeCompare(a.date))[0];
}

export function healthSeries(logs: HealthLog[], days = 14): HealthLog[] {
  const map = new Map(logs.map((l) => [l.date, l]));
  const out: HealthLog[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push(map.get(key) ?? { id: key, date: key });
  }
  return out;
}

export interface GoalProgress {
  goal: Goal;
  current: number;
  target: number;
  remaining: number;
  progress: number;
  daysLeft: number;
  monthsLeft: number;
  requiredMonthly: number;
  pace: number;
  onTrack: boolean;
  projectedDate: Date | null;
  done: boolean;
}

export function goalProgress(goal: Goal, now: Date = new Date()): GoalProgress {
  const financial = goal.type === 'financial';
  const deposited = goal.deposits.reduce((sum, d) => sum + d.amount, 0);
  const current = financial ? deposited : goal.currentCount;
  const target = financial ? goal.targetAmount : goal.targetCount;
  const remaining = Math.max(0, target - current);
  const progress = target > 0 ? Math.min(1, current / target) : 0;

  let daysLeft = 0;
  if (goal.deadline) {
    daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / 86400000);
  }
  const monthsLeft = Math.max(0, daysLeft / 30);
  const requiredMonthly = daysLeft > 0 ? remaining / monthsLeft : 0;

  // average monthly pace from the last 3 months of deposits
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  const recent = goal.deposits.filter((d) => new Date(d.date).getTime() >= threeMonthsAgo.getTime());
  const pace = financial ? recent.reduce((sum, d) => sum + d.amount, 0) / 3 : 0;

  const onTrack = financial ? (daysLeft > 0 ? pace >= requiredMonthly : remaining <= 0) : current >= target;
  const projectedDate =
    financial && pace > 0 && remaining > 0
      ? new Date(now.getTime() + (remaining / pace) * 30 * 86400000)
      : null;

  return {
    goal,
    current,
    target,
    remaining,
    progress,
    daysLeft,
    monthsLeft,
    requiredMonthly,
    pace,
    onTrack,
    projectedDate,
    done: remaining <= 0,
  };
}

export function goalsProgress(goals: Goal[], now: Date = new Date()): GoalProgress[] {
  return goals.map((g) => goalProgress(g, now));
}



