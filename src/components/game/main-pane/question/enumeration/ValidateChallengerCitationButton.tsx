import { Plus } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction } from '@/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import defineMessages from '@/i18n/defineMessages';
import { TimerStatus } from '@/models/timer';

const messages = defineMessages('frontend.game.bottom.ValidateChallengerCitationButton', {
  validateCitation: 'Validate citation',
  activateTimerFirst: 'Activate timer first!',
});

export default function ValidateChallengerCitationButton() {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { timer, timerLoading, timerError } = useTimer(gameId);

  const [handleClick, isSubmitting] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'increment_valid_items' });
  });

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
