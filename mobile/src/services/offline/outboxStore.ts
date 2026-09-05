import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const STORAGE_KEY = 'biztrack_offline_outbox_v1';

export type OfflineMutation = {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  createdAt: number;
};

async function readAll(): Promise<OfflineMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineMutation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: OfflineMutation[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function enqueueOfflineMutation(
  item: Omit<OfflineMutation, 'id' | 'createdAt'>,
): Promise<void> {
  const list = await readAll();
  const next: OfflineMutation = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  list.push(next);
  await writeAll(list);
  DeviceEventEmitter.emit('biztrack-offline-queue', {
    pending: list.length,
  });
}

export async function listOfflineMutations(): Promise<OfflineMutation[]> {
  return readAll();
}

export async function clearOfflineMutation(id: string): Promise<void> {
  const list = (await readAll()).filter((x) => x.id !== id);
  await writeAll(list);
  DeviceEventEmitter.emit('biztrack-offline-queue', { pending: list.length });
}

export async function replaceAllOfflineMutations(
  items: OfflineMutation[],
): Promise<void> {
  await writeAll(items);
  DeviceEventEmitter.emit('biztrack-offline-queue', { pending: items.length });
}
