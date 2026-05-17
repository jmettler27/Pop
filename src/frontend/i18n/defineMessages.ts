import { defineMessages as intlDefineMessages, type MessageDescriptor } from 'react-intl';

export default function defineMessages(
  prefix: string,
  messages: Record<string, string>
): Record<string, MessageDescriptor> {
  const entries = Object.keys(messages).map((key) => [key, { id: `${prefix}.${key}`, defaultMessage: messages[key] }]);
  return intlDefineMessages(Object.fromEntries(entries));
}
