import { CircularProgress } from '@mui/material';

import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';
import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import EnumerationChallengeController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationChallengeController';
import EnumerationThinkingController from '@/frontend/components/game/main-pane/question/enumeration/EnumerationThinkingController';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';

export default function EnumerationController({ baseQuestion }) {
  const game = useGame();

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id, game.currentRound);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion);

  const { timerRepo } = useGameRepositories();
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

  switch (gameQuestion.status) {
    case EnumerationQuestionStatus.THINKING:
      return <EnumerationThinkingController baseQuestion={baseQuestion} timer={timer} />;
    case EnumerationQuestionStatus.CHALLENGE:
      return <EnumerationChallengeController />;
  }
}
