import {
  budgetStatus,
  categoryBreakdown,
  effectiveIncome,
  habitProgress,
  inMonth,
  monthlyTrend,
  totalsOf,
} from './analytics';
import { formatMoney } from './format';
import type {
  Bill,
  Budget,
  Habit,
  HabitLog,
  LocalizedText,
  Transaction,
  User,
} from './types';

export type ProfileType = 'new' | 'saver' | 'balanced' | 'spender' | 'struggler' | 'rising';

export interface ProfileTrait {
  key: string;
  label: LocalizedText;
  value: number;
}

export interface UserProfile {
  type: ProfileType;
  title: LocalizedText;
  description: LocalizedText;
  traits: ProfileTrait[];
  income: number;
  savingsTarget: number;
  savingsCapacity: number;
  suggestions: LocalizedText[];
}

export interface ProfileInput {
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  habits: Habit[];
  habitLogs: HabitLog[];
}

const L = (en: string, bn: string): LocalizedText => ({ en, bn });
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function buildProfile(input: ProfileInput): UserProfile {
  const now = new Date();
  const transactions = input.transactions ?? [];
  const budgetsIn = input.budgets ?? [];
  const habitsIn = input.habits ?? [];
  const habitLogsIn = input.habitLogs ?? [];

  const monthTx = inMonth(transactions, now);
  const totals = totalsOf(monthTx);
  const income = effectiveIncome(input.user, transactions, now);
  const expenses = transactions.filter((t) => t.type === 'expense');

  const trend = monthlyTrend(transactions, 3);
  const avgExpense =
    trend.reduce((sum, m) => sum + m.expense, 0) / Math.max(1, trend.filter((m) => m.expense > 0).length || 1);
  const lastMonth = trend[trend.length - 2]?.expense ?? 0;
  const savingsRate = income > 0 ? (income - avgExpense) / income : 0;

  const budgets = budgetStatus(budgetsIn, transactions, now);
  const overCount = budgets.filter((b) => b.state === 'over').length;
  const nearCount = budgets.filter((b) => b.state === 'warn').length;

  const breakdown = categoryBreakdown(monthTx);
  const top = breakdown[0];

  // logging consistency over last 14 days
  let loggedDays = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (expenses.some((t) => t.date.slice(0, 10) === key)) loggedDays++;
  }
  const consistency = clamp((loggedDays / 14) * 100);

  const habits = habitProgress(habitsIn, habitLogsIn);
  const habitDone = habits.length > 0 ? habits.filter((h) => h.done).length / habits.length : 0;

  // traits
  const traits: ProfileTrait[] = [
    { key: 'saving', label: L('Saving discipline', 'সঞ্চয় শৃঙ্খলা'), value: clamp(50 + savingsRate * 200) },
    { key: 'budget', label: L('Budget control', 'বাজেট নিয়ন্ত্রণ'), value: clamp(100 - overCount * 30 - nearCount * 12) },
    { key: 'consistency', label: L('Tracking habit', 'হিসাব রাখার অভ্যাস'), value: consistency },
    { key: 'focus', label: L('Spending focus', 'খরচের কেন্দ্র'), value: clamp(top ? top.share * 180 : 20) },
  ];

  // classify
  let type: ProfileType = 'balanced';
  if (expenses.length < 8) type = 'new';
  else if (savingsRate >= 0.2 && overCount === 0) type = 'saver';
  else if (savingsRate < 0.05 || overCount >= 2) type = 'spender';
  else if (lastMonth > 0 && totals.expense > 0 && totals.expense < lastMonth * 0.92) type = 'rising';
  else if (overCount >= 1 || nearCount >= 2) type = 'struggler';

  const titles: Record<ProfileType, LocalizedText> = {
    new: L('Just getting started', 'সবে শুরু'),
    saver: L('Disciplined saver', 'সুনিয়ন্ত্রিত সঞ্চয়কারী'),
    balanced: L('Balanced spender', 'ভারসাম্যপূর্ণ খরচ'),
    spender: L('Impulsive spender', 'অপরিকল্পিত খরচ'),
    struggler: L('Budget under pressure', 'বাজেট চাপে'),
    rising: L('Rising saver', 'উন্নতিশীল সঞ্চয়কারী'),
  };

  const descriptions: Record<ProfileType, LocalizedText> = {
    new: L(
      'Log a few more days and Diganta will learn your money patterns.',
      'আর কয়েকদিন হিসাব লিখুন, দিগন্ত আপনার খরচের ধরন শিখে নেবে।',
    ),
    saver: L(
      `You consistently save about ${Math.round(savingsRate * 100)}% of your income. Consider investing the surplus.`,
      `আপনি নিয়মিত আয়ের প্রায় ${Math.round(savingsRate * 100)}% সঞ্চয় করেন। উদ্বৃত্ত বিনিয়োগের কথা ভাবুন।`,
    ),
    balanced: L(
      'Your spending and saving are fairly steady. A little more saving would help.',
      'আপনার খরচ ও সঞ্চয় মোটামুটি স্থির। আরেকটু সঞ্চয় করলে ভালো হবে।',
    ),
    spender: L(
      `Your spending is high relative to your income. Let's build a plan to cut back.`,
      'আয়ের তুলনায় খরচ বেশি। কমানোর একটি পরিকল্পনা করা যাক।',
    ),
    struggler: L(
      `${overCount || nearCount} budget(s) need attention this month.`,
      `এই মাসে ${overCount || nearCount}টি বাজেটে নজর দিতে হবে।`,
    ),
    rising: L(
      `You spent ${Math.round((1 - totals.expense / Math.max(1, lastMonth)) * 100)}% less than last month. Great progress!`,
      `গত মাসের চেয়ে ${Math.round((1 - totals.expense / Math.max(1, lastMonth)) * 100)}% কম খরচ করেছেন। দারুণ অগ্রগতি!`,
    ),
  };

  const savingsTarget = Math.round(income * (savingsRate >= 0.2 ? 0.25 : 0.2));
  const savingsCapacity = Math.max(0, income - Math.round(avgExpense));

  const suggestions: LocalizedText[] = [];
  if (top) {
    const cut = Math.round(top.amount * 0.15);
    suggestions.push(
      L(
        `Your biggest cost is ${top.category.label.en} (${formatMoney(top.amount)}). Trimming it 15% saves ${formatMoney(cut)}/month.`,
        `সবচেয়ে বেশি খরচ ${top.category.label.bn}-এ (${formatMoney(top.amount)})। ১৫% কমালে মাসে ${formatMoney(cut)} বাঁচবে।`,
      ),
    );
  }
  if (income > 0) {
    suggestions.push(
      L(
        `Aim to save ${formatMoney(savingsTarget)} each month (20% of your income).`,
        `প্রতি মাসে ${formatMoney(savingsTarget)} সঞ্চয়ের লক্ষ্য রাখুন (আয়ের ২০%)।`,
      ),
    );
  }
  if (savingsCapacity > 0) {
    suggestions.push(
      L(
        `After your usual spending you have about ${formatMoney(savingsCapacity)} left to save or invest.`,
        `স্বাভাবিক খরচের পর আপনার সঞ্চয় বা বিনিয়োগের জন্য প্রায় ${formatMoney(savingsCapacity)} থাকে।`,
      ),
    );
  }
  if (type === 'spender') {
    suggestions.push(
      L(
        'Try a 24-hour pause before non-essential buys, and set a budget for your top category.',
        'অপ্রয়োজনীয় কেনাকাটার আগে ২৪ ঘণ্টা ভাবুন, এবং শীর্ষ ক্যাটাগরির জন্য বাজেট ঠিক করুন।',
      ),
    );
  }
  if (habitDone < 0.5 && habits.length > 0) {
    suggestions.push(
      L(
        'Your habit consistency is low. Completing daily habits supports financial discipline too.',
        'অভ্যাসের ধারাবাহিকতা কম। দৈনিক অভ্যাস আর্থিক শৃঙ্খলাতেও সাহায্য করে।',
      ),
    );
  }

  return {
    type,
    title: titles[type],
    description: descriptions[type],
    traits,
    income,
    savingsTarget,
    savingsCapacity,
    suggestions: suggestions.slice(0, 4),
  };
}
