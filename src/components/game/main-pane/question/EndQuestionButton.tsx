import { SkipForward } from 'lucide-react';
import { useIntl } from 'react-intl';

import { QUESTION_ACTIONS, questionAction } from '@/api';
import { Button } from '@/components/ui/button';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import defineMessages from '@/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.EndQuestionButton', {
  endQuestion: 'End question',
});

export default function EndQuestionButton() {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: QUESTION_ACTIONS.QuestionClose });
  });

  return (
    <Button
      variant="outline"
      className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
      onClick={handleEndQuestion}
      disabled={isEnding}
    >
      <SkipForward className="mr-2 size-4" />
      {intl.formatMessage(messages.endQuestion)}
    </Button>
  );
}
