export function timestampToDate(timestamp, lang = 'fr-FR') {
    if (!timestamp) {
        return null;
    }
    return new Date(timestamp.seconds * 1000)?.toLocaleDateString(lang);
}

export function formatSecondsToMinutesAndSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(remainingSeconds).padStart(2, '0');

    return `${minutesStr}:${secondsStr}`;
}

export const READY_COUNTDOWN_SECONDS = 5