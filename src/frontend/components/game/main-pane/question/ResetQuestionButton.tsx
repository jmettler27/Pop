import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { resetQuestion } from '@/backend/services/question/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { type QuestionType } from '@/models/questions/question-type';
import { PlayerStatus } from '@/models/users/player';

const messages = defineMessages('frontend.game.bottom.ResetQuestionButton', {
  resetQuestion: 'Reset question',
});

interface ResetQuestionButtonProps {
  questionType: QuestionType;
}

export default function ResetQuestionButton({ questionType }: ResetQuestionButtonProps) {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo } = gameRepositories;

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    const playerIds = await playerRepo.getAllPlayerIds();
    await Promise.all([
      playerRepo.updateAllPlayersStatus(PlayerStatus.IDLE, playerIds),
      resetQuestion(game!.id as string, currentRound as string, game!.currentQuestion as string, questionType),
    ]);
  });

  return (
    <Button
      variant="outlined"
      color="warning"
      startIcon={<RestartAltIcon />}
      onClick={handleResetQuestion}
      disabled={isResetting}
    >
      {intl.formatMessage(messages.resetQuestion)}
    </Button>
  );
}
