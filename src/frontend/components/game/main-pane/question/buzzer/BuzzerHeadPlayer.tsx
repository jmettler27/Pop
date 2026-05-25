import { useIntl } from 'react-intl';

import PlayerName from '@/frontend/components/game/PlayerName';
import defineMessages from '@/frontend/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.BuzzerHeadPlayer', {
  noBuzzersYet: 'No one has guessed yet',
});

interface BuzzerHeadPlayerProps {
  buzzed: string[];
}

export default function BuzzerHeadPlayer({ buzzed }: BuzzerHeadPlayerProps) {
  const intl = useIntl();

  if (buzzed.length === 0) {
    return <span className="2xl:text-4xl opacity-50">{intl.formatMessage(messages.noBuzzersYet)}</span>;
  }

  return (
    <span className="2xl:text-4xl">
      <PlayerName playerId={buzzed[0]} />
    </span>
  );
}
