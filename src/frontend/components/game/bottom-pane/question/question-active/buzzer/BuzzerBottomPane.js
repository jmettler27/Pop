import { UserRole } from '@/backend/models/users/User';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import BuzzerPlayerController from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/controller/BuzzerPlayerController';
import BuzzerOrganizerController from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/controller/BuzzerOrganizerController';
import BuzzerSpectatorController from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/controller/BuzzerSpectatorController';
import BuzzerPlayers from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/players/BuzzerPlayers';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';

export default function BuzzerBottomPane({ baseQuestion }) {
  const game = useGameContext();
  console.log('BuzzerBottomPane game', game, baseQuestion);

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    baseQuestion.type,
    game.id,
    game.currentRound
  );

  const { players, loading: playersLoading, error: playersError } = gameQuestionRepo.usePlayers(game.currentQuestion);

  if (playersError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(playersError)}
      </p>
    );
  }
  if (playersLoading) {
    return <></>;
  }
  if (!players) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <BuzzerController baseQuestion={baseQuestion} players={players} />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <BuzzerPlayers players={players} />
      </div>
    </div>
  );
}

function BuzzerController({ baseQuestion, players }) {
  const myRole = useRoleContext();

  switch (myRole) {
    case UserRole.PLAYER:
      return <BuzzerPlayerController players={players} />;
    case UserRole.ORGANIZER:
      return <BuzzerOrganizerController baseQuestion={baseQuestion} players={players} />;
    default:
      return <BuzzerSpectatorController players={players} />;
  }
}
