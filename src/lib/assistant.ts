import {
  billStatuses,
  budgetStatus,
  categoryBreakdown,
  debtTotals,
  goalProgress,
  habitProgress,
  inMonth,
  investmentTotals,
  monthlyTrend,
  onDay,
  totalsOf,
} from './analytics';
import { ALL_CATEGORIES } from './catalog';
import { dateKey, daysInMonth, formatMoney, monthKey } from './format';
import type {
  Bill,
  Budget,
  Debt,
  Goal,
  Habit,
  HabitLog,
  Investment,
  LocalizedText,
  SavingsBucket,
  Transaction,
  User,
} from './types';

export interface AssistantContext {
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  debts: Debt[];
  goals: Goal[];
  habits: Habit[];
  habitLogs: HabitLog[];
  buckets: SavingsBucket[];
  investments: Investment[];
}

type Scope = 'today' | 'month' | 'lastMonth' | 'year' | 'all';

const L = (en: string, bn: string): LocalizedText => ({ en, bn });

function scopeOf(q: string): Scope {
  if (q.includes('today') || q.includes('আজ')) return 'today';
  if (q.includes('last month') || q.includes('গত মাস')) return 'lastMonth';
  if (q.includes('year') || q.includes('বছর')) return 'year';
  if (q.includes('all') || q.includes('lifetime') || q.includes('সর্বকালীন')) return 'all';
  return 'month';
}

function transactionsFor(transactions: Transaction[], scope: Scope): Transaction[] {
  const now = new Date();
  if (scope === 'today') return onDay(transactions, dateKey());
  if (scope === 'lastMonth') return inMonth(transactions, new Date(now.getFullYear(), now.getMonth() - 1, 1));
  if (scope === 'year') return transactions.filter((t) => new Date(t.date).getFullYear() === now.getFullYear());
  if (scope === 'all') return transactions;
  return inMonth(transactions, now);
}

function findCategory(q: string) {
  return ALL_CATEGORIES.find((c) => q.includes(c.label.en.toLowerCase()) || q.includes(c.label.bn));
}

