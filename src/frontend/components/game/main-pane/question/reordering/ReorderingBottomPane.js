'use client';

import { List, ListItem, ListItemText } from '@mui/material';
import { useIntl } from 'react-intl';

import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/QuestionType';
import { ParticipantRole } from '@/models/users/Participant';

export default function ReorderingBottomPane({ baseQuestion }) {
  const game = useGame();
  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

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
        <ReorderingSubmittedTeams gameQuestion={gameQuestion} />
      </div>
    </div>
  );
}

function ReorderingController() {
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-2">
      {myRole === ParticipantRole.ORGANIZER && <ReorderingOrganizerController />}
    </div>
  );
}

function ReorderingOrganizerController() {
  return (
    <div className="flex flex-row h-full items-center justify-center">
      <ResetQuestionButton questionType={QuestionType.REORDERING} />
      <EndQuestionButton questionType={QuestionType.REORDERING} />
    </div>
  );
}

function ReorderingSubmittedTeams({ gameQuestion }) {
  const intl = useIntl();
  const { teamRepo } = useGameRepositories();
  const { teams, loading, error } = teamRepo.useAllTeamsOnce();

  if (error || loading || !teams) {
    return <></>;
  }

  const getTeamName = (teamId) => {
    if (!teams) return teamId;
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : teamId;
  };

  return (
    <div className="flex flex-col h-full w-full justify-start p-2">
      <h2 className="font-bold text-xl">{intl.formatMessage(globalMessages.submittedTeams)}</h2>
      {gameQuestion.orderings && gameQuestion.orderings.length > 0 ? (
        <List className="overflow-auto">
          {gameQuestion.orderings.map((submission, index) => (
            <ListItem key={submission.teamId} dense>
              <ListItemText primary={getTeamName(submission.teamId)} />
            </ListItem>
          ))}
        </List>
      ) : (
        <p className="2xl:text-xl italic opacity-50">{intl.formatMessage(globalMessages.nobody)}</p>
      )}
    </div>
  );
}
