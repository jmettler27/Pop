'use client';

import { ArrowRight } from 'lucide-react';
import { useIntl } from 'react-intl';

import { ROUND_ACTIONS, updateRound } from '@/api';
import ReadyPlayerController from '@/components/game/main-pane/ReadyPlayerController';
import TimerPane from '@/components/game/timer/TimerPane';
import { Button } from '@/components/ui/button';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGame from '@/hooks/useGame';
import useRole from '@/hooks/useRole';
import defineMessages from '@/i18n/defineMessages';
import { ParticipantRole } from '@/models/users/participant';

export default function RoundStartBottomPane() {
  return (
    <div className="flex flex-row h-full items-center justify-center divide-x divide-solid">
      <div className="flex flex-col h-full w-1/5 items-center justify-center">
        <TimerPane />
      </div>

      <div className="flex flex-col h-full w-4/5  items-center justify-center">
        <RoundStartController />
      </div>
    </div>
  );
}

function RoundStartController() {
  const role = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController />
      {role === ParticipantRole.ORGANIZER && <RoundStartOrganizerButton />}
    </div>
  );
}

const messages = defineMessages('frontend.game.bottom.RoundStartBottomPane', {
  launchFirstQuestion: 'Launch the first question',
});

function RoundStartOrganizerButton() {
  const intl = useIntl();
  const game = useGame();

  const [handleContinueClick, isHandling] = useAsyncAction(async () => {
    if (!game) return;
    await updateRound(game.id as string, game.currentRound as string, { action: ROUND_ACTIONS.Start });
  });

  if (!game) return null;

  return (
    <Button className="rounded-full" variant="secondary" size="lg" onClick={handleContinueClick} disabled={isHandling}>
      <ArrowRight className="mr-2 size-4" />
      {intl.formatMessage(messages.launchFirstQuestion)}
    </Button>
  );
}
