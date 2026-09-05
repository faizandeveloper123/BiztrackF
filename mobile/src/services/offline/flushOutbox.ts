import { apiService } from '../ApiService';
import {
  listOfflineMutations,
  replaceAllOfflineMutations,
  type OfflineMutation,
} from './outboxStore';

const replayHeaders = { 'X-Biztrack-Offline-Replay': '1' };

async function sendOne(m: OfflineMutation): Promise<void> {
  const body = m.body;
  const cfg = { headers: replayHeaders };
  switch (m.method) {
    case 'POST':
      await apiService.post(m.url, body, cfg);
      return;
    case 'PUT':
      await apiService.put(m.url, body, cfg);
      return;
    case 'PATCH':
      await apiService.patch(m.url, body, cfg);
      return;
    case 'DELETE':
      await apiService.delete(m.url, cfg);
      return;
    default:
      return;
  }
}

export async function flushOfflineOutbox(): Promise<{
  processed: number;
  failed: number;
}> {
  const pending = await listOfflineMutations();
  if (pending.length === 0) {
    return { processed: 0, failed: 0 };
  }
  const remaining: OfflineMutation[] = [];
  let processed = 0;
  let failed = 0;
  for (const m of pending) {
    try {
      await sendOne(m);
      processed += 1;
    } catch {
      failed += 1;
      remaining.push(m);
    }
  }
  await replaceAllOfflineMutations(remaining);
  return { processed, failed };
}
