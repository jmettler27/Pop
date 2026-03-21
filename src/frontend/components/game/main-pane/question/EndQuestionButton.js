import SkipNextIcon from '@mui/icons-material/SkipNext';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { endQuestion } from '@/backend/services/question/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.EndQuestionButton', {
  endQuestion: 'End question',
});

/**
 * End the question
 * @param {string} lang - Language code
 * @param {string} questionType - Type of question to end
 * @returns
 */
export default function EndQuestionButton({ questionType }) {
  const intl = useIntl();
  const game = useGame();

  const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
    await endQuestion(game.id, game.currentRound, game.currentQuestion, questionType);
  });

  return (
    <Button
      variant="outlined"
      color="warning"
      startIcon={<SkipNextIcon />}
      onClick={handleEndQuestion}
      disabled={isEnding}
    >
      {intl.formatMessage(messages.endQuestion)}
    </Button>
  );
}
