import { CircularProgress } from '@mui/material';

import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import { GameRounds } from '@/models/games/game';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';
import { ParticipantRole } from '@/models/users/participant';

interface MCQBottomPaneProps {
  baseQuestion: MCQQuestion;
}

export default function MCQBottomPane({ baseQuestion: _baseQuestion }: MCQBottomPaneProps) {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { chooserRepo } = gameRepositories;
  const { chooser, loading, error } = chooserRepo.useChooser();

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!chooser) {
    return <></>;
  }

  const chooserData = chooser as unknown as Chooser;

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      <div className="basis-3/4">
        <MCQController chooser={chooserData} />
      </div>
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser as unknown as Chooser} />
      </div>
    </div>
  );
}

interface MCQControllerProps {
  chooser: Chooser;
}

function MCQController({ chooser }: MCQControllerProps) {
  const game = useGame() as GameRounds;
  if (!game) return null;

  const myRole = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx] ?? '';

  const gameQuestionRepo = new GameMCQQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <MCQOrganizerController gameQuestion={gameQuestion as GameMCQQuestion} />;
    case ParticipantRole.PLAYER:
      return <MCQPlayerController chooserTeamId={chooserTeamId} />;
    default:
      return <MCQSpectatorController chooserTeamId={chooserTeamId} />;
  }
}

interface MCQOrganizerControllerProps {
  gameQuestion: GameMCQQuestion;
}

function MCQOrganizerController({ gameQuestion }: MCQOrganizerControllerProps) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={gameQuestion.teamId ?? ''} />
      </span>
      <div className="flex flex-row w-full justify-end">
        <ResetQuestionButton questionType={QuestionType.MCQ} />
        <EndQuestionButton questionType={QuestionType.MCQ} />
      </div>
    </div>
  );
}

interface MCQPlayerControllerProps {
  chooserTeamId: string;
}

function MCQPlayerController({ chooserTeamId }: MCQPlayerControllerProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}

interface MCQSpectatorControllerProps {
  chooserTeamId: string;
}

function MCQSpectatorController({ chooserTeamId }: MCQSpectatorControllerProps) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}
