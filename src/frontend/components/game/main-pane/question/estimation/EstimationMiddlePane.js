'use client';

import { ParticipantRole } from '@/backend/models/users/Participant';
import GameEstimationQuestionRepository from '@/backend/repositories/question/GameEstimationQuestionRepository';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';

import EstimationOrganizerPane from './EstimationOrganizerPane';
import EstimationPlayerPane from './EstimationPlayerPane';
import EstimationSpectatorPane from './EstimationSpectatorPane';

export default function EstimationMiddlePane({ baseQuestion }) {
  const game = useGame();
  const myRole = useRole();

  const gameQuestionRepo = new GameEstimationQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <EstimationOrganizerPane baseQuestion={baseQuestion} gameQuestion={gameQuestion} />;
    case ParticipantRole.PLAYER:
      return <EstimationPlayerPane baseQuestion={baseQuestion} gameQuestion={gameQuestion} />;
    case ParticipantRole.SPECTATOR:
      return <EstimationSpectatorPane baseQuestion={baseQuestion} gameQuestion={gameQuestion} />;
    default:
      return <></>;
  }
}
