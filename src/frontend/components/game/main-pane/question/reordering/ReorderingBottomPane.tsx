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
import type { GameRounds } from '@/models/games/game';
import { QuestionType } from '@/models/questions/question-type';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';
import { ParticipantRole } from '@/models/users/participant';

export default function ReorderingBottomPane({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameReorderingQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

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

function ReorderingSubmittedTeams({ gameQuestion }: { gameQuestion: GameReorderingQuestion }) {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo } = gameRepositories;
  const { teams, loading, error } = teamRepo.useAllTeamsOnce();

  if (error || loading || !teams) {
    return <></>;
  }

  const getTeamName = (teamId: string) => {
    if (!teams) return teamId;
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : teamId;
  };

  const orderings = gameQuestion.orderings ? Object.entries(gameQuestion.orderings) : [];

  return (
    <div className="flex flex-col h-full w-full justify-start p-2">
      <h2 className="font-bold text-xl">{intl.formatMessage(globalMessages.submittedTeams)}</h2>
      {orderings.length > 0 ? (
        <List className="overflow-auto">
          {orderings.map(([teamId]) => (
            <ListItem key={teamId} dense>
              <ListItemText primary={getTeamName(teamId)} />
            </ListItem>
          ))}
        </List>
      ) : (
        <p className="2xl:text-xl italic opacity-50">{intl.formatMessage(globalMessages.nobody)}</p>
      )}
    </div>
  );
}
