interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  enableLogging?: boolean;
}

class FrontendCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxSize: number = 100;
  private enableLogging: boolean = true;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
    this.enableLogging = options.enableLogging ?? true;
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.log(`Cache miss for key: ${key}`);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.log(`Cache expired for key: ${key}`);
      return null;
    }

    this.log(`Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(key, entry);
    this.log(`Cache set for key: ${key} (TTL: ${entry.ttl}ms)`);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.log(`Cache deleted for key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.log("Cache cleared");
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let clearedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      this.log(`Cleared ${clearedCount} expired cache entries`);
    }

    return clearedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let invalidatedCount = 0;
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      this.log(
        `Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`,
      );
    }

    return invalidatedCount;
  }

  /**
   * Get or set pattern - useful for API calls
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      this.log(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Batch get multiple keys
   */
  getMultiple<T>(keys: string[]): { [key: string]: T | null } {
    const result: { [key: string]: T | null } = {};

    for (const key of keys) {
      result[key] = this.get<T>(key);
    }

    return result;
  }

  /**
   * Batch set multiple key-value pairs
   */
  setMultiple<T>(entries: { [key: string]: T }, ttl?: number): void {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, ttl);
    }
  }

  private evictOldest(): void {
    let oldestKey = "";
    let oldestTimestamp = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log(`Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      totalSize += key.length * 2; // Unicode characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 16; // Entry overhead (timestamp, ttl)
    }

    return totalSize;
  }

  private log(_message: string, ..._args: any[]): void {
    if (this.enableLogging) {
    }
  }
}

// Create singleton instance
export const frontendCache = new FrontendCacheService({
  ttl: 5 * 60 * 1000, // 5 minutes default
  maxSize: 100,
  enableLogging: process.env.NODE_ENV === "development",
});

// Auto-cleanup expired entries every 5 minutes
setInterval(
  () => {
    frontendCache.clearExpired();
  },
  5 * 60 * 1000,
);

// Export the class for custom instances
export { FrontendCacheService };
