'use client';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import globalMessages from '@/i18n/globalMessages';

import { List, ListItem, ListItemText } from '@mui/material';

import { useGameContext, useRoleContext, useGameRepositoriesContext } from '@/frontend/contexts';
import { ParticipantRole } from '@/backend/models/users/Participant';
import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/ResetQuestionButton';
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/EndQuestionButton';
import { QuestionType } from '@/backend/models/questions/QuestionType';

const messages = defineMessages('frontend.game.bottom.ReorderingBottomPane', {
  teamSubmitted: 'Submitted teams',
});

export default function ReorderingBottomPane({ baseQuestion }) {
  const game = useGameContext();
  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <></>;
  }
  if (!gameQuestion) {
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
  const myRole = useRoleContext();

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
  const { teamRepo } = useGameRepositoriesContext();
  const { teams, loading, error } = teamRepo.useAllTeamsOnce();

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
  if (!teams) {
    return <></>;
  }

  const getTeamName = (teamId) => {
    if (!teams) return teamId;
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : teamId;
  };

  return (
    <div className="flex flex-col h-full w-full justify-start p-2">
      <h2 className="font-bold text-xl">{intl.formatMessage(messages.teamSubmitted)}</h2>
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
