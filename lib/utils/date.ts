import { TIMEZONE } from '@/lib/config/env';

/**
 * Returns the start of today (midnight) in the restaurant's timezone,
 * as a UTC Date object suitable for database queries.
 */
export function startOfToday(): Date {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).formatToParts(now);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
    const year = Number(get('year'));
    const month = Number(get('month')) - 1;
    const day = Number(get('day'));

    // Build a date at midnight local time, then calculate the UTC offset
    // by comparing with the actual local time components
    const localMidnight = new Date(now);
    const localHours = Number(get('hour'));
    const localMinutes = Number(get('minute'));
    const localSeconds = Number(get('second'));

    // Current UTC time
    const utcMs = now.getTime();
    // Current local time as ms since midnight
    const localMsSinceMidnight = (localHours * 3600 + localMinutes * 60 + localSeconds) * 1000;
    // Approximate midnight UTC = current UTC - local ms since midnight
    const midnightUtcMs = utcMs - localMsSinceMidnight;
    // Round to nearest minute to avoid sub-second drift
    const roundedMs = Math.round(midnightUtcMs / 60000) * 60000;

    return new Date(roundedMs);
}
