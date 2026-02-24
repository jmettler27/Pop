import { UserRole } from '@/backend/models/users/User';

import GameQuoteQuestionRepository from '@/backend/repositories/question/game/GameQuoteQuestionRepository';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import QuoteOrganizerController from '@/frontend/components/game/bottom-pane/question/question-active/quote/controller/QuoteOrganizerController';
import BuzzerSpectatorController from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/controller/BuzzerSpectatorController';
import BuzzerPlayerController from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/controller/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/bottom-pane/question/question-active/buzzer/players/BuzzerPlayers';

export default function QuoteBottomPane({ baseQuestion }) {
  const game = useGameContext();

  const gameQuestionRepo = new GameQuoteQuestionRepository(game.id, game.currentRound);
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
        <QuoteController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>

      {/* Right part: list of Quote players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

function QuoteController({ baseQuestion, questionPlayers }) {
  const myRole = useRoleContext();

  switch (myRole) {
    case UserRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case UserRole.ORGANIZER:
      return <QuoteOrganizerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
