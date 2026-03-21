import ClearAllIcon from '@mui/icons-material/ClearAll';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { clearBuzzer } from '@/backend/services/question/buzzer/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/i18n/globalMessages';

export default function ClearBuzzerButton({ questionType }) {
  const intl = useIntl();
  const game = useGame();

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await clearBuzzer(game.currentQuestionType, game.id, game.currentRound, game.currentQuestion);
  });

  return (
    <Button variant="outlined" color="warning" startIcon={<ClearAllIcon />} onClick={handleClick} disabled={isClearing}>
      {intl.formatMessage(globalMessages.clearBuzzer)}
    </Button>
  );
}
