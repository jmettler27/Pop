'use client';

import { useMemo } from 'react';

import ErrorScreen from '@/frontend/components/ErrorScreen';
import ReorderingOrganizerPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingOrganizerPane';
import ReorderingPlayerPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingPlayerPane';
import ReorderingSpectatorPane from '@/frontend/components/game/main-pane/question/reordering/ReorderingSpectatorPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useRole from '@/frontend/hooks/useRole';
import { QuestionType } from '@/models/questions/question-type';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';
import { ParticipantRole } from '@/models/users/participant';
import { shuffleIndices } from '@/utils/arrays';

export default function ReorderingMiddlePane({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const myRole = useRole();
  // Initialize random order (consistent for the session)
  const randomMapping = useMemo(() => shuffleIndices(baseQuestion.items?.length ?? 0), [baseQuestion.items?.length]);

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.REORDERING, questionId);

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
      return (
        <ReorderingOrganizerPane baseQuestion={baseQuestion} gameQuestion={gameQuestion as GameReorderingQuestion} />
      );
    case ParticipantRole.PLAYER:
      return (
        <ReorderingPlayerPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion as GameReorderingQuestion}
          randomMapping={randomMapping}
        />
      );
    case ParticipantRole.SPECTATOR:
      return (
        <ReorderingSpectatorPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion as GameReorderingQuestion}
          randomMapping={randomMapping}
        />
      );
    default:
      return <></>;
  }
}
