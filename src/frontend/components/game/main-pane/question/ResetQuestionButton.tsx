import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { resetAllPlayersStatus } from '@/backend/services/player/actions';
import { resetQuestion } from '@/backend/services/question/actions';
import { Button } from '@/frontend/components/ui/button';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { type QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.ResetQuestionButton', {
  resetQuestion: 'Reset question',
});

interface ResetQuestionButtonProps {
  questionType: QuestionType;
}

export default function ResetQuestionButton({ questionType }: ResetQuestionButtonProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    await Promise.all([resetAllPlayersStatus(gameId), resetQuestion(gameId, roundId, questionId, questionType)]);
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
