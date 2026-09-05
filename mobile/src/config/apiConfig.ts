export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}
