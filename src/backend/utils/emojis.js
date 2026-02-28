import emojiRegex from 'emoji-regex';
const regex = emojiRegex();

export const emojiCount = (str) => (str.match(regex) || []).length;

export const onlyEmojis = (str) => str.replace(regex, '').length <= 0;

export function numberToKeycapEmoji(number) {
  if (number < 10) {
    return String(number) + '\uFE0F\u20E3';
  }
  if (number === 10) {
    return '🔟';
  }
  return String(number);
}

export function rankingToEmoji(index) {
  switch (index) {
    case 0:
      return '🥇'; // Gold medal for the 1st place
    case 1:
      return '🥈'; // Silver medal for the 2nd place
    case 2:
      return '🥉'; // Bronze medal for the 3rd place
    default:
      return `${index + 1}`; // Regular numbering for other positions
  }
}
