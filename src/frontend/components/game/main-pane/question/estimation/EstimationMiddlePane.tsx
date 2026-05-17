'use client';

import GameEstimationQuestionRepository from '@/backend/repositories/question/GameEstimationQuestionRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import EstimationOrganizerPane from '@/frontend/components/game/main-pane/question/estimation/EstimationOrganizerPane';
import EstimationPlayerPane from '@/frontend/components/game/main-pane/question/estimation/EstimationPlayerPane';
import EstimationSpectatorPane from '@/frontend/components/game/main-pane/question/estimation/EstimationSpectatorPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameRounds } from '@/models/games/game';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';
import { ParticipantRole } from '@/models/users/participant';

export default function EstimationMiddlePane({ baseQuestion }: { baseQuestion: EstimationQuestion }) {
  const game = useGame();
  if (!game) return null;

  const myRole = useRole();

  const gameQuestionRepo = new GameEstimationQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameEstimationQuestion;

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <EstimationOrganizerPane baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />;
    case ParticipantRole.PLAYER:
      return <EstimationPlayerPane baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />;
    case ParticipantRole.SPECTATOR:
      return <EstimationSpectatorPane baseQuestion={baseQuestion} gameQuestion={gameQuestionData} />;
    default:
      return <></>;
  }
}
