'use client';

import { List, ListItem, ListItemText } from '@mui/material';
import { useIntl } from 'react-intl';

import GameEstimationQuestionRepository from '@/backend/repositories/question/GameEstimationQuestionRepository';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

export default function EstimationBottomPane({ baseQuestion }: { baseQuestion: EstimationQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameEstimationQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

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
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo } = gameRepositories;
  const { teams, loading, error } = teamRepo.useAllTeamsOnce();

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
        <List className="overflow-auto">
          {gameQuestion.bets.map((submission) => (
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
