import { useParams } from 'next/navigation';

import { useIntl } from 'react-intl';

import { ParticipantRole } from '@/backend/models/users/Participant';
import { returnToGameHome } from '@/backend/services/game/actions';
import GameChooserTeamAnnouncement from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndGameButton from '@/frontend/components/game/main-pane/EndGameButton';
import GoGameHomeButton from '@/frontend/components/game/main-pane/GoGameHomeButton';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.RoundEndBottomPane', {
  theRound: 'the round',
});

export default function RoundEndBottomPane({ endedRound }) {
  const intl = useIntl();
  const { id: gameId } = useParams();
  const myRole = useRole();
  const game = useGame();

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
