import { ParticipantRole } from '@/backend/models/users/Participant';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import BuzzerPlayerController from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerPlayerController';
import BuzzerOrganizerController from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerOrganizerController';
import BuzzerSpectatorController from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerSpectatorController';
import BuzzerPlayers from '@/frontend/components/game/bottom-pane/question/buzzer/BuzzerPlayers';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';

export default function BuzzerBottomPane({ baseQuestion }) {
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
  console.log('BuzzerBottomPane players', questionPlayers);

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <BuzzerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

function BuzzerController({ baseQuestion, questionPlayers }) {
  const myRole = useRoleContext();
  console.log('BuzzerController myRole', myRole);

  switch (myRole) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <BuzzerOrganizerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
