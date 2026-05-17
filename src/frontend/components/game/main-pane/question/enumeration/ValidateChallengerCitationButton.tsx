import PlusOneIcon from '@mui/icons-material/PlusOne';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useIntl } from 'react-intl';

import { incrementValidItems } from '@/backend/services/question/enumeration/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { TimerStatus } from '@/models/timer';

const messages = defineMessages('frontend.game.bottom.ValidateChallengerCitationButton', {
  validateCitation: 'Validate citation',
  activateTimerFirst: 'Activate timer first!',
});

export default function ValidateChallengerCitationButton() {
  const intl = useIntl();
  const game = useGame();
  const user = useUser();

  const gameRepositories = useGameRepositories();

  const [handleClick, isSubmitting] = useAsyncAction(async () => {
    if (!game || !user) return;
    await incrementValidItems(game.id as string, game.currentRound as string, game.currentQuestion as string, user.id);
  });

  if (!gameRepositories) return null;
  const { timerRepo } = gameRepositories;
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

  const isClickable = (timer as { status?: string }).status === TimerStatus.START;

  return (
    <Tooltip
      title={
        isClickable ? intl.formatMessage(messages.validateCitation) : intl.formatMessage(messages.activateTimerFirst)
      }
      placement="right"
    >
      <span>
        <IconButton color="success" size="medium" onClick={handleClick} disabled={!isClickable || isSubmitting}>
          <PlusOneIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
