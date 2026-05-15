import { CircularProgress } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameMatchingQuestion } from '@/models/questions/matching';
import { QuestionType } from '@/models/questions/question-type';
import { MatchingRound } from '@/models/rounds/matching';
import { type AnyRound } from '@/models/rounds/RoundFactory';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.MatchingBottomPane', {
  maxMistakesExceeded: 'You have exceeded the maximum number of mistakes!',
  youCanMakeMore: 'You can still make',
  mistake: 'mistake',
  mistakes: 'mistakes',
});

interface Chooser {
  chooserOrder: string[];
  chooserIdx: number;
}

export default function MatchingBottomPane() {
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
        <MatchingController chooser={chooserData} />
      </div>
      <div className="basis-1/4">
        <MatchingRunningOrder chooser={chooserData} />
      </div>
    </div>
  );
}

function MatchingController({ chooser }: { chooser: Chooser }) {
  const myRole = useRole();
  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx];

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId ?? ''} />
      </span>
      {myRole === ParticipantRole.PLAYER && <MatchingPlayerQuestionController />}
      {myRole === ParticipantRole.ORGANIZER && <MatchingOrganizerQuestionController />}
    </div>
  );
}

function MatchingPlayerQuestionController() {
  const intl = useIntl();
  const game = useGame();
  if (!game) return null;
  const myTeam = useTeam();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { roundRepo } = gameRepositories;

  const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound as string);

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id as string, game.currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (roundError || gameQuestionError) return <></>;
  if (roundLoading || gameQuestionLoading) return <CircularProgress />;
  if (!round || !gameQuestion) return <></>;

  const matchingRound = round as unknown as MatchingRound;
  const matchingQuestion = gameQuestion as unknown as GameMatchingQuestion;
  const teamNumMistakes = matchingQuestion.teamNumMistakes ?? {};
  const maxMistakes = matchingRound.maxMistakes ?? GameMatchingQuestion.MAX_NUM_MISTAKES;
  const remainingMistakes = maxMistakes - (teamNumMistakes[myTeam ?? ''] ?? 0);

  const isCanceled = GameMatchingQuestion.matchingTeamIsCanceled(myTeam ?? '', teamNumMistakes, maxMistakes);

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
}

function MatchingOrganizerQuestionController() {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.MATCHING} />
      <EndQuestionButton questionType={QuestionType.MATCHING} />
    </div>
  );
}

interface Team {
  id: string;
  name: string;
}

function MatchingRunningOrder({ chooser }: { chooser: Chooser }) {
  const intl = useIntl();
  const game = useGame();
  if (!game) return null;

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo } = gameRepositories;

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id as string, game.currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);
  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeams();

  if (gameQuestionError || teamsError) return <></>;
  if (gameQuestionLoading || teamsLoading) return <CircularProgress />;
  if (!gameQuestion || !teams) return <></>;

  const matchingQuestion = gameQuestion as unknown as GameMatchingQuestion;
  const canceled: string[] = matchingQuestion.canceled ?? [];
  const teamNumMistakes: Record<string, number> = matchingQuestion.teamNumMistakes ?? {};
  const canceledSet = new Set(canceled);

  const { chooserOrder, chooserIdx } = chooser;

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
              {idx + 1}. {getTeamName(teams as Team[], teamId)}{' '}
              {teamId in teamNumMistakes && `(${teamNumMistakes[teamId]})`}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function getTeamName(teams: Team[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.name ?? teamId;
}
