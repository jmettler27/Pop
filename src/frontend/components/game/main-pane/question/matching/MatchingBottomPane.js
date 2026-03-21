import { CircularProgress } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { GameMatchingQuestion } from '@/backend/models/questions/Matching';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ParticipantRole } from '@/backend/models/users/Participant';
import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.MatchingBottomPane', {
  maxMistakesExceeded: 'You have exceeded the maximum number of mistakes!',
  youCanMakeMore: 'You can still make',
  mistake: 'mistake',
  mistakes: 'mistakes',
});

export default function MatchingBottomPane({}) {
  const { chooserRepo } = useGameRepositories();
  const { chooser, loading, error } = chooserRepo.useChooser();

  if (error || loading || !chooser) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <MatchingController chooser={chooser} />
      </div>
      <div className="basis-1/4">
        <MatchingRunningOrder chooser={chooser} />
      </div>
    </div>
  );
}

function MatchingController({ chooser }) {
  const myRole = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx];

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
      {myRole === ParticipantRole.PLAYER && <MatchingPlayerQuestionController />}
      {myRole === ParticipantRole.ORGANIZER && <MatchingOrganizerQuestionController />}
    </div>
  );
}

function MatchingPlayerQuestionController() {
  const intl = useIntl();
  const game = useGame();
  const myTeam = useTeam();

  const { roundRepo } = useGameRepositories();
  const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound);

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (roundError || gameQuestionError) {
    return <></>;
  }
  if (roundLoading || gameQuestionLoading) {
    return <CircularProgress />;
  }
  if (!round || !gameQuestion) {
    return <></>;
  }

  const teamNumMistakes = gameQuestion.teamNumMistakes;
  const remainingMistakes = round.maxMistakes - (teamNumMistakes[myTeam] || 0);
  const maxMistakes = round.maxMistakes;

  const isCanceled = GameMatchingQuestion.matchingTeamIsCanceled(myTeam, teamNumMistakes, maxMistakes);

  return isCanceled ? (
    <span className="2xl:text-3xl text-red-500">
      🙅 {intl.formatMessage(messages.maxMistakesExceeded)} ({maxMistakes})
    </span>
  ) : (
    <span className="2xl:text-3xl">
      {intl.formatMessage(messages.youCanMakeMore)}{' '}
      <span className="font-bold text-red-500">
        {remainingMistakes}{' '}
        {remainingMistakes > 1 ? intl.formatMessage(messages.mistakes) : intl.formatMessage(messages.mistake)}
      </span>
      .
    </span>
  );
  return;
}

function MatchingOrganizerQuestionController({}) {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.MATCHING} />
      <EndQuestionButton questionType={QuestionType.MATCHING} />
    </div>
  );
}

function MatchingRunningOrder({ chooser }) {
  const intl = useIntl();
  const game = useGame();

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  const { teamRepo } = useGameRepositories();
  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();

  if (gameQuestionError || teamsError) {
    return <></>;
  }
  if (gameQuestionLoading || teamsLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion || !teams) {
    return <></>;
  }

  const canceled = gameQuestion.canceled;
  const teamNumMistakes = gameQuestion.teamNumMistakes;
  const canceledSet = new Set(canceled);

  const chooserOrder = chooser.chooserOrder;
  const chooserIdx = chooser.chooserIdx;

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <h2 className="2xl:text-2xl font-bold">
        👥 <span className="underline">{intl.formatMessage(globalMessages.runningOrder)}</span>
      </h2>

      <ol className="overflow-auto">
        {chooserOrder.map((teamId, idx) => {
          const isCanceled = canceledSet.has(teamId);
          return (
            <li
              key={idx}
              className={clsx(
                'xl:text-xl 2xl:text-2xl',
                idx === chooserIdx && 'text-focus',
                isCanceled && 'line-through opacity-25'
              )}
            >
              {idx + 1}. {getTeamName(teams, teamId)} {teamId in teamNumMistakes && `(${teamNumMistakes[teamId]})`}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getTeamName(teams, teamId) {
  return teams.find((t) => t.id === teamId).name;
}
