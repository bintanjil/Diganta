import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  BackupPayload,
  Bill,
  Budget,
  Debt,
  Goal,
  GoalDeposit,
  Habit,
  HabitLog,
  HealthLog,
  Investment,
  Language,
  Member,
  RoutineBlock,
  SavingsBucket,
  Task,
  Transaction,
  User,
} from './types';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface DataState {
  guideDismissed: boolean;
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
}

interface Actions {
  setHydrated: (value: boolean) => void;
  dismissGuide: () => void;
  completeOnboarding: (user: User) => void;
  setLanguage: (lang: Language) => void;
  updateUser: (patch: Partial<User>) => void;

  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addBucket: (bucket: Omit<SavingsBucket, 'id'>) => void;
  updateBucket: (id: string, patch: Partial<SavingsBucket>) => void;
  deleteBucket: (id: string) => void;

  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, patch: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;

  setBudget: (categoryId: string, limit: number) => void;
  deleteBudget: (id: string) => void;

  addBill: (bill: Omit<Bill, 'id' | 'paidPeriods' | 'createdAt'>) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  toggleBillPaid: (id: string, period: string) => void;
  deleteBill: (id: string) => void;

  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  payDebt: (id: string, amount: number) => void;
  deleteDebt: (id: string) => void;

  upsertHealthLog: (date: string, patch: Partial<HealthLog>) => void;
  deleteHealthLog: (id: string) => void;

  addRoutine: (block: Omit<RoutineBlock, 'id'>) => void;
  deleteRoutine: (id: string) => void;

  addMember: (member: Omit<Member, 'id'>) => void;
  deleteMember: (id: string) => void;

  addGoal: (
    goal: Omit<Goal, 'id' | 'createdAt' | 'deposits'> & { deposits?: Omit<GoalDeposit, 'id'>[] },
  ) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalDeposit: (goalId: string, amount: number, note?: string) => void;
  deleteGoalDeposit: (goalId: string, depositId: string) => void;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'done'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  deleteHabit: (id: string) => void;
  setHabitValue: (habitId: string, date: string, value: number) => void;
  incrementHabit: (habitId: string, date: string, delta: number) => void;

  importData: (payload: BackupPayload['data']) => void;
  resetData: () => void;
}

export type AppState = DataState & Actions & { hydrated: boolean };

