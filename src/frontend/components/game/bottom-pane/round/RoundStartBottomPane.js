import { UserRole } from '@/backend/models/users/User';
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
      {myRole === UserRole.ORGANIZER && <RoundStartOrganizerButton />}
    </div>
  );
}

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

function RoundStartOrganizerButton({ lang = DEFAULT_LOCALE }) {
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
      {ROUND_START_ORGANIZER_BUTTON_TEXT[lang]}
    </Button>
  );
}

const ROUND_START_ORGANIZER_BUTTON_TEXT = {
  en: 'Launch the first question',
  'fr-FR': 'Lancer la première question',
};
