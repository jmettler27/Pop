import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getPlayableQuestion } from '@/backend/services/question/playable-actions';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { type QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

/**
 * The base question for an in-game view, fetched via a server action that redacts
 * the answer for players/spectators until the question ends (organizers always get
 * it in full). Drop-in replacement for `useQuestion`/`useQuestionOnce` from
 * `useBaseQuestionHooks` inside the game — production Firestore rules no longer let
 * gameplay read `questions/{id}` directly.
 *
 * `gameId` and the reveal state come from `GameContext`; the query refetches when
 * the current question ends so the answer appears.
 */
export function usePlayableQuestion(
  roundId: string | null | undefined,
  questionType: QuestionType | null | undefined,
  questionId: string | null | undefined
) {
  const game = useGame();
  const gameId = game?.id ?? null;
  const answerRevealed = game?.status === GameStatus.QUESTION_END;
  const enabled = Boolean(gameId && roundId && questionType && questionId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['playableQuestion', gameId, roundId, questionId, questionType, answerRevealed],
    queryFn: () =>
      getPlayableQuestion(gameId as string, roundId as string, questionType as QuestionType, questionId as string),
    enabled,
    staleTime: Infinity,
  });

  // Memoized on `data` (mirrors useGame/useRound) so `baseQuestion` keeps its identity across renders
  // when the payload hasn't changed — consumers derive `useMemo`s (e.g. shuffles) from it.
  const baseQuestion = useMemo(
    () => (data ? (QuestionFactory.createBaseQuestion(data.type as QuestionType, data) as AnyBaseQuestion) : null),
    [data]
  );

  return { baseQuestion, baseQuestionLoading: enabled && isLoading, baseQuestionError: error };
}
