import type {
  Category,
  InvestmentKind,
  LocalizedText,
  PaymentMethod,
  PaymentType,
  SavingsType,
  TaskCategory,
  Priority,
} from './types';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', icon: '🛒', color: '#2E9E5B', type: 'expense', label: { en: 'Bazar / Grocery', bn: 'বাজার' } },
  { id: 'transport', icon: '🛺', color: '#0EA5E9', type: 'expense', label: { en: 'Rickshaw / CNG', bn: 'রিকশা / সিএনজি' } },
  { id: 'mobile', icon: '📱', color: '#8B5CF6', type: 'expense', label: { en: 'Mobile Recharge', bn: 'মোবাইল রিচার্জ' } },
  { id: 'bills', icon: '🧾', color: '#F59E0B', type: 'expense', label: { en: 'Bills & Utilities', bn: 'বিল ও ইউটিলিটি' } },
  { id: 'eating_out', icon: '🍛', color: '#EF4444', type: 'expense', label: { en: 'Eating Out', bn: 'বাইরে খাওয়া' } },
  { id: 'rent', icon: '🏠', color: '#6366F1', type: 'expense', label: { en: 'Rent', bn: 'বাসা ভাড়া' } },
  { id: 'health', icon: '💊', color: '#EC4899', type: 'expense', label: { en: 'Health', bn: 'স্বাস্থ্য' } },
  { id: 'education', icon: '📚', color: '#14B8A6', type: 'expense', label: { en: 'Education', bn: 'শিক্ষা' } },
  { id: 'shopping', icon: '🛍️', color: '#D946EF', type: 'expense', label: { en: 'Shopping', bn: 'শপিং' } },
  { id: 'family', icon: '💝', color: '#F97316', type: 'expense', label: { en: 'Family & Gifts', bn: 'পরিবার ও উপহার' } },
  { id: 'other_expense', icon: '📦', color: '#64748B', type: 'expense', label: { en: 'Other', bn: 'অন্যান্য' } },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', icon: '💼', color: '#2E9E5B', type: 'income', label: { en: 'Salary', bn: 'বেতন' } },
  { id: 'freelance', icon: '💻', color: '#0EA5E9', type: 'income', label: { en: 'Freelance', bn: 'ফ্রিল্যান্স' } },
  { id: 'business', icon: '🏪', color: '#8B5CF6', type: 'income', label: { en: 'Business', bn: 'ব্যবসা' } },
  { id: 'remittance', icon: '📥', color: '#14B8A6', type: 'income', label: { en: 'Remittance', bn: 'রেমিট্যান্স' } },
  { id: 'gift', icon: '🎁', color: '#F59E0B', type: 'income', label: { en: 'Gift', bn: 'উপহার' } },
  { id: 'other_income', icon: '💰', color: '#64748B', type: 'income', label: { en: 'Other', bn: 'অন্যান্য' } },
];

export const ALL_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.id, c]),
);

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash', short: 'CASH', color: '#2E9E5B', label: { en: 'Cash', bn: 'নগদ' } },
  { id: 'bkash', short: 'bKash', color: '#E2136E', label: { en: 'bKash', bn: 'বিকাশ' } },
  { id: 'nagad', short: 'Nagad', color: '#F6821F', label: { en: 'Nagad', bn: 'নগদ (Nagad)' } },
  { id: 'rocket', short: 'Rocket', color: '#8C3494', label: { en: 'Rocket', bn: 'রকেট' } },
  { id: 'bank', short: 'Bank', color: '#0EA5E9', label: { en: 'Bank', bn: 'ব্যাংক' } },
  { id: 'card', short: 'Card', color: '#6366F1', label: { en: 'Card', bn: 'কার্ড' } },
];

export const PAYMENT_BY_ID: Record<PaymentType, PaymentMethod> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.id, m]),
) as Record<PaymentType, PaymentMethod>;

export const SAVINGS_TYPES: { id: SavingsType; label: LocalizedText; icon: string }[] = [
  { id: 'dps', icon: '🏦', label: { en: 'DPS', bn: 'ডিপিএস' } },
  { id: 'fdr', icon: '📜', label: { en: 'FDR', bn: 'এফডিআর' } },
  { id: 'bank', icon: '🏛️', label: { en: 'Bank Savings', bn: 'ব্যাংক সঞ্চয়' } },
  { id: 'somiti', icon: '🤝', label: { en: 'Committee / Somiti', bn: 'কমিটি / সমিতি' } },
  { id: 'cash', icon: '💵', label: { en: 'Cash at Home', bn: 'ঘরে নগদ' } },
  { id: 'other', icon: '✨', label: { en: 'Other', bn: 'অন্যান্য' } },
];

