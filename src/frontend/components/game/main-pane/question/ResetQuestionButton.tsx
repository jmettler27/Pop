import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction, updatePlayer } from '@/frontend/api';
import { Button } from '@/frontend/components/ui/button';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useUserId from '@/frontend/hooks/useUserId';
import defineMessages from '@/frontend/i18n/defineMessages';
import { type QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.ResetQuestionButton', {
  resetQuestion: 'Reset question',
});

interface ResetQuestionButtonProps {
  questionType: QuestionType;
}

export default function ResetQuestionButton(_props: ResetQuestionButtonProps) {
  const intl = useIntl();
  const userId = useUserId();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    await Promise.all([
      updatePlayer(gameId, userId as string, { action: 'reset_all_status' }),
      questionAction(gameId, roundId, questionId, { action: 'reset' }),
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
