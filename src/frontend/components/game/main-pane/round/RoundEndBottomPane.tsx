'use client';

import { useParams } from 'next/navigation';

import { useIntl } from 'react-intl';

import { returnToGameHome } from '@/backend/services/game/actions';
import GameChooserTeamAnnouncement from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndGameButton from '@/frontend/components/game/main-pane/EndGameButton';
import GoGameHomeButton from '@/frontend/components/game/main-pane/GoGameHomeButton';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import type { GameRounds } from '@/models/games/game';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.RoundEndBottomPane', {
  theRound: 'the round',
});

export default function RoundEndBottomPane({ endedRound }: { endedRound: AnyRound }) {
  const intl = useIntl();
  const { id } = useParams();
  const gameId = id as string;
  const myRole = useRole();
  const game = useGame();
  if (!game) return null;

  const [handleClick, isHandling] = useAsyncAction(async () => {
    await returnToGameHome(gameId as string);
  });

  const rounds = game.rounds ?? [];
  const isFinalRound = (endedRound.order ?? 0) === rounds.length - 1;

  return (
    <div className="flex flex-col h-full justify-around items-center">
      {!isFinalRound && (
        <span className="2xl:text-4xl font-bold">
          <GameChooserTeamAnnouncement /> {intl.formatMessage(messages.theRound)} {(endedRound.order ?? 0) + 1 + 1}
        </span>
      )}
      {myRole === ParticipantRole.ORGANIZER &&
        (isFinalRound ? <EndGameButton /> : <GoGameHomeButton onClick={handleClick} disabled={isHandling} />)}
    </div>
  );
}
