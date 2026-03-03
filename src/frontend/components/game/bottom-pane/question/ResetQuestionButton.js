import { resetQuestion } from '@/backend/services/question/actions';

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { PlayerStatus } from '@/backend/models/users/Player';

const messages = defineMessages('frontend.game.bottom.ResetQuestionButton', {
  resetQuestion: 'Reset question',
});

/**
 * Reset the question
 * @param {Object} props
 * @param {string} props.lang - Language code
 * @param {string} props.questionType - Type of question to reset
 * @returns
 */
export default function ResetQuestionButton({ questionType }) {
  const intl = useIntl();
  const game = useGameContext();
  const { playerRepo } = useGameRepositoriesContext();

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    const playerIds = await playerRepo.getAllPlayerIds();
    await Promise.all([
      playerRepo.updateAllPlayersStatus(PlayerStatus.IDLE, playerIds),
      resetQuestion(game.id, game.currentRound, game.currentQuestion, questionType),
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
