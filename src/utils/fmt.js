import { cloneElement, isValidElement } from 'react';

/**
 * Apply position-based keys to any React elements inside a `chunks` array.
 * This is needed in tag factories for nested rich-text tags: when `<u><b>…</b></u>`
 * is rendered, the `u` factory receives `chunks = [<strong>…</strong>]` — an array
 * containing an unkeyed React element — which triggers React's list-key warning.
 */
export function keyChunks(chunks) {
  if (!Array.isArray(chunks)) return chunks;
  return chunks.map((c, i) => (isValidElement(c) ? cloneElement(c, { key: i }) : c));
}

/**
 * Wraps `intl.formatMessage` and assigns position-based keys to any React
 * elements in the returned array, fixing the "each child in a list should
 * have a unique key" warning that arises from react-intl rich-text tags.
 *
 * Usage:
 *   fmt(formatMessage, messages.foo, { value: 42, ...richTags })
 */
export default function fmt(formatMessage, message, values) {
  const result = formatMessage(message, values);
  if (!Array.isArray(result)) return result;
  return result.map((part, i) => (isValidElement(part) ? cloneElement(part, { key: i }) : part));
}
