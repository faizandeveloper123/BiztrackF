import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiService } from '../services/ApiService';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(
      null,
      slice as unknown as number[],
    );
  }
  return global.btoa(binary);
}

export async function sharePdfFromAuthenticatedPath(
  apiPath: string,
  filename: string,
): Promise<void> {
  const buf = await apiService.getArrayBuffer(apiPath);
  const base64 = arrayBufferToBase64(buf);
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const dir = FileSystem.cacheDirectory;
  if (!dir) {
    throw new Error('Cache directory unavailable');
  }
  const path = `${dir}${safe.endsWith('.pdf') ? safe : `${safe}.pdf`}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: 'base64',
  });
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(path, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
  });
}
