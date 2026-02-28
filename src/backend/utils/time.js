import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

/**
 * Convert a timestamp to a date
 *
 * @param {Timestamp} timestamp - The timestamp to convert
 * @param {string} locale - The locale to use
 * @returns {string} The date
 */
export function timestampToDate(timestamp, locale = DEFAULT_LOCALE) {
  if (!timestamp) {
    return null;
  }
  return new Date(timestamp.seconds * 1000)?.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    weekday: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert a timestamp to a date in the format YYYY/MM/DD
 *
 * @param {Timestamp} timestamp - The timestamp to convert
 * @returns {string} The date
 */
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

/**
 * Convert a timestamp to a date in the format HH:MM
 *
 * @param {Timestamp} timestamp - The timestamp to convert
 * @param {string} locale - The locale to use
 * @returns {string} The date
 */
export function timestampToHour(timestamp, locale = DEFAULT_LOCALE) {
  if (!timestamp) {
    return null;
  }
  return new Date(timestamp.seconds * 1000)?.toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format seconds to minutes and seconds
 *
 * @param {number} seconds - The seconds to format
 * @returns {string} The formatted time
 */
export function formatSecondsToMinutesAndSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(remainingSeconds).padStart(2, '0');

  return `${minutesStr}:${secondsStr}`;
}
