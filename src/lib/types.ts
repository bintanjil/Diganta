export type Language = 'en' | 'bn';

export type Currency = 'BDT';

export type ThemeMode = 'system' | 'light' | 'dark';

export type PaymentType = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card';

export type TransactionType = 'expense' | 'income' | 'transfer';

export type TransactionTag = 'personal' | 'family' | 'business';

export type SavingsType = 'dps' | 'fdr' | 'bank' | 'somiti' | 'cash' | 'other';

export type TaskCategory = 'work' | 'personal' | 'family';

export type Priority = 'low' | 'medium' | 'high';

export interface LocalizedText {
  en: string;
  bn: string;
}

export interface Category {
  id: string;
  label: LocalizedText;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface PaymentMethod {
  id: PaymentType;
  label: LocalizedText;
  short: string;
  color: string;
}

export interface User {
  name: string;
  language: Language;
  currency: Currency;
  monthlyIncome: number;
  methods: PaymentType[];
  themeMode?: ThemeMode;
  prayerEnabled?: boolean;
  prayerLat?: number;
  prayerLng?: number;
  prayerCity?: string;
  notificationsEnabled?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  methodId: PaymentType;
  date: string;
  note?: string;
  tag: TransactionTag;
  receiptUri?: string;
  memberId?: string;
}

export interface SavingsBucket {
  id: string;
  name: string;
  type: SavingsType;
  current: number;
  target?: number;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  dueAt?: string;
  priority: Priority;
  category: TaskCategory;
  done: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  unit: LocalizedText;
  targetPerDay: number;
  color: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  value: number;
}

export interface HabitWithProgress extends Habit {
  today: number;
  done: boolean;
  streak: number;
  last7: boolean[];
}

export type InvestmentKind =
  | 'stocks'
  | 'mutual_fund'
  | 'gold'
  | 'land'
  | 'fdr'
  | 'dps'
  | 'crypto'
  | 'other';

export interface Investment {
  id: string;
  name: string;
  kind: InvestmentKind;
  invested: number;
  currentValue: number;
  note?: string;
  date: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
}

export type BillFrequency = 'monthly' | 'weekly' | 'yearly' | 'once';

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  frequency: BillFrequency;
  categoryId?: string;
  methodId?: PaymentType;
  paidPeriods: string[];
  icon: string;
  createdAt: string;
}

export type DebtDirection = 'owed_to_me' | 'i_owe';

export interface Debt {
  id: string;
  name: string;
  direction: DebtDirection;
  amount: number;
  paid: number;
  dueDate?: string;
  note?: string;
  createdAt: string;
}

export interface HealthLog {
  id: string;
  date: string;
  weightKg?: number;
  water?: number;
  sleepHours?: number;
  calories?: number;
  steps?: number;
}

export interface RoutineBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  days: number[];
  color: string;
  icon: string;
}

export interface Member {
  id: string;
  name: string;
  color: string;
}

export type GoalType = 'financial' | 'life';

export interface GoalDeposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  icon: string;
  color: string;
  targetAmount: number;
  targetCount: number;
  currentCount: number;
  unit: LocalizedText;
  deadline?: string;
  linkedBucketId?: string;
  note?: string;
  createdAt: string;
  deposits: GoalDeposit[];
}

export interface BackupPayload {
  app: 'diganta';
  version: number;
  exportedAt: string;
  data: {
    user: User | null;
    transactions: Transaction[];
    buckets: SavingsBucket[];
    investments: Investment[];
    budgets: Budget[];
    bills: Bill[];
    debts: Debt[];
    healthLogs: HealthLog[];
    routine: RoutineBlock[];
    members: Member[];
    goals: Goal[];
    tasks: Task[];
    habits: Habit[];
    habitLogs: HabitLog[];
    guideDismissed: boolean;
  };
}

