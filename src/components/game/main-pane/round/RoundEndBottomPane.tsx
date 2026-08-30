'use client';

import { useIntl } from 'react-intl';

import { updateGame } from '@/api';
import GameChooserTeamAnnouncement from '@/components/game/chooser/GameChooserTeamAnnouncement';
import EndGameButton from '@/components/game/main-pane/EndGameButton';
import GoGameHomeButton from '@/components/game/main-pane/GoGameHomeButton';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGame from '@/hooks/useGame';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
import defineMessages from '@/i18n/defineMessages';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.RoundEndBottomPane', {
  theRound: 'the round',
});

export default function RoundEndBottomPane({ endedRound }: { endedRound: AnyRound }) {
  const intl = useIntl();
  const gameId = useGameId();
  const role = useRole();
  const game = useGame();

  const [handleClick, isHandling] = useAsyncAction(async () => {
    await updateGame(gameId as string, { action: 'return_to_home' });
  });

  if (!game) return null;

  const rounds = game.rounds ?? [];
  const isFinalRound = (endedRound.order ?? 0) === rounds.length - 1;

  return (
    <div className="flex flex-col h-full justify-around items-center">
      {!isFinalRound && (
        <span className="2xl:text-4xl font-bold">
          <GameChooserTeamAnnouncement /> {intl.formatMessage(messages.theRound)} {(endedRound.order ?? 0) + 1 + 1}
        </span>
      )}
      {role === ParticipantRole.ORGANIZER &&
        (isFinalRound ? <EndGameButton /> : <GoGameHomeButton onClick={handleClick} disabled={isHandling} />)}
    </div>
  );
}
