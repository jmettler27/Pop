import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import BuzzerOrganizerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerOrganizerController';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/Participant';

export default function BuzzerBottomPane({ baseQuestion }) {
  const game = useGame();

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    baseQuestion.type,
    game.id,
    game.currentRound
  );

  const { data: questionPlayers, loading, error } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion);

  if (error || loading || !questionPlayers) {
    return <></>;
  }

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
  const myRole = useRole();

  switch (myRole) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <BuzzerOrganizerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
