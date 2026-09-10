import type { Language } from './types';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBanglaDigits(input: string): string {
  return input.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Indian/Bangladeshi digit grouping: 12,34,567 */
export function groupDigits(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const s = Math.abs(rounded).toString();
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}${rest},${last3}`;
}

export function formatNumber(value: number, lang: Language = 'en'): string {
  const grouped = groupDigits(value);
  return lang === 'bn' ? toBanglaDigits(grouped) : grouped;
}

export function formatMoney(value: number, lang: Language = 'en', withSymbol = true): string {
  const num = formatNumber(value, lang);
  return withSymbol ? `৳ ${num}` : num;
}

export function formatCompact(value: number, lang: Language = 'en'): string {
  const abs = Math.abs(value);
  let out: string;
  if (abs >= 10000000) out = `${(value / 10000000).toFixed(1)}cr`;
  else if (abs >= 100000) out = `${(value / 100000).toFixed(1)}L`;
  else if (abs >= 1000) out = `${(value / 1000).toFixed(1)}k`;
  else out = String(Math.round(value));
  return `৳ ${lang === 'bn' ? toBanglaDigits(out) : out}`;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local YYYY-MM-DD */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function daysAgoKey(days: number): string {
  return dateKey(addDays(new Date(), -days));
}

export function startOfMonth(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysInMonth(d: Date = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_BN = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];

export function formatDate(iso: string, lang: Language = 'en'): string {
  const d = new Date(iso);
  const day = lang === 'bn' ? toBanglaDigits(String(d.getDate())) : String(d.getDate());
  return `${day} ${lang === 'bn' ? MONTHS_BN[d.getMonth()] : MONTHS_EN[d.getMonth()]}`;
}

export function formatMonthYear(d: Date = new Date(), lang: Language = 'en'): string {
  const month = lang === 'bn' ? MONTHS_BN[d.getMonth()] : MONTHS_EN[d.getMonth()];
  const year = lang === 'bn' ? toBanglaDigits(String(d.getFullYear())) : String(d.getFullYear());
  return `${month} ${year}`;
}

export function formatTime(iso: string, lang: Language = 'en'): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const suffix = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  const out = `${h}:${m} ${suffix}`;
  return lang === 'bn' ? toBanglaDigits(out) : out;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}
