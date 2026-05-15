import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { startRound } from '@/backend/services/round/actions';
import ReadyPlayerController from '@/frontend/components/game/main-pane/ReadyPlayerController';
import TimerPane from '@/frontend/components/game/timer/TimerPane';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import { ParticipantRole } from '@/models/users/Participant';

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
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController />
      {myRole === ParticipantRole.ORGANIZER && <RoundStartOrganizerButton />}
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
