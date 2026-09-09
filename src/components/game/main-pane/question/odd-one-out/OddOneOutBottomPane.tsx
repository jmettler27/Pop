'use client';

import { useIntl } from 'react-intl';

import GameChooserOrder from '@/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/components/game/main-pane/question/ResetQuestionButton';
import { useTimer } from '@/hooks/firestore/timer/useTimerHooks';
import { useChooser } from '@/hooks/firestore/user/useChooserHooks';
import useGameId from '@/hooks/useGameId';
import useRole from '@/hooks/useRole';
import useTeamId from '@/hooks/useTeamId';
import defineMessages from '@/i18n/defineMessages';
import { Chooser } from '@/models/chooser';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.OddOneOutBottomPane', {
  youCanGo: 'You can go',
  waitForAuth: 'Wait for your authorization',
});

export default function OddOneOutBottomPane() {
  const gameId = useGameId();
  const { chooser, loading, error } = useChooser(gameId);

  if (error || loading || !chooser) {
    return <></>;
  }

  const chooserData = chooser as unknown as Chooser;

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <OddOneOutController chooser={chooserData} />
      </div>
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooserData} />
      </div>
    </div>
  );
}

function OddOneOutController({ chooser }: { chooser: Chooser }) {
  const role = useRole();
  const teamId = useTeamId();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx] ?? '';

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
      {role === ParticipantRole.ORGANIZER && <OddOneOutOrganizerController />}
      {role === ParticipantRole.PLAYER && teamId === chooserTeamId && <OddOneOutChooserController />}
    </div>
  );
}

export function OddOneOutChooserStatusText({ authorized }: { authorized: boolean }) {
  const intl = useIntl();
  return authorized ? (
    <span className="text-xl 2xl:text-3xl text-green-500 font-bold">👍 {intl.formatMessage(messages.youCanGo)}</span>
  ) : (
    <span className="text-xl 2xl:text-3xl text-yellow-500">🤨 {intl.formatMessage(messages.waitForAuth)}</span>
  );
}

function OddOneOutChooserController() {
  const gameId = useGameId();
  const { timer, timerLoading, timerError } = useTimer(gameId);

  if (timerError || timerLoading || !timer) {
    return <></>;
  }

  return <OddOneOutChooserStatusText authorized={timer.authorized} />;
}

function OddOneOutOrganizerController() {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <ResetQuestionButton />
      <EndQuestionButton />
    </div>
  );
}
