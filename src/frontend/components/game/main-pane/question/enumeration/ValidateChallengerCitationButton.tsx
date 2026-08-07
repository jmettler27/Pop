import { Plus } from 'lucide-react';
import { useIntl } from 'react-intl';

import { incrementValidItems } from '@/backend/services/question/enumeration/actions';
import { Button } from '@/frontend/components/ui/button';
import { Spinner } from '@/frontend/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/frontend/components/ui/tooltip';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
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
    await incrementValidItems(game.id as string, game.currentRound as string, game.currentQuestion as string, user.id!);
  });

  if (!gameRepositories) return null;
  const { timerRepo } = gameRepositories;
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError) {
    return <></>;
  }
  if (timerLoading) {
    return <Spinner />;
  }
  if (!timer) {
    return <></>;
  }

  const isClickable = timer.status === TimerStatus.START;

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <Button
          variant="ghost"
          size="icon"
          className="text-green-500 hover:bg-green-500/10"
          onClick={handleClick}
          disabled={!isClickable || isSubmitting}
        >
          <Plus />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isClickable ? intl.formatMessage(messages.validateCitation) : intl.formatMessage(messages.activateTimerFirst)}
      </TooltipContent>
    </Tooltip>
  );
}
