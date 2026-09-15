export function clampPeriodDays(raw: string | undefined, fallback = 28): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(90, Math.max(7, Math.round(parsed)));
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function dateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function periodWindow(days: number, now = new Date()) {
  const periodEnd = addUtcDays(startOfUtcDay(now), 1);
  const periodStart = addUtcDays(periodEnd, -days);
  const previousStart = addUtcDays(periodStart, -days);
  return { days, periodStart, periodEnd, previousStart };
}

export type DailyBucket = { date: string; count: number; converted: number };

export function emptyDailySeries(periodStart: Date, days: number): DailyBucket[] {
  return Array.from({ length: days }, (_, index) => ({
    date: dateKeyUtc(addUtcDays(periodStart, index)),
    count: 0,
    converted: 0,
  }));
}
