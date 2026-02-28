import { resetQuestion } from '@/backend/services/question/actions';

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { PlayerStatus } from '@/backend/models/users/Player';

/**
 * Reset the question
 * @param {Object} props
 * @param {string} props.lang - Language code
 * @param {string} props.questionType - Type of question to reset
 * @returns
 */
export default function ResetQuestionButton({ lang = DEFAULT_LOCALE, questionType }) {
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
      {RESET_QUESTION_BUTTON_LABEL[lang]}
    </Button>
  );
}

const RESET_QUESTION_BUTTON_LABEL = {
  en: 'Reset question',
  'fr-FR': 'Réinitialiser la question',
};
