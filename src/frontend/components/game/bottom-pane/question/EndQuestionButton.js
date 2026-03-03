import { endQuestion } from '@/backend/services/question/actions';

import { useGameContext } from '@/frontend/contexts';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button } from '@mui/material';
import SkipNextIcon from '@mui/icons-material/SkipNext';

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
  const game = useGameContext();

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
