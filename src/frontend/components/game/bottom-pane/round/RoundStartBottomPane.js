import { ParticipantRole } from '@/backend/models/users/Participant';
import { startRound } from '@/backend/services/round/actions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext, useRoleContext } from '@/frontend/contexts';
import TimerPane from '@/frontend/components/game/timer/TimerPane';
import ReadyPlayerController from '@/frontend/components/game/bottom-pane/ReadyPlayerController';

import { Button } from '@mui/material';

export default function RoundStartBottomPane({}) {
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

function RoundStartController({}) {
  const myRole = useRoleContext();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController />
      {myRole === ParticipantRole.ORGANIZER && <RoundStartOrganizerButton />}
    </div>
  );
}

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.RoundStartBottomPane', {
  launchFirstQuestion: 'Launch the first question',
});

function RoundStartOrganizerButton() {
  const intl = useIntl();
  const game = useGameContext();

  const [handleContinueClick, isHandling] = useAsyncAction(async () => {
    await startRound(game.currentQuestionType, game.id, game.currentRound);
  });

  return (
    <Button
      className="rounded-full"
      size="large"
      variant="contained"
      color="secondary"
      onClick={handleContinueClick}
      disabled={isHandling}
      startIcon={<ArrowForwardIosIcon />}
    >
      {intl.formatMessage(messages.launchFirstQuestion)}
    </Button>
  );
}
