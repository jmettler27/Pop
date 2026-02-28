import { EnumerationQuestionStatus } from '@/backend/models/questions/Enumeration';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import EnumerationReflectionActiveController from '@/frontend/components/game/bottom-pane/question/enumeration/EnumerationReflectionActiveController';
import EnumerationChallengeActiveController from '@/frontend/components/game/bottom-pane/question/enumeration/EnumerationChallengeActiveController';

import { CircularProgress } from '@mui/material';

export default function EnumerationController({ baseQuestion }) {
  const game = useGameContext();

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id, game.currentRound);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion);

  const { timerRepo } = useGameRepositoriesContext();
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(gameQuestionError)}
      </p>
    );
  }
  if (timerError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(timerError)}
      </p>
    );
  }
  if (gameQuestionLoading || timerLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion || !timer) {
    return <></>;
  }

  switch (gameQuestion.status) {
    case EnumerationQuestionStatus.REFLECTION:
      return <EnumerationReflectionActiveController baseQuestion={baseQuestion} timer={timer} />;
    case EnumerationQuestionStatus.CHALLENGE:
      return <EnumerationChallengeActiveController />;
  }
}
