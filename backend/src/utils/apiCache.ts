import NodeCache from "node-cache";

class ApiCache {
  private cache: NodeCache;

  constructor(defaultTtlSeconds: number = 60 * 5) {
    this.cache = new NodeCache({ stdTTL: defaultTtlSeconds, checkperiod: 60 });
  }

  async get<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 0): Promise<T> {
    const cached = this.cache.get<T>(key);
    if (cached) return cached;

    const data = await fetcher();

    if (ttlSeconds > 0) {
      this.cache.set(key, data, ttlSeconds);
    } else {
      this.cache.set(key, data); // default TTL
    }

    return data;
  }

  set<T>(key: string, data: T, ttlSeconds?: number) {
    if (ttlSeconds !== undefined) {
      this.cache.set(key, data, ttlSeconds);
    } else {
      this.cache.set(key, data);
    }
  }

  getRaw<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  clear(key: string) {
    this.cache.del(key);
  }

  clearAll() {
    this.cache.flushAll();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export const apiCache = new ApiCache();
