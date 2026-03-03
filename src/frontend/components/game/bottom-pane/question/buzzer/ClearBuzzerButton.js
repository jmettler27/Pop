import { clearBuzzer } from '@/backend/services/question/buzzer/actions';
import { useGameContext } from '@/frontend/contexts';
import globalMessages from '@/i18n/globalMessages';

import { useIntl } from 'react-intl';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button } from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';

export default function ClearBuzzerButton({ questionType }) {
  const intl = useIntl();
  const game = useGameContext();

  const [handleClick, isClearing] = useAsyncAction(async () => {
    await clearBuzzer(game.currentQuestionType, game.id, game.currentRound, game.currentQuestion);
  });

  return (
    <Button variant="outlined" color="warning" startIcon={<ClearAllIcon />} onClick={handleClick} disabled={isClearing}>
      {intl.formatMessage(globalMessages.clearBuzzer)}
    </Button>
  );
}
