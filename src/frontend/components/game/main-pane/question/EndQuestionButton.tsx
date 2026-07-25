import { SkipForward } from 'lucide-react';
import { useIntl } from 'react-intl';

import { endQuestion } from '@/backend/services/question/actions';
import { Button } from '@/frontend/components/ui/button';
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
