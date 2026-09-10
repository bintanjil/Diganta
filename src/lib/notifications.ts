import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { billStatuses } from './analytics';
import type { Bill, Language } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Diganta reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

export async function cancelAll(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

interface ReminderOptions {
  bills: Bill[];
  language: Language;
  dailyHour?: number;
  dailyMinute?: number;
}

export async function syncReminders({ bills, language, dailyHour = 21, dailyMinute = 0 }: ReminderOptions): Promise<void> {
  try {
    await cancelAll();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'bn' ? 'আজকের হিসাব লিখুন' : "Log today's expenses",
        body:
          language === 'bn'
            ? 'আজকের খরচ যোগ করতে ট্যাপ করুন।'
            : 'Tap to add today’s spending and keep your records complete.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: dailyHour,
        minute: dailyMinute,
      },
    });

    const statuses = billStatuses(bills);
    for (const status of statuses) {
      if (status.paid || status.daysUntil < 0 || status.daysUntil > 30) continue;
      const trigger = new Date(status.dueDate);
      trigger.setHours(9, 0, 0, 0);
      if (trigger.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: language === 'bn' ? 'বিল পরিশোধের সময়' : 'Bill due soon',
          body: `${status.bill.title} · ৳ ${status.bill.amount}`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
      });
    }
  } catch {
    // notifications unavailable (e.g. Expo Go on Android) — fail silently
  }
}
