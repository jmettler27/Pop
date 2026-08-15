'use client';

import { useIntl } from 'react-intl';

import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useAllTeamsOnce } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import globalMessages from '@/frontend/i18n/globalMessages';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

export default function EstimationBottomPane({ baseQuestion }: { baseQuestion: EstimationQuestion }) {
  const game = useGame();

  const { gameQuestion, loading, error } = useQuestion(
    game?.id ?? null,
    game?.currentRound ?? null,
    QuestionType.ESTIMATION,
    game?.currentQuestion as string
  );

  if (!game) return null;

  if (error || loading || !gameQuestion) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameEstimationQuestion;

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <EstimationController />
      </div>
      <div className="basis-1/4">
        <EstimationSubmittedTeams gameQuestion={gameQuestionData} />
      </div>
    </div>
  );
}

function EstimationController() {
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      {myRole === ParticipantRole.ORGANIZER && <EstimationOrganizerController />}
    </div>
  );
}

function EstimationOrganizerController() {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <ResetQuestionButton questionType={QuestionType.ESTIMATION} />
      <EndQuestionButton questionType={QuestionType.ESTIMATION} />
    </div>
  );
}

function EstimationSubmittedTeams({ gameQuestion }: { gameQuestion: GameEstimationQuestion }) {
  const intl = useIntl();
  const game = useGame();
  const { teams, loading, error } = useAllTeamsOnce(game?.id ?? null);
  if (!game) return null;

  if (error || loading || !teams) {
    return <></>;
  }

  const typedTeams = teams as unknown as { id: string; name: string }[];

  const getTeamName = (teamId: string) => {
    const team = typedTeams.find((t) => t.id === teamId);
    return team ? team.name : teamId;
  };

  return (
    <div className="flex flex-col h-full w-full justify-start p-2">
      <h2 className="font-bold text-xl">{intl.formatMessage(globalMessages.submittedTeams)}</h2>
      {gameQuestion.bets && gameQuestion.bets.length > 0 ? (
        <ul className="overflow-auto">
          {gameQuestion.bets.map((submission) => (
            <li key={submission.teamId} className="px-2 py-0.5">
              {getTeamName(submission.teamId)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="2xl:text-xl italic opacity-50">{intl.formatMessage(globalMessages.nobody)}</p>
      )}
    </div>
  );
}
