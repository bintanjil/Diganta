import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { dateKey } from './format';
import { useAppStore } from './store';
import type { BackupPayload } from './types';

export function buildPayload(): BackupPayload {
  const state = useAppStore.getState();
  return {
    app: 'diganta',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
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
      guideDismissed: state.guideDismissed,
    },
  };
}

export function backupFileName(): string {
  return `diganta-backup-${dateKey()}.json`;
}

export async function exportBackup(): Promise<string> {
  const json = JSON.stringify(buildPayload(), null, 2);
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Diganta backup',
      UTI: 'public.json',
    });
  }
  return file.uri;
}

export async function pickBackup(): Promise<BackupPayload> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) {
    throw new Error('cancelled');
  }
  const asset = result.assets[0];
  const file = new File(asset.uri);
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupPayload;
  const app = (parsed as { app?: string }).app;
  if ((app !== 'diganta' && app !== 'ankur' && app !== 'jibon') || !parsed.data) {
    throw new Error('invalid');
  }
  return parsed;
}
