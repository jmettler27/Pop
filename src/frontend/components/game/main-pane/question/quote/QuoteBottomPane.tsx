'use client';

import { CircularProgress } from '@mui/material';

import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import BuzzerPlayers from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayers';
import BuzzerSpectatorController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerSpectatorController';
import QuoteOrganizerController from '@/frontend/components/game/main-pane/question/quote/QuoteOrganizerController';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import type { GameRounds } from '@/models/games/game';
import { QuoteQuestion } from '@/models/questions/quote';
import { ParticipantRole } from '@/models/users/participant';

export default function QuoteBottomPane({ baseQuestion }: { baseQuestion: QuoteQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameQuoteQuestionRepository(game.id as string, game.currentRound as string);
  const { data: questionPlayers, loading, error } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion as string);

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
      <div className="basis-3/4">
        <QuoteController baseQuestion={baseQuestion} questionPlayers={questionPlayers} />
      </div>
      <div className="basis-1/4">
        <BuzzerPlayers questionPlayers={questionPlayers} />
      </div>
    </div>
  );
}

function QuoteController({
  baseQuestion,
  questionPlayers,
}: {
  baseQuestion: QuoteQuestion;
  questionPlayers: Record<string, unknown>;
}) {
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
