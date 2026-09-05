import { apiService } from '../services/ApiService';

export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_url: string;
  filename: string;
  original_filename: string;
  s3_key?: string;
  file_size: number;
  content_type: string;
}

export async function uploadDocumentFromUri(input: {
  uri: string;
  name: string;
  mimeType?: string;
}): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: input.uri,
    name: input.name,
    type: input.mimeType || 'application/octet-stream',
  } as unknown as Blob);
  return apiService.post<FileUploadResponse>('/file-upload/document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function deleteUploadedFileByKey(s3Key: string): Promise<void> {
  const pathPart = s3Key.split('/').map(encodeURIComponent).join('/');
  await apiService.delete(`/file-upload/delete/${pathPart}`);
}

export function extractS3KeyFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const urlWithoutParams = url.split('?')[0];
    if (urlWithoutParams.includes('/documents/')) {
      return 'documents/' + urlWithoutParams.split('/documents/')[1];
    }
    if (urlWithoutParams.includes('/logos/')) {
      return 'logos/' + urlWithoutParams.split('/logos/')[1];
    }
    if (urlWithoutParams.includes('/avatars/')) {
      return 'avatars/' + urlWithoutParams.split('/avatars/')[1];
    }
    return null;
  } catch {
    return null;
  }
}
