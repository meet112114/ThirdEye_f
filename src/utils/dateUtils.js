import { format, addDays, startOfDay, isToday, isYesterday } from 'date-fns';

export function formatDate(date) {
    return format(date, 'yyyy-MM-dd');
}

export function formatTime(isoString) {
    return format(new Date(isoString), 'HH:mm');
}

export function getDateLabel(date) {
    if (isToday(date)) return { main: format(date, 'EEEE, MMMM d'), sub: 'Today', isToday: true };
    if (isYesterday(date)) return { main: format(date, 'EEEE, MMMM d'), sub: 'Yesterday', isToday: false };
    return { main: format(date, 'EEEE, MMMM d'), sub: format(date, 'yyyy'), isToday: false };
}

// Build ISO timestamp for a given date (YYYY-MM-DD) + local HH:MM string.
// No 'Z' suffix → browser parses as LOCAL time, .toISOString() converts to UTC correctly.
export function buildTimestamp(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

// Return UTC start/end for a LOCAL calendar day (YYYY-MM-DD) so the server
// query window correctly covers midnight-to-midnight in the user's timezone.
export function localDayBounds(dateStr) {
    const start = new Date(`${dateStr}T00:00:00`);
    const end = new Date(`${dateStr}T23:59:59.999`);
    return { start: start.toISOString(), end: end.toISOString() };
}

// Get HH:MM in user local time for "Now"
export function nowTimeLocal() {
    const now = new Date();
    return format(now, 'HH:mm');
}

// Convert ISO to local YYYY-MM-DD for date grouping
export function toLocalDateStr(isoString) {
    return format(new Date(isoString), 'yyyy-MM-dd');
}

export const TAG_COLORS = {
    work: 'color-work',
    health: 'color-health',
    fitness: 'color-health',
    personal: 'color-personal',
    family: 'color-personal',
    finance: 'color-finance',
    money: 'color-finance',
    social: 'color-social',
    friends: 'color-social',
};

export function getTagColor(tag) {
    const lower = tag.toLowerCase();
    return TAG_COLORS[lower] || '';
}

export const SUGGESTED_TAGS = ['work', 'health', 'personal', 'finance', 'social', 'learning', 'fitness', 'creative'];
