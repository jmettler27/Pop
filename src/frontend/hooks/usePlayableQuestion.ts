import { useMemo } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { collection, doc } from 'firebase/firestore';

import { getPlayableQuestion } from '@/backend/services/question/playable-actions';
import { firestore } from '@/firebase/firebase';
import { useFirestoreDocument } from '@/frontend/hooks/firestore/useFirestoreDocument';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { QuestionType } from '@/models/questions/question-type';
import QuestionFactory, { type AnyBaseQuestion } from '@/models/questions/QuestionFactory';

// Question types whose playable payload is redacted progressively as the question runs
// (not just flipped open at QUESTION_END). For these we watch the game-question doc and
// fold its reveal state into the query key so the payload refetches as more unlocks.
const PROGRESSIVE_REVEAL_TYPES = new Set<QuestionType>([QuestionType.PROGRESSIVE_CLUES, QuestionType.LABELLING]);

/**
 * A short signature of the game-question doc's reveal state. It only needs to *change*
 * when more of the answer should become visible — the server recomputes the redaction
 * from its own fresh read, so this value is never trusted.
 */
function revealProgressKey(
  questionType: QuestionType | null | undefined,
  gameQuestionData: Record<string, unknown> | null | undefined
): string {
  if (!gameQuestionData) return '';
  if (questionType === QuestionType.PROGRESSIVE_CLUES) {
    return `clue:${(gameQuestionData as { currentClueIdx?: number }).currentClueIdx ?? -1}`;
  }
  if (questionType === QuestionType.LABELLING) {
    const revealed = (gameQuestionData as { revealed?: Record<string, unknown>[] }).revealed ?? [];
    return `label:${revealed.map((entry) => (entry && Object.keys(entry).length > 0 ? '1' : '0')).join('')}`;
  }
  return '';
}

/**
 * The base question for an in-game view, fetched via a server action that redacts
 * the answer for players/spectators until the question ends (organizers always get
 * it in full). Drop-in replacement for `useQuestion`/`useQuestionOnce` from
 * `useBaseQuestionHooks` inside the game — production Firestore rules no longer let
 * gameplay read `questions/{id}` directly.
 *
 * `gameId` and the reveal state come from `GameContext`; the query refetches when
 * the current question ends so the answer appears, and — for progressively-revealed
 * types — as the game-question doc's reveal state advances.
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

  // Watch the game-question doc only for types that reveal answer data mid-question; this
  // shares the panes' existing snapshot for that doc (deduped per path), so no extra read.
  const watchReveal = Boolean(questionType && PROGRESSIVE_REVEAL_TYPES.has(questionType));
  const gameQuestionRef =
    watchReveal && gameId && roundId && questionId
      ? doc(collection(firestore, 'games', gameId, 'rounds', roundId, 'questions'), questionId)
      : null;
  const { data: gameQuestionData } = useFirestoreDocument(gameQuestionRef);
  const revealKey = revealProgressKey(questionType, gameQuestionData);

  const { data, isLoading, error } = useQuery({
    queryKey: ['playableQuestion', gameId, roundId, questionId, questionType, answerRevealed, revealKey],
    queryFn: () =>
      getPlayableQuestion(gameId as string, roundId as string, questionType as QuestionType, questionId as string),
    enabled,
    staleTime: Infinity,
    // As `revealKey` advances (progressive-clues), keep showing the current payload while the
    // next one loads — no unmount of the pane, no loading-screen flicker between clues.
    placeholderData: keepPreviousData,
  });

  // Memoized on `data` (mirrors useGame/useRound) so `baseQuestion` keeps its identity across renders
  // when the payload hasn't changed — consumers derive `useMemo`s (e.g. shuffles) from it.
  const baseQuestion = useMemo(
    () => (data ? (QuestionFactory.createBaseQuestion(data.type as QuestionType, data) as AnyBaseQuestion) : null),
    [data]
  );

  return { baseQuestion, baseQuestionLoading: enabled && isLoading, baseQuestionError: error };
}
