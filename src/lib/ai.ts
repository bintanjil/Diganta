import {
  billStatuses,
  budgetStatus,
  categoryBreakdown,
  debtTotals,
  effectiveIncome,
  goalProgress,
  habitProgress,
  inMonth,
  investmentTotals,
  totalsOf,
} from './analytics';
import { CATEGORY_BY_ID } from './catalog';
import { dateKey, daysInMonth, formatMoney } from './format';
import { buildProfile, type UserProfile } from './profile';
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
  Task,
  Transaction,
  User,
} from './types';

export type AdviceTone = 'positive' | 'warning' | 'danger' | 'info';

export interface Advice {
  id: string;
  icon: string;
  tone: AdviceTone;
  title: LocalizedText;
  body: LocalizedText;
}

export interface AdvisorInput {
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  debts: Debt[];
  habits: Habit[];
  habitLogs: HabitLog[];
  buckets: SavingsBucket[];
  investments: Investment[];
  tasks: Task[];
  goals: Goal[];
}

export interface AdvisorResult {
  score: number;
  scoreLabel: LocalizedText;
  headline: LocalizedText;
  advice: Advice[];
  profile: UserProfile;
}

const L = (en: string, bn: string): LocalizedText => ({ en, bn });

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function analyze(input: AdvisorInput): AdvisorResult {
  const now = new Date();
  const monthTx = inMonth(input.transactions, now);
  const totals = totalsOf(monthTx);
  const income = effectiveIncome(input.user, input.transactions, now);
  const breakdown = categoryBreakdown(monthTx);
  const budgets = budgetStatus(input.budgets, input.transactions, now);
  const bills = billStatuses(input.bills, now);
  const debts = debtTotals(input.debts);
  const habits = habitProgress(input.habits, input.habitLogs);
  const invest = investmentTotals(input.investments);
  const savedBuckets = input.buckets.reduce((sum, b) => sum + b.current, 0);

  const advice: Advice[] = [];
  const profile = buildProfile(input);

  // 0. Learned profile suggestions (personalised savings & expense plan)
  for (let i = 0; i < profile.suggestions.length && i < 2; i++) {
    advice.push({
      id: `profile-${i}`,
      icon: 'user',
      tone: i === 0 ? 'info' : 'info',
      title: profile.title,
      body: profile.suggestions[i],
    });
  }

  // 1. Savings rate
  const savingsRate = income > 0 ? totals.balance / income : 0;
  if (income > 0) {
    if (savingsRate >= 0.2) {
      advice.push({
        id: 'savings-good',
        icon: '🏆',
        tone: 'positive',
        title: L('Great savings rate', 'দুর্দান্ত সঞ্চয় হার'),
        body: L(
          `You are saving ${Math.round(savingsRate * 100)}% of your income this month. Keep it up!`,
          `এই মাসে আপনি আয়ের ${Math.round(savingsRate * 100)}% সঞ্চয় করছেন। চালিয়ে যান!`,
        ),
      });
    } else if (savingsRate >= 0) {
      const target = Math.round(income * 0.2);
      advice.push({
        id: 'savings-low',
        icon: '🎯',
        tone: 'warning',
        title: L('Boost your savings', 'সঞ্চয় বাড়ান'),
        body: L(
          `Your savings rate is ${Math.round(savingsRate * 100)}%. Try to reach 20% (${formatMoney(target)}).`,
          `আপনার সঞ্চয়ের হার ${Math.round(savingsRate * 100)}%। ২০% (${formatMoney(target)}) লক্ষ্য করুন।`,
        ),
      });
    } else {
      advice.push({
        id: 'savings-negative',
        icon: '🚨',
        tone: 'danger',
        title: L('Spending more than you earn', 'আয়ের বেশি খরচ'),
        body: L(
          `You have spent ${formatMoney(-totals.balance)} more than your income this month.`,
          `এই মাসে আয়ের চেয়ে ${formatMoney(-totals.balance)} বেশি খরচ হয়েছে।`,
        ),
      });
    }
  }

  // 2. Month-end projection
  const day = now.getDate();
  const dim = daysInMonth(now);
  if (totals.expense > 0 && day >= 3) {
    const projected = Math.round((totals.expense / day) * dim);
    if (income > 0 && projected > income) {
      advice.push({
        id: 'projection',
        icon: '📈',
        tone: 'danger',
        title: L('On pace to overspend', 'সীমা ছাড়াতে পারে'),
        body: L(
          `At this pace you will spend about ${formatMoney(projected)} by month end — ${formatMoney(projected - income)} over your income.`,
          `এই গতিতে মাস শেষে খরচ হবে প্রায় ${formatMoney(projected)} — আয়ের চেয়ে ${formatMoney(projected - income)} বেশি।`,
        ),
      });
    }
  }

  // 3. Top category concentration
  if (breakdown.length > 0 && totals.expense > 0) {
    const top = breakdown[0];
    const share = Math.round(top.share * 100);
    if (share >= 30) {
      const saveByCutting = Math.round(top.amount * 0.1);
      advice.push({
        id: `top-${top.category.id}`,
        icon: top.category.icon,
        tone: 'info',
        title: L(`${top.category.label.en} is your biggest cost`, `${top.category.label.bn} সবচেয়ে বেশি খরচ`),
        body: L(
          `${top.category.label.en} is ${share}% of your spending. Cutting it by 10% saves ${formatMoney(saveByCutting)} a month.`,
          `${top.category.label.bn} খরচের ${share}%। ১০% কমালে মাসে ${formatMoney(saveByCutting)} বাঁচবে।`,
        ),
      });
    }
  }

  // 4. Category spike vs last month
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevBreakdown = categoryBreakdown(inMonth(input.transactions, prev));
  for (const slice of breakdown.slice(0, 4)) {
    const before = prevBreakdown.find((p) => p.category.id === slice.category.id)?.amount ?? 0;
    if (before > 0 && slice.amount > before * 1.3) {
      const pct = Math.round(((slice.amount - before) / before) * 100);
      advice.push({
        id: `spike-${slice.category.id}`,
        icon: slice.category.icon,
        tone: 'warning',
        title: L(`${slice.category.label.en} is up`, `${slice.category.label.bn} বেড়েছে`),
        body: L(
          `${slice.category.label.en} rose ${pct}% versus last month.`,
          `গত মাসের তুলনায় ${slice.category.label.bn} ${pct}% বেড়েছে।`,
        ),
      });
      break;
    }
  }

  // 5. Budgets
  const overBudget = budgets.filter((b) => b.state === 'over');
  const nearBudget = budgets.filter((b) => b.state === 'warn');
  if (overBudget.length > 0) {
    const names = overBudget.map((b) => b.category.label).slice(0, 2);
    advice.push({
      id: 'budget-over',
      icon: '🔴',
      tone: 'danger',
      title: L('Over budget', 'বাজেট ছাড়িয়েছে'),
      body: L(
        `${overBudget.length} budget(s) exceeded: ${names.map((n) => n.en).join(', ')}.`,
        `${overBudget.length}টি বাজেট ছাড়িয়েছে: ${names.map((n) => n.bn).join(', ')}।`,
      ),
    });
  } else if (nearBudget.length > 0) {
    advice.push({
      id: 'budget-near',
      icon: '🟡',
      tone: 'warning',
      title: L('Approaching a limit', 'সীমার কাছে'),
      body: L(
        `You are close to the limit on ${nearBudget[0].category.label.en}.`,
        `${nearBudget[0].category.label.bn}-এর সীমার কাছাকাছি আছেন।`,
      ),
    });
  }

  // 6. Bills due
  const dueSoon = bills.filter((b) => !b.paid && b.daysUntil <= 3);
  if (dueSoon.length > 0) {
    const first = dueSoon[0];
    advice.push({
      id: 'bill-due',
      icon: '🧾',
      tone: first.daysUntil < 0 ? 'danger' : 'warning',
      title: L('A bill needs attention', 'একটি বিল বাকি'),
      body: L(
        `${first.bill.title} of ${formatMoney(first.bill.amount)} is ${first.daysUntil < 0 ? 'overdue' : `due in ${first.daysUntil} day(s)`}.`,
        `${first.bill.title} ${formatMoney(first.bill.amount)} ${first.daysUntil < 0 ? 'সময় পার হয়েছে' : `${first.daysUntil} দিনে বাকি`}।`,
      ),
    });
  }

  // 7. Debt
  if (debts.iOwe > 0) {
    advice.push({
      id: 'debt-owe',
      icon: '🤝',
      tone: 'info',
      title: L('You have debts to repay', 'পরিশোধযোগ্য ঋণ আছে'),
      body: L(
        `You still owe ${formatMoney(debts.iOwe)} in total.`,
        `মোট ${formatMoney(debts.iOwe)} ঋণ বাকি আছে।`,
      ),
    });
  }

  // 8. Habit nudge
  const streakRisk = habits.find((h) => !h.done && h.streak >= 2);
  if (streakRisk) {
    advice.push({
      id: 'habit-streak',
      icon: streakRisk.icon,
      tone: 'warning',
      title: L('Protect your streak', 'ধারা ধরে রাখুন'),
      body: L(
        `${streakRisk.name} has a ${streakRisk.streak}-day streak — log it today.`,
        `${streakRisk.name}-এর ${streakRisk.streak} দিনের ধারা — আজ লগ করুন।`,
      ),
    });
  }

  // 9. Logging consistency
  let missingDays = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    if (!input.transactions.some((t) => t.type === 'expense' && dateKey(new Date(t.date)) === key)) {
      missingDays++;
    }
  }
  if (missingDays >= 2 && input.transactions.length > 0) {
    advice.push({
      id: 'log-consistency',
      icon: '📝',
      tone: 'info',
      title: L('Keep your records complete', 'হিসাব পূর্ণ রাখুন'),
      body: L(
        `You have not logged expenses on ${missingDays} of the last 3 days.`,
        `শেষ ৩ দিনের ${missingDays} দিনে খরচ লেখা হয়নি।`,
      ),
    });
  }

  // 10. Recurring / subscription detection
  const recurring = detectRecurring(input.transactions);
  if (recurring) {
    advice.push({
      id: 'subscription',
      icon: '🔁',
      tone: 'info',
      title: L('Possible recurring charge', 'সম্ভাব্য নিয়মিত খরচ'),
      body: L(
        `You have paid about ${formatMoney(recurring.amount)} to "${recurring.label}" in multiple months.`,
        `"${recurring.label}"-এ কয়েক মাসে প্রায় ${formatMoney(recurring.amount)} দিয়েছেন।`,
      ),
    });
  }

  // 11. Positive: under budget
  if (budgets.length > 0 && overBudget.length === 0 && nearBudget.length === 0) {
    advice.push({
      id: 'budget-clear',
      icon: '✅',
      tone: 'positive',
      title: L('All budgets on track', 'সব বাজেট ঠিক আছে'),
      body: L('Every category is within its limit this month.', 'এই মাসে সব ক্যাটাগরি সীমার মধ্যে আছে।'),
    });
  }

  // 12. Investing
  if (invest.current > 0 && invest.gain > 0) {
    advice.push({
      id: 'invest-gain',
      icon: '📊',
      tone: 'positive',
      title: L('Investments are growing', 'বিনিয়োগ বাড়ছে'),
      body: L(
        `Your portfolio is up ${formatMoney(invest.gain)} (${Math.round(invest.gainPct * 100)}%).`,
        `আপনার বিনিয়োগ ${formatMoney(invest.gain)} (${Math.round(invest.gainPct * 100)}%) বেড়েছে।`,
      ),
    });
  }

  // 13. Goals
  for (const goal of (input.goals ?? []).slice(0, 3)) {
    const p = goalProgress(goal, now);
    if (p.done) {
      advice.push({
        id: `goal-done-${goal.id}`,
        icon: goal.icon,
        tone: 'positive',
        title: L(`Goal reached: ${goal.title}`, `লক্ষ্য পূরণ: ${goal.title}`),
        body: L(
          `Congratulations! You completed ${goal.title}.`,
          `অভিনন্দন! আপনি ${goal.title} সম্পন্ন করেছেন।`,
        ),
      });
      continue;
    }
    if (goal.deadline && p.daysLeft > 0) {
      if (p.onTrack) {
        advice.push({
          id: `goal-track-${goal.id}`,
          icon: goal.icon,
          tone: 'positive',
          title: L(`On track: ${goal.title}`, `সঠিক পথে: ${goal.title}`),
          body: L(
            `Keep saving ${formatMoney(Math.round(p.pace))}/month and you'll reach it.`,
            `মাসে ${formatMoney(Math.round(p.pace))} সঞ্চয় চালিয়ে গেলে পৌঁছে যাবেন।`,
          ),
        });
      } else {
        const gap = Math.max(0, p.requiredMonthly - p.pace);
        advice.push({
          id: `goal-behind-${goal.id}`,
          icon: goal.icon,
          tone: p.requiredMonthly > p.pace * 2 ? 'danger' : 'warning',
          title: L(`Behind on ${goal.title}`, `${goal.title}-এ পিছিয়ে`),
          body: L(
            `You need ${formatMoney(Math.round(p.requiredMonthly))}/month but save about ${formatMoney(Math.round(p.pace))}. Increase by ${formatMoney(Math.round(gap))} to finish in time.`,
            `মাসে ${formatMoney(Math.round(p.requiredMonthly))} দরকার, কিন্তু সঞ্চয় প্রায় ${formatMoney(Math.round(p.pace))}। সময়মতো শেষ করতে ${formatMoney(Math.round(gap))} বাড়ান।`,
          ),
        });
      }
    }
  }

  // Health score
  let score = 50;
  score += clamp(savingsRate * 100, -30, 30);
  score += overBudget.length > 0 ? -12 : nearBudget.length > 0 ? -4 : 10;
  score += dueSoon.length > 0 ? -6 : 6;
  score += Math.min(habits.filter((h) => h.done).length * 3, 12);
  score += debts.net >= 0 ? 6 : -6;
  score += invest.current > 0 ? 6 : 0;
  score += savedBuckets > 0 ? 4 : 0;
  score = Math.round(clamp(score));

  const scoreLabel: LocalizedText =
    score >= 75
      ? L('Excellent', 'চমৎকার')
      : score >= 55
        ? L('Good', 'ভালো')
        : score >= 35
          ? L('Needs work', 'উন্নতি দরকার')
          : L('At risk', 'ঝুঁকিতে');

  const headline =
    advice[0]?.body ??
    L('Start adding entries to get personalised advice.', 'ব্যক্তিগত পরামর্শ পেতে এন্ট্রি যোগ করুন।');

  return { score, scoreLabel, headline, advice, profile };
}

function detectRecurring(
  transactions: Transaction[],
): { label: string; amount: number } | null {
  const map = new Map<string, { amount: number; months: Set<string> }>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const label = CATEGORY_BY_ID[t.categoryId]?.label.en ?? t.note ?? 'Expense';
    const key = `${label}:${Math.round(t.amount / 10) * 10}`;
    const entry = map.get(key) ?? { amount: t.amount, months: new Set<string>() };
    entry.months.add(t.date.slice(0, 7));
    map.set(key, entry);
  }
  for (const [key, entry] of map) {
    if (entry.months.size >= 2) {
      return { label: key.split(':')[0], amount: entry.amount };
    }
  }
  return null;
}
