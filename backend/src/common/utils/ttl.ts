import ms from 'ms';

/**
 * Parses a TTL string like "8h" / "30m" / "2d" into milliseconds.
 * Wraps ms() so call sites don't wrestle with the StringValue type.
 */
export function ttlToMs(ttl: string): number {
  return ms(ttl as ms.StringValue);
}

/** Parses a TTL string into seconds (for jsonwebtoken's numeric expiresIn). */
export function ttlToSeconds(ttl: string): number {
  return Math.floor(ttlToMs(ttl) / 1000);
}
