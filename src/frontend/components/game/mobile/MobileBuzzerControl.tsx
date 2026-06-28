'use client';

import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import BuzzerPlayerController from '@/frontend/components/game/main-pane/question/buzzer/BuzzerPlayerController';
import useGame from '@/frontend/hooks/useGame';
import { GameRounds } from '@/models/games/game';
import { QuestionType } from '@/models/questions/question-type';

export default function MobileBuzzerControl() {
  const game = useGame();
  if (!game) return null;

  const currentRound = game instanceof GameRounds ? (game.currentRound as string) : undefined;
  const questionType = game.currentQuestionType as QuestionType;

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    questionType,
    game.id as string,
    currentRound as string
  );

  const typedRepo = gameQuestionRepo as unknown as {
    useQuestionPlayers: (id: string) => {
      data: Record<string, unknown> | null;
      loading: boolean;
      error: Error | undefined;
    };
  };

  const { data: questionPlayers, loading, error } = typedRepo.useQuestionPlayers(game.currentQuestion as string);

  if (error || loading || !questionPlayers) return null;

  return (
    <div className="flex items-center justify-center h-full p-4">
      <BuzzerPlayerController questionPlayers={questionPlayers} compact />
    </div>
  );
}
