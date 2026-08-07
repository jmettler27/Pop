import { RotateCcw } from 'lucide-react';
import { useIntl } from 'react-intl';

import { clearBuzzer } from '@/backend/services/question/buzzer/actions';
import { Button } from '@/frontend/components/ui/button';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { type QuestionType } from '@/models/questions/question-type';

interface ClearBuzzerButtonProps {
  questionType: QuestionType;
}

export default function ClearBuzzerButton({ questionType: _questionType }: ClearBuzzerButtonProps) {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await clearBuzzer(
      game!.currentQuestionType as QuestionType,
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string
    );
  });

  return (
    <Button
      variant="outline"
      className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
      onClick={handleClick}
      disabled={isClearing}
    >
      <RotateCcw className="mr-2 size-4" />
      {intl.formatMessage(globalMessages.clearBuzzer)}
    </Button>
  );
}
