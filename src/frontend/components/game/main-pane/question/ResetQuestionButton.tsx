import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { resetAllPlayersStatus } from '@/backend/services/player/actions';
import { resetQuestion } from '@/backend/services/question/actions';
import { Button } from '@/frontend/components/ui/button';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { type QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.ResetQuestionButton', {
  resetQuestion: 'Reset question',
});

interface ResetQuestionButtonProps {
  questionType: QuestionType;
}

export default function ResetQuestionButton({ questionType }: ResetQuestionButtonProps) {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
    if (!game) return;
    await Promise.all([
      resetAllPlayersStatus(game.id as string),
      resetQuestion(game.id as string, currentRound as string, game.currentQuestion as string, questionType),
    ]);
  });

  if (!game) return null;

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
