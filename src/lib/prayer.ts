import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';

import type { LocalizedText } from './types';

export interface PrayerEntry {
  key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  name: LocalizedText;
  time: Date;
}

const NAMES: Record<PrayerEntry['key'], LocalizedText> = {
  fajr: { en: 'Fajr', bn: 'ফজর' },
  sunrise: { en: 'Sunrise', bn: 'সূর্যোদয়' },
  dhuhr: { en: 'Dhuhr', bn: 'যোহর' },
  asr: { en: 'Asr', bn: 'আসর' },
  maghrib: { en: 'Maghrib', bn: 'মাগরিব' },
  isha: { en: 'Isha', bn: 'এশা' },
};

export function prayerTimesFor(date: Date, latitude: number, longitude: number): PrayerEntry[] {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi;
  const times = new PrayerTimes(coordinates, date, params);

  return [
    { key: 'fajr', name: NAMES.fajr, time: times.fajr },
    { key: 'sunrise', name: NAMES.sunrise, time: times.sunrise },
    { key: 'dhuhr', name: NAMES.dhuhr, time: times.dhuhr },
    { key: 'asr', name: NAMES.asr, time: times.asr },
    { key: 'maghrib', name: NAMES.maghrib, time: times.maghrib },
    { key: 'isha', name: NAMES.isha, time: times.isha },
  ];
}

export function nextPrayer(
  latitude: number,
  longitude: number,
  from: Date = new Date(),
): PrayerEntry | null {
  const today = prayerTimesFor(from, latitude, longitude);
  const upcoming = today.find((p) => p.time.getTime() > from.getTime());
  if (upcoming) return upcoming;
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return prayerTimesFor(tomorrow, latitude, longitude)[0] ?? null;
}

export function formatPrayerTime(date: Date, lang: 'en' | 'bn'): string {
  let hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, '0');
  const suffix = hour < 12 ? 'AM' : 'PM';
  hour = hour % 12 || 12;
  const text = `${hour}:${minute} ${suffix}`;
  if (lang === 'bn') {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return text.replace(/\d/g, (d) => digits[Number(d)]);
  }
  return text;
}
