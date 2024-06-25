import { DEFAULT_LOCALE } from "./locales";

export function timestampToDate(timestamp, locale = DEFAULT_LOCALE) {
    if (!timestamp) {
        return null;
    }
    return new Date(timestamp.seconds * 1000)?.toLocaleString(locale, {
        year: 'numeric', month: 'long', weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

export function timestampToDate1(timestamp) {
    if (!timestamp) {
        return null;
    }
    const date = new Date(timestamp.seconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${year}/${month}/${day}`;
}

export function timestampToHour(timestamp, locale = DEFAULT_LOCALE) {
    if (!timestamp) {
        return null;
    }
    return new Date(timestamp.seconds * 1000)?.toLocaleString(locale, {
        hour: '2-digit', minute: '2-digit'
    });
}

export function formatSecondsToMinutesAndSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');

    return `${minutesStr}:${secondsStr}`;
}

export const READY_COUNTDOWN_SECONDS = 5