const buckets = new Map<string, number[]>();

export function assertRateLimit(
  key: string,
  max: number,
  windowMs: number,
): void {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    throw new Error('Çok hızlı işlem. Birkaç saniye sonra tekrar dene.');
  }
  recent.push(now);
  buckets.set(key, recent);
}
