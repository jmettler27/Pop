import { cloneElement, isValidElement, type ReactNode } from 'react';

import { type IntlShape, type MessageDescriptor } from 'react-intl';

export function keyChunks(chunks: ReactNode[]): ReactNode[] {
  if (!Array.isArray(chunks)) return chunks;
  return chunks.map((c, i) => (isValidElement(c) ? cloneElement(c, { key: i }) : c));
}

export default function fmt(
  formatMessage: IntlShape['formatMessage'],
  message: MessageDescriptor,
  values?: Parameters<IntlShape['formatMessage']>[1]
): string | ReactNode[] {
  const result = formatMessage(message, values);
  if (!Array.isArray(result)) return result;
  return result.map((part, i) => (isValidElement(part) ? cloneElement(part, { key: i }) : part));
}
