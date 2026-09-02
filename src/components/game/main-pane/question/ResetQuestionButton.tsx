import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { PLAYER_ACTIONS, QUESTION_ACTIONS, questionAction, updatePlayer } from '@/api';
import { Button } from '@/components/ui/button';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import useUserId from '@/hooks/useUserId';
import defineMessages from '@/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.ResetQuestionButton', {
  resetQuestion: 'Reset question',
});

export default function ResetQuestionButton() {
  const intl = useIntl();
  const userId = useUserId();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    await Promise.all([
      updatePlayer(gameId, userId as string, { action: PLAYER_ACTIONS.ResetAllStatus }),
      questionAction(gameId, roundId, questionId, { action: QUESTION_ACTIONS.QuestionReset }),
    ]);
  });

  return (
    <Button
      variant="outline"
      className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
      onClick={handleResetQuestion}
      disabled={isResetting}
    >
      <RotateCcw className="mr-2 size-4" />
      {intl.formatMessage(messages.resetQuestion)}
    </Button>
  );
}
