'use client';

import { useIntl } from 'react-intl';

import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import defineMessages from '@/frontend/i18n/defineMessages';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.OddOneOutBottomPane', {
  youCanGo: 'You can go',
  waitForAuth: 'Wait for your authorization',
});

interface Chooser {
  chooserOrder: string[];
  chooserIdx: number;
}

export default function OddOneOutBottomPane() {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { chooserRepo } = gameRepositories;
  const { chooser, loading, error } = chooserRepo.useChooser();

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
  const myRole = useRole();
  const myTeam = useTeam();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx] ?? '';

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
      {myRole === ParticipantRole.ORGANIZER && <OddOneOutOrganizerController />}
      {myRole === ParticipantRole.PLAYER && myTeam === chooserTeamId && <OddOneOutChooserController />}
    </div>
  );
}

function OddOneOutChooserController() {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { timerRepo } = gameRepositories;
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (timerError || timerLoading || !timer) {
    return <></>;
  }

  const timerData = timer as unknown as { authorized: boolean };

  return timerData.authorized ? (
    <span className="text-3xl text-green-500 font-bold">👍 {intl.formatMessage(messages.youCanGo)}</span>
  ) : (
    <span className="text-3xl text-yellow-500">🤨 {intl.formatMessage(messages.waitForAuth)}</span>
  );
}

function OddOneOutOrganizerController() {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <ResetQuestionButton questionType={QuestionType.ODD_ONE_OUT} />
      <EndQuestionButton questionType={QuestionType.ODD_ONE_OUT} />
    </div>
  );
}
