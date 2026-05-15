import { CircularProgress } from '@mui/material';

import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import QuoteOrganizerController from '@/frontend/components/game/main-pane/question/quote/QuoteOrganizerController';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/Participant';

export default function QuoteBottomPane({ baseQuestion }) {
  const game = useGame();

  const gameQuestionRepo = new GameQuoteQuestionRepository(game.id, game.currentRound);
  const { data: questionPlayers, loading, error } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
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
  const myRole = useRole();

  switch (myRole) {
    case ParticipantRole.PLAYER:
      return <BuzzerPlayerController questionPlayers={questionPlayers} />;
    case ParticipantRole.ORGANIZER:
      return <QuoteOrganizerController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />;
    default:
      return <BuzzerSpectatorController questionPlayers={questionPlayers} />;
  }
}
