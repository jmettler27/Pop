import { ParticipantRole } from '@/backend/models/users/Participant';

import { returnToGameHome } from '@/backend/services/game/actions';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import GameChooserTeamAnnouncement from '@/frontend/components/game/GameChooserTeamAnnouncement';
import GoGameHomeButton from '@/frontend/components/game/bottom-pane/GoGameHomeButton';
import EndGameButton from '@/frontend/components/game/bottom-pane/EndGameButton';

import { useParams } from 'next/navigation';

const messages = defineMessages('frontend.game.bottom.RoundEndBottomPane', {
  theRound: 'the round',
});

export default function RoundEndBottomPane({ endedRound }) {
  const intl = useIntl();
  const { id: gameId } = useParams();
  const myRole = useRoleContext();
  const game = useGameContext();

  const [handleClick, isHandling] = useAsyncAction(async () => {
    await returnToGameHome(gameId);
  });

  const isFinalRound = endedRound.order === game.rounds.length - 1;

  return (
    <div className="flex flex-col h-full justify-around items-center">
      {!isFinalRound && (
        <span className="2xl:text-4xl font-bold">
          <GameChooserTeamAnnouncement /> {intl.formatMessage(messages.theRound)} {endedRound.order + 1 + 1}
        </span>
      )}
      {myRole === ParticipantRole.ORGANIZER &&
        (isFinalRound ? <EndGameButton /> : <GoGameHomeButton onClick={handleClick} disabled={isHandling} />)}
    </div>
  );
}
