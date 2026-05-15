import { CircularProgress } from '@mui/material';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import EnumerationChallengeController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationChallengeController';
import EnumerationThinkingController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationThinkingController';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import { GameRounds } from '@/models/games/game';
import { EnumerationQuestion, EnumerationQuestionStatus } from '@/models/questions/enumeration';
import { Timer } from '@/models/timer';

export default function EnumerationController({ baseQuestion }: { baseQuestion: EnumerationQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;

  const { timerRepo } = gameRepositories;
  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id as string, game.currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (gameQuestionError || timerError) {
    return <></>;
  }
  if (gameQuestionLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion || !timer) {
    return <></>;
  }

  const gameQuestionStatus = (gameQuestion as unknown as { status?: string }).status;

  switch (gameQuestionStatus) {
    case EnumerationQuestionStatus.THINKING:
      return <EnumerationThinkingController baseQuestion={baseQuestion} timer={timer as unknown as Timer} />;
    case EnumerationQuestionStatus.CHALLENGE:
      return <EnumerationChallengeController />;
  }
}
