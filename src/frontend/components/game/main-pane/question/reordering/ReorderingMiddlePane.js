'use client';

import { useMemo } from 'react';

import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { shuffleIndices } from '@/backend/utils/arrays';
import { ParticipantRole } from '@/backend/models/users/Participant';

import ReorderingOrganizerPane from './ReorderingOrganizerPane';
import ReorderingPlayerPane from './ReorderingPlayerPane';
import ReorderingSpectatorPane from './ReorderingSpectatorPane';

export default function ReorderingMiddlePane({ baseQuestion }) {
  const game = useGame();
  const myRole = useRole();

  // Initialize random order (consistent for the session)
  const randomMapping = useMemo(() => shuffleIndices(baseQuestion.items.length), [baseQuestion.items.length]);

  // Get game question data
  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <LoadingScreen />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  // Route to the appropriate pane based on role
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
