import { useState, useEffect, useCallback, useRef } from "react";
import { frontendCache } from "../services/frontendCacheService";
import { extractErrorMessage } from "../utils/errorUtils";

interface UseCachedApiOptions {
  ttl?: number;
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface UseCachedApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
  isCached: boolean;
}

export const useCachedApi = <T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCachedApiOptions = {},
): UseCachedApiReturn<T> => {
  const {
    ttl,
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchRef = useRef(fetchFn);
  const keyRef = useRef(key);

  // Update refs when props change
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

        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = frontendCache.get<T>(currentKey);
          if (cached !== null) {
            setData(cached);
            setIsCached(true);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        setIsCached(false);
        const freshData = await currentFetchFn();

        // Cache the result
        frontendCache.set(currentKey, freshData, ttl);

        setData(freshData);
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to fetch data");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [enabled, ttl],
  );

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  const clearCache = useCallback(() => {
    frontendCache.delete(keyRef.current);
    setData(null);
    setIsCached(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount) {
      fetchData();
    }
  }, [fetchData, refetchOnMount]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData, refetchOnWindowFocus]);

  return {
    data,
    loading,
    error,
    refetch,
    clearCache,
    isCached,
  };
};

// Specialized hook for API calls with automatic caching
export const useCachedApiCall = <T = any>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  options: UseCachedApiOptions = {},
) => {
  return useCachedApi(cacheKey, apiCall, {
    ttl: 5 * 60 * 1000, // 5 minutes default
    ...options,
  });
};

// Hook for managing cache manually
export const useCacheManager = () => {
  const clearCache = useCallback((pattern?: string) => {
    if (pattern) {
      frontendCache.invalidatePattern(pattern);
    } else {
      frontendCache.clear();
    }
  }, []);

  const getCacheStats = useCallback(() => {
    return frontendCache.getStats();
  }, []);

  const clearExpired = useCallback(() => {
    return frontendCache.clearExpired();
  }, []);

  return {
    clearCache,
    getCacheStats,
    clearExpired,
  };
};
