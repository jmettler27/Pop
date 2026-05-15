'use client';

import { useMemo } from 'react';

import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';
import { shuffleIndices } from '@/backend/utils/arrays';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import ReorderingOrganizerPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingOrganizerPane';
import ReorderingPlayerPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingPlayerPane';
import ReorderingSpectatorPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingSpectatorPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import type { GameRounds } from '@/models/games/game';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';
import { ParticipantRole } from '@/models/users/participant';

export default function ReorderingMiddlePane({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const game = useGame();
  if (!game) return null;

  const myRole = useRole();

  // Initialize random order (consistent for the session)
  const randomMapping = useMemo(() => shuffleIndices(baseQuestion.items?.length ?? 0), [baseQuestion.items?.length]);

  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id as string, game.currentRound as string);
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

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <ReorderingOrganizerPane baseQuestion={baseQuestion} />;
    case ParticipantRole.PLAYER:
      return (
        <ReorderingPlayerPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion as GameReorderingQuestion}
          randomMapping={randomMapping}
        />
      );
    case ParticipantRole.SPECTATOR:
      return <ReorderingSpectatorPane baseQuestion={baseQuestion} randomMapping={randomMapping} />;
    default:
      return <></>;
  }
}
