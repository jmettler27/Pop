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

// Question types whose playable payload is redacted progressively as the current question
// runs (not just flipped open at QUESTION_END). For these we watch a reveal-state doc and
// fold its state into the query key so the payload refetches as more unlocks. Enumeration
// tracks `realtime/players`; the rest track the game-question doc.
const PROGRESSIVE_REVEAL_TYPES = new Set<QuestionType>([
  QuestionType.PROGRESSIVE_CLUES,
  QuestionType.LABELLING,
  QuestionType.QUOTE,
  QuestionType.ENUMERATION,
]);

/**
 * A short signature of the reveal-state doc. It only needs to *change* when more of the
 * answer should become visible — the server recomputes the redaction from its own fresh
 * read, so this value is never trusted.
 */
function revealProgressKey(
  questionType: QuestionType | null | undefined,
  revealStateDoc: Record<string, unknown> | null | undefined
): string {
  if (!revealStateDoc) return '';
  if (questionType === QuestionType.PROGRESSIVE_CLUES) {
    return `clue:${(revealStateDoc as { currentClueIdx?: number }).currentClueIdx ?? -1}`;
  }
  if (questionType === QuestionType.LABELLING) {
    const revealed = (revealStateDoc as { revealed?: Record<string, unknown>[] }).revealed ?? [];
    return `label:${revealed.map((entry) => (entry && Object.keys(entry).length > 0 ? '1' : '0')).join('')}`;
  }
  if (questionType === QuestionType.QUOTE) {
    // Small object (a flag per toGuess element, nested per quote part); only grows as
    // things are revealed, so stringifying it is a stable refetch trigger.
    const revealed = (revealStateDoc as { revealed?: unknown }).revealed;
    return `quote:${revealed ? JSON.stringify(revealed) : ''}`;
  }
  if (questionType === QuestionType.ENUMERATION) {
    // `realtime/players` doc: challenger.cited is an index→timestamp map that grows as the
    // organizer credits citations during the challenge phase.
    const cited = (revealStateDoc as { challenger?: { cited?: Record<string, unknown> } }).challenger?.cited ?? {};
    return `enum:${Object.keys(cited)
      .map(Number)
      .sort((a, b) => a - b)
      .join(',')}`;
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

  // Watch a reveal-state doc only for a progressively-revealed type that is the *current*
  // question (a past one is served whole, a future one has nothing revealed). The watched
  // doc is one the panes already snapshot for this question (deduped per path), so no extra read.
  const isCurrentQuestion = Boolean(questionId && game?.currentQuestion === questionId);
  const watchReveal = isCurrentQuestion && Boolean(questionType && PROGRESSIVE_REVEAL_TYPES.has(questionType));
  const questionsCol =
    gameId && roundId ? collection(firestore, 'games', gameId, 'rounds', roundId, 'questions') : null;
  const revealStateRef =
    !watchReveal || !questionsCol || !questionId
      ? null
      : questionType === QuestionType.ENUMERATION
        ? doc(questionsCol, questionId, 'realtime', 'players')
        : doc(questionsCol, questionId);
  const { data: revealStateDoc } = useFirestoreDocument(revealStateRef);
  const revealKey = revealProgressKey(questionType, revealStateDoc);

  const { data, isLoading, error } = useQuery({
    queryKey: ['playableQuestion', gameId, roundId, questionId, questionType, answerRevealed, revealKey],
    queryFn: () =>
      getPlayableQuestion(gameId as string, roundId as string, questionType as QuestionType, questionId as string),
    enabled,
    staleTime: Infinity,
    // As `revealKey` advances, keep showing the current payload while the next one loads —
    // no unmount of the pane, no loading-screen flicker between reveals.
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