export function answer(question: string, ctx: AssistantContext): LocalizedText {
  const q = question.toLowerCase();
  const scope = scopeOf(q);
  const scoped = transactionsFor(ctx.transactions, scope);
  const totals = totalsOf(scoped);
  const scopeLabel: LocalizedText =
    scope === 'today'
      ? L('today', 'আজ')
      : scope === 'lastMonth'
        ? L('last month', 'গত মাসে')
        : scope === 'year'
          ? L('this year', 'এই বছর')
          : scope === 'all'
            ? L('all time', 'সর্বকালীন')
            : L('this month', 'এই মাসে');

  // Category-specific question
  const category = findCategory(q);
  if (category) {
    const amount = scoped
      .filter((t) => t.type === 'expense' && t.categoryId === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
    if (amount === 0) {
      return L(
        `You did not spend anything on ${category.label.en} ${scopeLabel.en}.`,
        `${scopeLabel.bn} ${category.label.bn}-এ কোনো খরচ হয়নি।`,
      );
    }
    return L(
      `You spent ${formatMoney(amount)} on ${category.label.en} ${scopeLabel.en}.`,
      `${scopeLabel.bn} ${category.label.bn}-এ ${formatMoney(amount)} খরচ হয়েছে।`,
    );
  }

  // Budgets
  if (q.includes('budget') || q.includes('বাজেট')) {
    const statuses = budgetStatus(ctx.budgets, ctx.transactions);
    if (statuses.length === 0) return L('You have not set any budgets yet.', 'আপনি এখনো কোনো বাজেট ঠিক করেননি।');
    const over = statuses.filter((s) => s.state === 'over');
    const near = statuses.filter((s) => s.state === 'warn');
    if (over.length > 0) {
      return L(
        `${over.length} budget(s) are over the limit, including ${over[0].category.label.en}.`,
        `${over.length}টি বাজেট সীমা ছাড়িয়েছে, যার মধ্যে ${over[0].category.label.bn}।`,
      );
    }
    if (near.length > 0) {
      return L(
        `You are close to the limit on ${near[0].category.label.en}.`,
        `${near[0].category.label.bn}-এর সীমার কাছাকাছি আছেন।`,
      );
    }
    return L('All your budgets are on track.', 'আপনার সব বাজেট ঠিক আছে।');
  }

  // Goals
  if (q.includes('goal') || q.includes('লক্ষ্য') || q.includes('target')) {
    if (ctx.goals.length === 0) return L('You have no goals yet. Add one from the Wealth tab.', 'এখনো কোনো লক্ষ্য নেই। সম্পদ ট্যাব থেকে যোগ করুন।');
    const first = ctx.goals[0];
    const p = goalProgress(first);
    return L(
      `${first.title}: ${Math.round(p.progress * 100)}% done. Save ${formatMoney(Math.round(p.requiredMonthly))}/month to finish in time.`,
      `${first.title}: ${Math.round(p.progress * 100)}% সম্পন্ন। সময়মতো শেষ করতে মাসে ${formatMoney(Math.round(p.requiredMonthly))} সঞ্চয় করুন।`,
    );
  }

  // Bills
  if (q.includes('bill') || q.includes('বিল')) {
    const statuses = billStatuses(ctx.bills).filter((s) => !s.paid);
    if (statuses.length === 0) return L('No bills are pending.', 'কোনো বিল বাকি নেই।');
    const next = statuses[0];
    return L(
      `${statuses.length} bill(s) pending. Next: ${next.bill.title} (${formatMoney(next.bill.amount)}) in ${next.daysUntil} day(s).`,
      `${statuses.length}টি বিল বাকি। পরবর্তী: ${next.bill.title} (${formatMoney(next.bill.amount)}) ${next.daysUntil} দিনে।`,
    );
  }

  // Debts
  if (q.includes('debt') || q.includes('loan') || q.includes('ঋণ')) {
    const d = debtTotals(ctx.debts);
    return L(
      `You are owed ${formatMoney(d.owedToMe)} and you owe ${formatMoney(d.iOwe)}.`,
      `আপনি ${formatMoney(d.owedToMe)} পাবেন এবং ${formatMoney(d.iOwe)} দিতে হবে।`,
    );
  }

  // Savings / income
  if (q.includes('save') || q.includes('saving') || q.includes('সঞ্চয়')) {
    const saved = totals.income - totals.expense;
    const rate = totals.income > 0 ? Math.round((saved / totals.income) * 100) : 0;
    return L(
      `You saved ${formatMoney(saved)} ${scopeLabel.en} (${rate}% of income).`,
      `${scopeLabel.bn} আপনি ${formatMoney(saved)} সঞ্চয় করেছেন (আয়ের ${rate}%)।`,
    );
  }
  if (q.includes('income') || q.includes('earn') || q.includes('আয়')) {
    return L(
      `Your income ${scopeLabel.en} was ${formatMoney(totals.income)}.`,
      `${scopeLabel.bn} আপনার আয় ছিল ${formatMoney(totals.income)}।`,
    );
  }

  // Forecast
  if (q.includes('forecast') || q.includes('predict') || q.includes('ভবিষ্যত')) {
    const now = new Date();
    const monthTx = inMonth(ctx.transactions, now);
    const spent = totalsOf(monthTx).expense;
    const day = now.getDate();
    const projected = day > 0 ? Math.round((spent / day) * daysInMonth(now)) : 0;
    return L(
      `At your current pace you will spend about ${formatMoney(projected)} by month end.`,
      `এই গতিতে মাস শেষে খরচ হবে প্রায় ${formatMoney(projected)}।`,
    );
  }

  // Top category
  if (q.includes('top') || q.includes('most') || q.includes('biggest') || q.includes('সবচেয়ে')) {
    const breakdown = categoryBreakdown(inMonth(ctx.transactions, new Date()));
    if (breakdown.length === 0) return L('No expenses recorded this month yet.', 'এই মাসে এখনো কোনো খরচ নেই।');
    return L(
      `Your biggest expense this month is ${breakdown[0].category.label.en} at ${formatMoney(breakdown[0].amount)}.`,
      `এই মাসে সবচেয়ে বেশি খরচ ${breakdown[0].category.label.bn}-এ, ${formatMoney(breakdown[0].amount)}।`,
    );
  }

  // Net worth
  if (q.includes('net worth') || q.includes('wealth') || q.includes('সম্পদ')) {
    const saved = ctx.buckets.reduce((sum, b) => sum + b.current, 0);
    const invest = investmentTotals(ctx.investments);
    return L(
      `Your net worth is about ${formatMoney(saved + invest.current)}.`,
      `আপনার নিট সম্পদ প্রায় ${formatMoney(saved + invest.current)}।`,
    );
  }

  // Habits
  if (q.includes('habit') || q.includes('অভ্যাস')) {
    const progress = habitProgress(ctx.habits, ctx.habitLogs);
    const done = progress.filter((h) => h.done).length;
    return L(
      `You completed ${done} of ${progress.length} habits today.`,
      `আজ ${progress.length}টির মধ্যে ${done}টি অভব্য সম্পন্ন করেছেন।`,
    );
  }

  // Default: spending summary
  const trend = monthlyTrend(ctx.transactions, 2);
  const prev = trend[0]?.expense ?? 0;
  const change = prev > 0 ? Math.round(((totals.expense - prev) / prev) * 100) : 0;
  return L(
    `You spent ${formatMoney(totals.expense)} ${scopeLabel.en} and earned ${formatMoney(totals.income)}.${prev > 0 ? ` That is ${Math.abs(change)}% ${change >= 0 ? 'more' : 'less'} than last month.` : ''}`,
    `${scopeLabel.bn} আপনার খরচ ${formatMoney(totals.expense)} এবং আয় ${formatMoney(totals.income)}।${prev > 0 ? ` গত মাসের চেয়ে ${Math.abs(change)}% ${change >= 0 ? 'বেশি' : 'কম'}।` : ''}`,
  );
}

export function suggestedQuestions(): LocalizedText[] {
  return [
    L('How much did I spend this month?', 'এই মাসে কত খরচ করেছি?'),
    L('What is my biggest expense?', 'আমার সবচেয়ে বড় খরচ কী?'),
    L('Am I on track with my goals?', 'আমি কি লক্ষ্যে সঠিক পথে আছি?'),
    L('How much did I save?', 'আমি কত সঞ্চয় করেছি?'),
    L('Any bills due?', 'কোনো বিল বাকি আছে?'),
    L('Forecast my spending', 'আমার খরচের পূর্বাভাস'),
  ];
}

export function monthLabelFor(key: string): string {
  return monthKey(new Date(`${key}-01`));
}
