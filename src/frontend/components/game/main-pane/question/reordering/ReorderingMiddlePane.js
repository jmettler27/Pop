'use client';

import { useMemo } from 'react';

import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';
import { shuffleIndices } from '@/backend/utils/arrays';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { ParticipantRole } from '@/models/users/Participant';

import ReorderingOrganizerPane from './ReorderingOrganizerPane';
import ReorderingPlayerPane from './ReorderingPlayerPane';
import ReorderingSpectatorPane from './ReorderingSpectatorPane';

export default function ReorderingMiddlePane({ baseQuestion }) {
  const game = useGame();
  const myRole = useRole();

  // Initialize random order (consistent for the session)
  const randomMapping = useMemo(() => shuffleIndices(baseQuestion.items.length), [baseQuestion.items.length]);

  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id, game.currentRound);
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
      return <ReorderingOrganizerPane baseQuestion={baseQuestion} />;
    case ParticipantRole.PLAYER:
      return (
        <ReorderingPlayerPane baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomMapping={randomMapping} />
      );
    case ParticipantRole.SPECTATOR:
      return <ReorderingSpectatorPane baseQuestion={baseQuestion} randomMapping={randomMapping} />;
    default:
      return <></>;
  }
}
