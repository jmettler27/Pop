import { UserRole } from '@/backend/models/users/User';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { useGameRepositoriesContext, useRoleContext, useTeamContext } from '@/frontend/contexts';
import GameChooserOrder from '@/frontend/components/game/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/GameChooserTeamAnnouncement';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import { QuestionType } from '@/backend/models/questions/QuestionType';

const messages = defineMessages('frontend.game.bottom.OddOneOutBottomPane', {
  youCanGo: 'You can go',
  waitForAuth: 'Wait for your authorization',
});

export default function OddOneOutBottomPane({}) {
  const { chooserRepo } = useGameRepositoriesContext();
  const { chooser, loading, error } = chooserRepo.useChooser();
  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!chooser) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <OddOneOutController chooser={chooser} />
      </div>
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser} />
      </div>
    </div>
  );
}

function OddOneOutController({ chooser }) {
  const myRole = useRoleContext();
  const myTeam = useTeamContext();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx];

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
      {myRole === UserRole.ORGANIZER && <OddOneOutOrganizerController />}
      {myRole === UserRole.PLAYER && myTeam === chooserTeamId && <OddOneOutChooserController />}
    </div>
  );
}

function OddOneOutChooserController() {
  const intl = useIntl();
  const { timerRepo } = useGameRepositoriesContext();
  const { timer, loading, error } = timerRepo.useTimer();
  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!timer) {
    return <></>;
  }

  return timer.authorized ? (
    <span className="text-3xl text-green-500 font-bold">👍 {intl.formatMessage(messages.youCanGo)}</span>
  ) : (
    <span className="text-3xl text-yellow-500">🤨 {intl.formatMessage(messages.waitForAuth)}</span>
  );
}

function OddOneOutOrganizerController({}) {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <ResetQuestionButton questionType={QuestionType.ODD_ONE_OUT} />
      <EndQuestionButton questionType={QuestionType.ODD_ONE_OUT} />
    </div>
  );
}
