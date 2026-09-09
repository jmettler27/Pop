'use client';

import { useMemo } from 'react';

import ErrorScreen from '@/components/ErrorScreen';
import ReorderingOrganizerPane from '@/components/game/main-pane/question/reordering/ReorderingOrganizerPane';
import ReorderingPlayerPane from '@/components/game/main-pane/question/reordering/ReorderingPlayerPane';
import ReorderingSpectatorPane from '@/components/game/main-pane/question/reordering/ReorderingSpectatorPane';
import LoadingScreen from '@/components/LoadingScreen';
import { shuffleIndices } from '@/helpers/arrays';
import { useQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useRole from '@/hooks/useRole';
import { QuestionType } from '@/models/questions/question-type';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';
import { ParticipantRole } from '@/models/users/participant';

export default function ReorderingMiddlePane({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const role = useRole();
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

  switch (role) {
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
