import { emojiCount } from '@/backend/utils/emojis';

/**
 * Returns a string indicating the number of emojis in the input
 * @param {string} value - The input value to check
 * @param {number} maxEmojis - The maximum number of emojis allowed
 * @returns {string} - A string indicating the number of emojis
 */
export function numEmojisIndicator(value, maxEmojis) {
  if (!value) return '';

  return `${emojiCount(value)}/${maxEmojis} emojis`;
}

/**
 * Validates that the input contains at most the specified number of emojis
 * @param {string} value - The input value to validate
 * @param {number} maxEmojis - The maximum number of emojis allowed
 * @returns {boolean} - Whether the input is valid
 */
export function validateMaxEmojis(value, maxEmojis) {
  if (!value) return true;

  return emojiCount(value) <= maxEmojis;
}
