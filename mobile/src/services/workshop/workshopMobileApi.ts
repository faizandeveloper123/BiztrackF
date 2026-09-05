import { apiService } from '../ApiService';
import type { JobCard, JobCardCreate, JobCardUpdate } from '../../models/workshop/JobCard';
import type { Vehicle, VehicleCreate, VehicleUpdate } from '../../models/workshop/Vehicle';
import type {
  QualityCheckResponse,
  QualityCheckCreate,
  QualityCheckUpdate,
  QualityCheckFilters,
} from '../../models/qualityControl';

export async function getJobCards(): Promise<JobCard[]> {
  const data = await apiService.get<JobCard[] | unknown>('/job-cards?limit=500');
  return Array.isArray(data) ? data : [];
}

export async function createJobCard(body: JobCardCreate) {
  return apiService.post<JobCard>('/job-cards', body);
}

export async function updateJobCard(id: string, body: JobCardUpdate) {
  return apiService.put<JobCard>(`/job-cards/${id}`, body);
}

export async function deleteJobCard(id: string) {
  return apiService.delete(`/job-cards/${id}`);
}

export async function getVehicles(): Promise<Vehicle[]> {
  const data = await apiService.get<Vehicle[] | unknown>('/vehicles?limit=500');
  return Array.isArray(data) ? data : [];
}

export async function createVehicle(body: VehicleCreate) {
  return apiService.post<Vehicle>('/vehicles', body);
}

export async function updateVehicle(id: string, body: VehicleUpdate) {
  return apiService.put<Vehicle>(`/vehicles/${id}`, body);
}

export async function deleteVehicle(id: string) {
  return apiService.delete(`/vehicles/${id}`);
}

export async function getTenantUsers(): Promise<
  { id: string; name?: string; username?: string; email?: string }[]
> {
  try {
    const tenantId = apiService.getTenantId();
    if (!tenantId) return [];
    const res = await apiService.getTenantUsers(tenantId);
    const list = res?.users ?? res ?? [];
    return (Array.isArray(list) ? list : [])
      .filter((u: any) => u.isActive !== false)
      .map((u: any) => ({
        id: u.id || u.userId,
        name:
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          u.userName ||
          u.email,
        username: u.userName,
        email: u.email,
      }))
      .filter((u) => u.id);
  } catch {
    return [];
  }
}

export async function getInvoiceCustomer(id: string) {
  return apiService.get(`/invoices/customers/${id}`);
}

export async function getQualityChecks(
  filters: QualityCheckFilters = {},
  page = 1,
  limit = 100,
) {
  const queryParams = new URLSearchParams();
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.priority) queryParams.append('priority', filters.priority);
  if (filters.search) queryParams.append('search', filters.search);
  queryParams.append('page', String(page));
  queryParams.append('limit', String(limit));
  const response = await apiService.get<QualityCheckResponse[]>(
    `/quality-control/checks?${queryParams.toString()}`,
  );
  return {
    quality_checks: Array.isArray(response) ? response : [],
    total: Array.isArray(response) ? response.length : 0,
  };
}

export async function createQualityCheck(body: QualityCheckCreate) {
  return apiService.post<QualityCheckResponse>(
    '/quality-control/checks',
    body,
  );
}

export async function updateQualityCheck(
  id: string,
  body: QualityCheckUpdate,
) {
  return apiService.put<QualityCheckResponse>(
    `/quality-control/checks/${id}`,
    body,
  );
}

export async function deleteQualityCheck(id: string) {
  return apiService.delete(`/quality-control/checks/${id}`);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof globalThis.btoa !== 'function') {
    throw new Error('btoa not available');
  }
  return globalThis.btoa(binary);
}

export async function downloadJobCardPdfToShare(
  id: string,
): Promise<{ fileUri: string }> {
  const {
    cacheDirectory,
    writeAsStringAsync,
    EncodingType,
  } = await import('expo-file-system/legacy');
  if (!cacheDirectory) {
    throw new Error('Cache directory not available');
  }
  const ab = await apiService.getArrayBuffer(`/job-cards/${id}/pdf`);
  const b64 = arrayBufferToBase64(ab);
  const path = `${cacheDirectory}job-card-${id}.pdf`;
  await writeAsStringAsync(path, b64, {
    encoding: EncodingType.Base64,
  });
  return { fileUri: path };
}
