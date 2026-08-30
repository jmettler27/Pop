import type { IntlShape, MessageDescriptor } from 'react-intl';

import defineMessages from '@/i18n/defineMessages';
import { BlindtestType } from '@/models/questions/blindtest';

const messages = defineMessages('frontend.models.blindtestType', {
  song: 'Music',
  sound: 'Sound',
});

const BlindtestTypeToMessage: Record<BlindtestType, MessageDescriptor> = {
  [BlindtestType.SONG]: messages.song,
  [BlindtestType.SOUND]: messages.sound,
};

export function blindtestTypeToTitle(intl: IntlShape, type: BlindtestType): string {
  return intl.formatMessage(BlindtestTypeToMessage[type]);
}
