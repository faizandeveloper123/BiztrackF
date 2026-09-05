import { apiService } from "./ApiService";

export interface SavedReportItem {
  id: string;
  title: string;
  file_type: "pdf" | "csv";
  file_url: string;
  original_filename?: string | null;
  file_size?: number | null;
  createdAt: string;
  updatedAt: string;
}

export async function listSavedReports(): Promise<SavedReportItem[]> {
  const res = await apiService.get<{ reports: SavedReportItem[] }>(
    "/reports/saved",
  );
  return res.reports ?? [];
}

export async function uploadSavedReport(
  title: string,
  file: File,
): Promise<SavedReportItem> {
  const fd = new FormData();
  fd.append("title", title);
  fd.append("file", file);
  return apiService.post<SavedReportItem>("/reports/saved", fd);
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
