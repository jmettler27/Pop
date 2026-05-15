import emojiRegex from 'emoji-regex';

const regex = emojiRegex();

export const emojiCount = (str: string): number => (str.match(regex) || []).length;

export const onlyEmojis = (str: string): boolean => str.replace(regex, '').length <= 0;

export function numberToKeycapEmoji(number: number): string {
  if (number < 10) {
    return String(number) + '️⃣';
  }
  if (number === 10) {
    return '🔟';
  }
  return String(number);
}

export function rankingToEmoji(index: number): string {
  switch (index) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return `${index + 1}`;
  }
}
