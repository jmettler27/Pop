import { incrementValidItems } from '@/backend/services/question/enumeration/actions';

import { TimerStatus } from '@/backend/models/Timer';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import useGame from '@/frontend/hooks/useGame';
import useUser from '@/frontend/hooks/useUser';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';

import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import PlusOneIcon from '@mui/icons-material/PlusOne';

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
