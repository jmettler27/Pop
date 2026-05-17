import { emojiCount } from '@/frontend/helpers/emojis';

export function numEmojisIndicator(value: string | undefined | null, maxEmojis: number): string {
  if (!value) return '';
  return `${emojiCount(value)}/${maxEmojis} emojis`;
}

export function validateMaxEmojis(value: string | undefined | null, maxEmojis: number): boolean {
  if (!value) return true;
  return emojiCount(value) <= maxEmojis;
}