const emptyData: DataState = {
  guideDismissed: false,
  user: null,
  transactions: [],
  buckets: [],
  investments: [],
  budgets: [],
  bills: [],
  debts: [],
  healthLogs: [],
  routine: [],
  members: [],
  goals: [],
  tasks: [],
  habits: [],
  habitLogs: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...emptyData,

      setHydrated: (value) => set({ hydrated: value }),
      dismissGuide: () => set({ guideDismissed: true }),

      completeOnboarding: (user) => set({ user }),

      setLanguage: (lang) =>
        set((state) => (state.user ? { user: { ...state.user, language: lang } } : {})),

      updateUser: (patch) =>
        set((state) => (state.user ? { user: { ...state.user, ...patch } } : {})),

      addTransaction: (tx) =>
        set((state) => ({ transactions: [{ ...tx, id: uid('tx') }, ...state.transactions] })),

      updateTransaction: (id, patch) =>
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      addBucket: (bucket) =>
        set((state) => ({ buckets: [...state.buckets, { ...bucket, id: uid('bk') }] })),

      updateBucket: (id, patch) =>
        set((state) => ({
          buckets: state.buckets.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      deleteBucket: (id) =>
        set((state) => ({ buckets: state.buckets.filter((b) => b.id !== id) })),

      addInvestment: (investment) =>
        set((state) => ({ investments: [{ ...investment, id: uid('inv') }, ...state.investments] })),

      updateInvestment: (id, patch) =>
        set((state) => ({
          investments: state.investments.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      deleteInvestment: (id) =>
        set((state) => ({ investments: state.investments.filter((i) => i.id !== id) })),

      setBudget: (categoryId, limit) =>
        set((state) => {
          const existing = state.budgets.find((b) => b.categoryId === categoryId);
          if (existing) {
            return { budgets: state.budgets.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b)) };
          }
          return { budgets: [...state.budgets, { id: uid('budget'), categoryId, limit }] };
        }),

      deleteBudget: (id) =>
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

      addBill: (bill) =>
        set((state) => ({
          bills: [...state.bills, { ...bill, id: uid('bill'), paidPeriods: [], createdAt: new Date().toISOString() }],
        })),

      updateBill: (id, patch) =>
        set((state) => ({ bills: state.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),

      toggleBillPaid: (id, period) =>
        set((state) => ({
          bills: state.bills.map((b) => {
            if (b.id !== id) return b;
            const paid = b.paidPeriods.includes(period)
              ? b.paidPeriods.filter((p) => p !== period)
              : [...b.paidPeriods, period];
            return { ...b, paidPeriods: paid };
          }),
        })),

      deleteBill: (id) =>
        set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),

      addDebt: (debt) =>
        set((state) => ({
          debts: [{ ...debt, id: uid('debt'), createdAt: new Date().toISOString() }, ...state.debts],
        })),

      updateDebt: (id, patch) =>
        set((state) => ({ debts: state.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      payDebt: (id, amount) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, paid: Math.min(d.amount, Math.max(0, d.paid + amount)) } : d,
          ),
        })),

      deleteDebt: (id) =>
        set((state) => ({ debts: state.debts.filter((d) => d.id !== id) })),

      upsertHealthLog: (date, patch) =>
        set((state) => {
          const existing = state.healthLogs.find((h) => h.date === date);
          if (existing) {
            return {
              healthLogs: state.healthLogs.map((h) => (h.date === date ? { ...h, ...patch } : h)),
            };
          }
          return { healthLogs: [...state.healthLogs, { id: uid('health'), date, ...patch }] };
        }),

      deleteHealthLog: (id) =>
        set((state) => ({ healthLogs: state.healthLogs.filter((h) => h.id !== id) })),

      addRoutine: (block) =>
        set((state) => ({ routine: [...state.routine, { ...block, id: uid('routine') }] })),

      deleteRoutine: (id) =>
        set((state) => ({ routine: state.routine.filter((r) => r.id !== id) })),

      addMember: (member) =>
        set((state) => ({ members: [...state.members, { ...member, id: uid('member') }] })),

      deleteMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
          transactions: state.transactions.map((t) =>
            t.memberId === id ? { ...t, memberId: undefined } : t,
          ),
        })),

      addGoal: (goal) =>
        set((state) => ({
          goals: [
            ...state.goals,
            {
              ...goal,
              id: uid('goal'),
              createdAt: new Date().toISOString(),
              deposits: (goal.deposits ?? []).map((d) => ({ ...d, id: uid('dep') })),
            },
          ],
        })),

      updateGoal: (id, patch) =>
        set((state) => ({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      deleteGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      addGoalDeposit: (goalId, amount, note) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  deposits: [
                    ...g.deposits,
                    { id: uid('dep'), amount, date: new Date().toISOString(), note },
                  ],
                }
              : g,
          ),
        })),

      deleteGoalDeposit: (goalId, depositId) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId
              ? { ...g, deposits: g.deposits.filter((d) => d.id !== depositId) }
              : g,
          ),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [
            { ...task, id: uid('task'), createdAt: new Date().toISOString(), done: false },
            ...state.tasks,
          ],
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      addHabit: (habit) =>
        set((state) => ({
          habits: [...state.habits, { ...habit, id: uid('habit'), createdAt: new Date().toISOString() }],
        })),

      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitLogs: state.habitLogs.filter((l) => l.habitId !== id),
        })),

      setHabitValue: (habitId, date, value) =>
        set((state) => {
          const others = state.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date));
          if (value <= 0) return { habitLogs: others };
          return { habitLogs: [...others, { id: uid('log'), habitId, date, value }] };
        }),

      incrementHabit: (habitId, date, delta) => {
        const existing = get().habitLogs.find((l) => l.habitId === habitId && l.date === date);
        const next = Math.max(0, (existing?.value ?? 0) + delta);
        get().setHabitValue(habitId, date, next);
      },

      importData: (payload) =>
        set({
          user: payload.user,
          transactions: payload.transactions ?? [],
          buckets: payload.buckets ?? [],
          investments: payload.investments ?? [],
          budgets: payload.budgets ?? [],
          bills: payload.bills ?? [],
          debts: payload.debts ?? [],
          healthLogs: payload.healthLogs ?? [],
          routine: payload.routine ?? [],
          members: payload.members ?? [],
          goals: payload.goals ?? [],
          tasks: payload.tasks ?? [],
          habits: payload.habits ?? [],
          habitLogs: payload.habitLogs ?? [],
          guideDismissed: payload.guideDismissed ?? false,
        }),

      resetData: () => set({ ...emptyData }),
    }),
    {
      // Storage key intentionally kept as the original id so existing local data survives the rename.
      name: 'jibon-store-v1',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): DataState => ({
        guideDismissed: state.guideDismissed,
        user: state.user,
        transactions: state.transactions,
        buckets: state.buckets,
        investments: state.investments,
        budgets: state.budgets,
        bills: state.bills,
        debts: state.debts,
        healthLogs: state.healthLogs,
        routine: state.routine,
        members: state.members,
        goals: state.goals,
        tasks: state.tasks,
        habits: state.habits,
        habitLogs: state.habitLogs,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<DataState>;
        return { ...emptyData, ...state } as DataState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DataState>;
        return {
          ...current,
          ...p,
          user: p.user ?? current.user,
          transactions: p.transactions ?? [],
          buckets: p.buckets ?? [],
          investments: p.investments ?? [],
          budgets: p.budgets ?? [],
          bills: p.bills ?? [],
          debts: p.debts ?? [],
          healthLogs: p.healthLogs ?? [],
          routine: p.routine ?? [],
          members: p.members ?? [],
          goals: p.goals ?? [],
          tasks: p.tasks ?? [],
          habits: p.habits ?? [],
          habitLogs: p.habitLogs ?? [],
          guideDismissed: p.guideDismissed ?? false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const selectOnboarded = (state: AppState) => state.user !== null;
export const selectLanguage = (state: AppState): Language => state.user?.language ?? 'en';