export const TASK_CATEGORIES: { id: TaskCategory; label: LocalizedText; color: string }[] = [
  { id: 'work', label: { en: 'Work', bn: 'কাজ' }, color: '#0EA5E9' },
  { id: 'personal', label: { en: 'Personal', bn: 'ব্যক্তিগত' }, color: '#8B5CF6' },
  { id: 'family', label: { en: 'Family', bn: 'পরিবার' }, color: '#F97316' },
];

export const PRIORITIES: { id: Priority; label: LocalizedText; color: string }[] = [
  { id: 'high', label: { en: 'High', bn: 'উচ্চ' }, color: '#E5484D' },
  { id: 'medium', label: { en: 'Medium', bn: 'মাঝারি' }, color: '#D9820B' },
  { id: 'low', label: { en: 'Low', bn: 'নিম্ন' }, color: '#5B6B63' },
];

export const HABIT_PRESETS: { name: LocalizedText; icon: string; unit: LocalizedText; targetPerDay: number; color: string }[] = [
  { name: { en: 'Drink Water', bn: 'পানি পান' }, icon: '💧', unit: { en: 'glasses', bn: 'গ্লাস' }, targetPerDay: 8, color: '#0EA5E9' },
  { name: { en: 'Sleep', bn: 'ঘুম' }, icon: '😴', unit: { en: 'hours', bn: 'ঘণ্টা' }, targetPerDay: 7, color: '#6366F1' },
  { name: { en: 'Exercise', bn: 'ব্যায়াম' }, icon: '🏃', unit: { en: 'session', bn: 'বার' }, targetPerDay: 1, color: '#2E9E5B' },
  { name: { en: 'Prayer', bn: 'নামাজ' }, icon: '🕌', unit: { en: 'times', bn: 'বার' }, targetPerDay: 5, color: '#14B8A6' },
  { name: { en: 'Read', bn: 'পড়া' }, icon: '📖', unit: { en: 'pages', bn: 'পৃষ্ঠা' }, targetPerDay: 10, color: '#F59E0B' },
  { name: { en: 'Screen Time', bn: 'স্ক্রিন টাইম' }, icon: '📵', unit: { en: 'hours', bn: 'ঘণ্টা' }, targetPerDay: 3, color: '#EC4899' },
  { name: { en: 'No Smoking', bn: 'ধূমপান নয়' }, icon: '🚭', unit: { en: 'day', bn: 'দিন' }, targetPerDay: 1, color: '#EF4444' },
];

export const INVESTMENT_KINDS: { id: InvestmentKind; label: LocalizedText; icon: string; color: string }[] = [
  { id: 'stocks', label: { en: 'Stocks', bn: 'শেয়ার' }, icon: '📈', color: '#0EA5E9' },
  { id: 'mutual_fund', label: { en: 'Mutual Fund', bn: 'মিউচুয়াল ফান্ড' }, icon: '🧺', color: '#8B5CF6' },
  { id: 'gold', label: { en: 'Gold', bn: 'স্বর্ণ' }, icon: '🪙', color: '#F59E0B' },
  { id: 'land', label: { en: 'Land / Property', bn: 'জমি / সম্পত্তি' }, icon: '🏞️', color: '#2E9E5B' },
  { id: 'fdr', label: { en: 'FDR', bn: 'এফডিআর' }, icon: '📜', color: '#14B8A6' },
  { id: 'dps', label: { en: 'DPS', bn: 'ডিপিএস' }, icon: '🏦', color: '#6366F1' },
  { id: 'crypto', label: { en: 'Crypto', bn: 'ক্রিপ্টো' }, icon: '₿', color: '#F97316' },
  { id: 'other', label: { en: 'Other', bn: 'অন্যান্য' }, icon: '✨', color: '#64748B' },
];

export const INVESTMENT_BY_ID: Record<string, (typeof INVESTMENT_KINDS)[number]> = Object.fromEntries(
  INVESTMENT_KINDS.map((i) => [i.id, i]),
);
