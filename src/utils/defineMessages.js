import { defineMessages as intlDefineMessages } from 'react-intl';

/**
 * Wraps react-intl's defineMessages to auto-prefix each message ID with a namespace.
 *
 * Usage:
 *   const messages = defineMessages('components.home.HomeBar', {
 *     games: 'Games',
 *     logout: 'Logout',
 *   });
 *   // → { games: { id: 'components.home.HomeBar.games', defaultMessage: 'Games' }, ... }
 *
 * @param {string} prefix - dot-separated namespace for this component
 * @param {Record<string, string>} messages - key → English default message
 */
export default function defineMessages(prefix, messages) {
  const entries = Object.keys(messages).map((key) => [
    key,
    {
      id: `${prefix}.${key}`,
      defaultMessage: messages[key],
    },
  ]);
  return intlDefineMessages(Object.fromEntries(entries));
}
