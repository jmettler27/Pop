'use client';

import { useMemo } from 'react';

import ErrorScreen from '@/components/ErrorScreen';
import OddOneOutOrganizerPane from '@/components/game/main-pane/question/odd-one-out/OddOneOutOrganizerPane';
import OddOneOutPlayerPane from '@/components/game/main-pane/question/odd-one-out/OddOneOutPlayerPane';
import OddOneOutSpectatorPane from '@/components/game/main-pane/question/odd-one-out/OddOneOutSpectatorPane';
import LoadingScreen from '@/components/LoadingScreen';
import { shuffleIndices } from '@/helpers/arrays';
import { useQuestion } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useRole from '@/hooks/useRole';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

export default function OddOneOutMiddlePane({ baseQuestion }: { baseQuestion: OddOneOutQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const role = useRole();
  const randomMapping = useMemo(() => shuffleIndices((baseQuestion.items ?? []).length), [baseQuestion.items]);

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.ODD_ONE_OUT, questionId);

  if (error) return <ErrorScreen inline />;
  if (loading) return <LoadingScreen inline />;
  if (!gameQuestion) return <></>;

  const gameQuestionData = gameQuestion as unknown as GameOddOneOutQuestion;

  switch (role) {
    case ParticipantRole.ORGANIZER:
      return (
        <OddOneOutOrganizerPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestionData}
          randomMapping={randomMapping}
        />
      );
    case ParticipantRole.PLAYER:
      return (
        <OddOneOutPlayerPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestionData}
          randomMapping={randomMapping}
        />
      );
    case ParticipantRole.SPECTATOR:
      return (
        <OddOneOutSpectatorPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestionData}
          randomMapping={randomMapping}
        />
      );
    default:
      return <></>;
  }
}
