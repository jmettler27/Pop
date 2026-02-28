import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import { UserRole } from '@/backend/models/users/User';

import { useGameContext, useRoleContext } from '@/frontend/contexts';
import BuzzerPlayers from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerPlayers';
import BuzzerPlayerController from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerPlayerController';
import BuzzerSpectatorController from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerSpectatorController';
import LabelOrganizerController from '@/frontend/components/game/bottom-pane/question/label/LabelOrganizerController';

export default function LabelBottomPane({ baseQuestion }) {
  const game = useGameContext();
  console.log('BuzzerBottomPane game', game, baseQuestion);

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    baseQuestion.type,
    game.id,
    game.currentRound
  );

  const { data: questionPlayers, loading, error } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion);

  if (error) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(error)}
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!questionPlayers) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <LabelController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

function LabelController({ baseQuestion, questionPlayers }) {
  const myRole = useRoleContext();

  switch (myRole) {
    case UserRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case UserRole.ORGANIZER:
      return <LabelOrganizerController questionPlayers={questionPlayers} baseQuestion={baseQuestion} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
