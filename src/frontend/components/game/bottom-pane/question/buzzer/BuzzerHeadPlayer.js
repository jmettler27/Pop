import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import PlayerName from '@/frontend/components/game/PlayerName';

const messages = defineMessages('frontend.game.bottom.BuzzerHeadPlayer', {
  noBuzzersYet: 'No one has guessed yet',
});

export default function BuzzerHeadPlayer({ buzzed }) {
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
