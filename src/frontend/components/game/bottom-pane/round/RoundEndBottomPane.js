import { UserRole } from '@/backend/models/users/User';

import { returnToGameHome } from '@/backend/services/game/actions';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import GameChooserTeamAnnouncement from '@/frontend/components/game/GameChooserTeamAnnouncement';
import GoGameHomeButton from '@/frontend/components/game/bottom-pane/GoGameHomeButton';
import EndGameButton from '@/frontend/components/game/bottom-pane/EndGameButton';

import { useParams } from 'next/navigation';

export default function RoundEndBottomPane({ endedRound, lang = DEFAULT_LOCALE }) {
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
          <GameChooserTeamAnnouncement /> {ROUND_TEXT[lang]} {endedRound.order + 1 + 1}
        </span>
      )}
      {myRole === UserRole.ORGANIZER &&
        (isFinalRound ? <EndGameButton /> : <GoGameHomeButton onClick={handleClick} disabled={isHandling} />)}
    </div>
  );
}

const ROUND_TEXT = {
  en: 'the round',
  'fr-FR': 'la manche',
};
