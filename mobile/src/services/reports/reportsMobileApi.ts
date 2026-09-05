import { apiService } from '../ApiService';

export interface SavedReportItem {
  id: string;
  title: string;
  file_type: 'pdf' | 'csv';
  file_url: string;
  original_filename?: string | null;
  file_size?: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchReportsDashboard(opts?: {
  start_date?: string;
  end_date?: string;
}): Promise<Record<string, unknown>> {
  const p = new URLSearchParams();
  if (opts?.start_date) p.append('start_date', opts.start_date);
  if (opts?.end_date) p.append('end_date', opts.end_date);
  const q = p.toString();
  return apiService.get<Record<string, unknown>>(
    `/reports/dashboard${q ? `?${q}` : ''}`,
  );
}

export async function exportReportsDashboard(opts?: {
  start_date?: string;
  end_date?: string;
}): Promise<Record<string, unknown>> {
  const p = new URLSearchParams();
  p.append('report_type', 'dashboard');
  p.append('format', 'json');
  if (opts?.start_date) p.append('start_date', opts.start_date);
  if (opts?.end_date) p.append('end_date', opts.end_date);
  return apiService.get<Record<string, unknown>>(
    `/reports/export?${p.toString()}`,
  );
}

export async function listSavedReports(): Promise<SavedReportItem[]> {
  const res = await apiService.get<{ reports: SavedReportItem[] }>(
    '/reports/saved',
  );
  return res.reports ?? [];
}

export async function uploadSavedReport(
  title: string,
  file: { uri: string; name: string; type: string },
): Promise<SavedReportItem> {
  const fd = new FormData();
  fd.append('title', title);
  fd.append(
    'file',
    { uri: file.uri, name: file.name, type: file.type } as unknown as Blob,
  );
  return apiService.post<SavedReportItem>('/reports/saved', fd, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function renameSavedReport(
  id: string,
  title: string,
): Promise<SavedReportItem> {
  return apiService.patch<SavedReportItem>(`/reports/saved/${id}`, { title });
}

export async function deleteSavedReport(id: string): Promise<void> {
  await apiService.delete(`/reports/saved/${id}`);
}
