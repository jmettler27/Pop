'use client';

import { useIntl } from 'react-intl';

import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.mobile.RotateDevicePrompt', {
  message: 'Rotate your phone to landscape mode to play this question.',
});

export default function RotateDevicePrompt() {
  const intl = useIntl();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
      <span className="text-5xl">🔄</span>
      <span className="text-lg text-slate-300">{intl.formatMessage(messages.message)}</span>
    </div>
  );
}
