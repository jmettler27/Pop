'use client';

import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import { useQuestionPlayers as useBuzzerQuestionPlayers } from '@/frontend/hooks/firestore/question/useGameBuzzerQuestionHooks';
import { useQuestionPlayers as useQuoteQuestionPlayers } from '@/frontend/hooks/firestore/question/useGameQuoteQuestionHooks';
import useGame from '@/frontend/hooks/useGame';
import { GameRounds } from '@/models/games/game';
import { QuestionType } from '@/models/questions/question-type';

export default function MobileBuzzerControl() {
  const game = useGame();

  const currentRound = game instanceof GameRounds ? (game.currentRound as string) : undefined;
  const questionType = game?.currentQuestionType as QuestionType;

  const gameQuestionRepo = game
    ? GameQuestionRepositoryFactory.createRepository(questionType, game.id as string, currentRound as string)
    : null;

  // GameQuoteQuestionRepository overrides useQuestionPlayers with its own subcollection path; every other
  // question type reachable here (Basic, Blindtest, Emoji, Image, Labelling, ProgressiveClues) inherits it
  // unchanged from GameBuzzerQuestionRepository. Both hooks are called unconditionally (Rules of Hooks) —
  // only the one matching the actual runtime type is given a non-null repo.
  const isQuote = gameQuestionRepo instanceof GameQuoteQuestionRepository;
  const buzzerRepo = !isQuote ? (gameQuestionRepo as unknown as GameBuzzerQuestionRepository | null) : null;
  const quoteRepo = isQuote ? (gameQuestionRepo as unknown as GameQuoteQuestionRepository | null) : null;

  const buzzerResult = useBuzzerQuestionPlayers(buzzerRepo, game?.currentQuestion as string);
  const quoteResult = useQuoteQuestionPlayers(quoteRepo, game?.currentQuestion as string);
  const { data: questionPlayers, loading, error } = isQuote ? quoteResult : buzzerResult;

  if (!game) return null;
  if (error || loading || !questionPlayers) return null;

  return (
    <div className="flex items-center justify-center h-full p-4">
      <BuzzerPlayerController questionPlayers={questionPlayers} compact />
    </div>
  );
}
