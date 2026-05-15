import ClearAllIcon from '@mui/icons-material/ClearAll';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { clearBuzzer } from '@/backend/services/question/buzzer/actions';
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
    <Button variant="outlined" color="warning" startIcon={<ClearAllIcon />} onClick={handleClick} disabled={isClearing}>
      {intl.formatMessage(globalMessages.clearBuzzer)}
    </Button>
  );
}
