import { SkipForward } from 'lucide-react';
import { useIntl } from 'react-intl';

import { endQuestion } from '@/backend/services/question/actions';
import { Button } from '@/frontend/components/ui/button';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import { type QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.EndQuestionButton', {
  endQuestion: 'End question',
});

interface EndQuestionButtonProps {
  questionType: QuestionType;
}

export default function EndQuestionButton({ questionType }: EndQuestionButtonProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
    await endQuestion(gameId, roundId, questionId, questionType);
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
