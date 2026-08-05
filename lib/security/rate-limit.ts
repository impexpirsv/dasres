export type RateLimitRequest = {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

/**
 * Process-local fixed-window rate limiter for development and single-instance
 * deployments. Horizontally scaled production deployments must replace this
 * with an atomic shared store such as Redis or Upstash.
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<
    string,
    RateLimitBucket
  >();

  constructor(
    private readonly maximumBucketCount: number,
  ) {
    if (
      !Number.isSafeInteger(maximumBucketCount) ||
      maximumBucketCount < 1
    ) {
      throw new RangeError(
        "maximumBucketCount must be a positive safe integer.",
      );
    }
  }

  consume(
    request: RateLimitRequest,
  ): RateLimitResult {
    if (
      !Number.isSafeInteger(request.limit) ||
      request.limit < 1
    ) {
      throw new RangeError(
        "Rate limit must be a positive safe integer.",
      );
    }

    if (
      !Number.isSafeInteger(request.windowMs) ||
      request.windowMs < 1
    ) {
      throw new RangeError(
        "Rate-limit window must be a positive safe integer.",
      );
    }

    const now = request.now ?? Date.now();

    this.removeExpiredBuckets(now);

    const existingBucket = this.buckets.get(
      request.key,
    );

    if (existingBucket) {
      existingBucket.count += 1;

      return this.createResult(
        existingBucket,
        request.limit,
        now,
      );
    }

    if (
      this.buckets.size >=
      this.maximumBucketCount
    ) {
      const earliestResetAt = Math.min(
        ...Array.from(
          this.buckets.values(),
          (bucket) => bucket.resetAt,
        ),
      );

      return {
        allowed: false,
        limit: request.limit,
        remaining: 0,
        resetAt: earliestResetAt,
        retryAfterSeconds:
          this.getRetryAfterSeconds(
            earliestResetAt,
            now,
          ),
      };
    }

    const bucket: RateLimitBucket = {
      count: 1,
      resetAt: now + request.windowMs,
    };

    this.buckets.set(request.key, bucket);

    return this.createResult(
      bucket,
      request.limit,
      now,
    );
  }

  private removeExpiredBuckets(
    now: number,
  ): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private createResult(
    bucket: RateLimitBucket,
    limit: number,
    now: number,
  ): RateLimitResult {
    const allowed = bucket.count <= limit;

    return {
      allowed,
      limit,
      remaining: Math.max(
        0,
        limit - bucket.count,
      ),
      resetAt: bucket.resetAt,
      retryAfterSeconds: allowed
        ? 0
        : this.getRetryAfterSeconds(
            bucket.resetAt,
            now,
          ),
    };
  }

  private getRetryAfterSeconds(
    resetAt: number,
    now: number,
  ): number {
    return Math.max(
      1,
      Math.ceil((resetAt - now) / 1_000),
    );
  }
}
