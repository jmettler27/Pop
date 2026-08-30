'use client';

import { useIntl } from 'react-intl';

import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useAllTeamsOnce } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/question-type';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';
import { ParticipantRole } from '@/models/users/participant';

export default function ReorderingBottomPane({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const { gameQuestion, loading, error } = useQuestion(gameId, roundId, QuestionType.REORDERING, questionId);

  if (error || loading || !gameQuestion) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <ReorderingController />
      </div>

      {/* Right part: list of teams that submitted */}
      <div className="basis-1/4">
        <ReorderingSubmittedTeams gameQuestion={gameQuestion as unknown as GameReorderingQuestion} />
      </div>
    </div>
  );
}

function ReorderingController() {
  const role = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      {role === ParticipantRole.ORGANIZER && <ReorderingOrganizerController />}
    </div>
  );
}

function ReorderingOrganizerController() {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <ResetQuestionButton />
      <EndQuestionButton />
    </div>
  );
}

function ReorderingSubmittedTeams({ gameQuestion }: { gameQuestion: GameReorderingQuestion }) {
  const intl = useIntl();
  const gameId = useGameId();
  const { teams, loading, error } = useAllTeamsOnce(gameId);

  if (error || loading || !teams) {
    return <></>;
  }

  const getTeamName = (teamId: string) => {
    if (!teams) return teamId;
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : teamId;
  };

  const orderings = gameQuestion.orderings;

  return (
    <div className="flex flex-col h-full w-full justify-start p-2">
      <h2 className="font-bold text-xl">{intl.formatMessage(globalMessages.submittedTeams)}</h2>
      {orderings.length > 0 ? (
        <ul className="overflow-auto">
          {orderings.map((o, index) => (
            <li key={o.teamId} className="px-2 py-0.5">
              {index + 1}. {getTeamName(o.teamId)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="2xl:text-xl italic opacity-50">{intl.formatMessage(globalMessages.nobody)}</p>
      )}
    </div>
  );
}
