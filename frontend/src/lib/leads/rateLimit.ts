/**
 * Fixed-window limiter for the public forms. In-process memory is enough
 * for a single website instance; when the site runs on more than one, move
 * this to the shared store planned in docs/platform-v2/02-TARGET-ARCHITECTURE.md §8.
 */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  /** Records an attempt; returns false once `key` has used up its window. */
  attempt(key: string, now = Date.now()): boolean {
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.evictIfFull(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  // Bounded memory under a flood of distinct keys: drop expired entries,
  // and if that isn't enough, the oldest one.
  private evictIfFull(now: number): void {
    if (this.hits.size < this.maxKeys) return;
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= now) this.hits.delete(key);
    }
    if (this.hits.size >= this.maxKeys) {
      const oldest = this.hits.keys().next().value;
      if (oldest !== undefined) this.hits.delete(oldest);
    }
  }
}
