import SkipNextIcon from '@mui/icons-material/SkipNext';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { endQuestion } from '@/backend/services/question/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { type QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.EndQuestionButton', {
  endQuestion: 'End question',
});

interface EndQuestionButtonProps {
  questionType: QuestionType;
}

export default function EndQuestionButton({ questionType }: EndQuestionButtonProps) {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
    await endQuestion(game!.id as string, currentRound as string, game!.currentQuestion as string, questionType);
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
