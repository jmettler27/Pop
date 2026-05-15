import PlusOneIcon from '@mui/icons-material/PlusOne';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useIntl } from 'react-intl';

import { incrementValidItems } from '@/backend/services/question/enumeration/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import { TimerStatus } from '@/models/Timer';

const messages = defineMessages('frontend.game.bottom.ValidateChallengerCitationButton', {
  validateCitation: 'Validate citation',
  activateTimerFirst: 'Activate timer first!',
});

export default function ValidateChallengerCitationButton() {
  const intl = useIntl();
  const game = useGame();
  const user = useUser();

  const [handleClick, isSubmitting] = useAsyncAction(async () => {
    await incrementValidItems(game.id, game.currentRound, game.currentQuestion, user.id);
  });

  const { timerRepo } = useGameRepositories();
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError) {
    return <></>;
  }
  if (timerLoading) {
    return <CircularProgress />;
  }
  if (!timer) {
    return <></>;
  }

  const isClickable = timer.status === TimerStatus.START;

  return (
    <Tooltip
      title={
        isClickable ? intl.formatMessage(messages.validateCitation) : intl.formatMessage(messages.activateTimerFirst)
      }
      placement="right"
    >
      <span>
        <IconButton
          variant="contained"
          color="success"
          size="medium"
          onClick={handleClick}
          disabled={!isClickable || isSubmitting}
        >
          <PlusOneIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
