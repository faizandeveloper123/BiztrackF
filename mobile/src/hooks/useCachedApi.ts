import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { appCache } from '../services/appCache';
import { extractErrorMessage } from '../utils/errorUtils';

interface UseCachedApiOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnAppFocus?: boolean;
}

interface UseCachedApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  isCached: boolean;
}

export const useCachedApi = <T = unknown>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCachedApiOptions = {},
): UseCachedApiReturn<T> => {
  const {
    ttl,
    enabled = true,
    refetchOnMount = true,
    refetchOnAppFocus = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchRef = useRef(fetchFn);
  const keyRef = useRef(key);

  useEffect(() => {
    fetchRef.current = fetchFn;
    keyRef.current = key;
  }, [fetchFn, key]);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      const currentKey = keyRef.current;
      const currentFetchFn = fetchRef.current;

      try {
        setLoading(true);
        setError(null);

        if (!forceRefresh) {
          const cached = appCache.get<T>(currentKey);
          if (cached !== null) {
            setData(cached);
            setIsCached(true);
            setLoading(false);
            return;
          }
        }

        setIsCached(false);
        const freshData = await currentFetchFn();
        appCache.set(currentKey, freshData, ttl);
        setData(freshData);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    },
    [enabled, ttl],
  );

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  const clearCache = useCallback(() => {
    appCache.delete(keyRef.current);
    setData(null);
    setIsCached(false);
  }, []);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [enabled, refetchOnMount, fetchData]);

  useEffect(() => {
    if (!enabled || !refetchOnAppFocus) return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        fetchData(true);
      }
    });

    return () => sub.remove();
  }, [enabled, refetchOnAppFocus, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isCached,
  };
};
