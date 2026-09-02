const DICEBEAR_VERSION = '10.x';
const DICEBEAR_STYLE = 'avataaars';

export const generateAvatarUrl = (seed: string): string =>
  `https://api.dicebear.com/${DICEBEAR_VERSION}/${DICEBEAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;
