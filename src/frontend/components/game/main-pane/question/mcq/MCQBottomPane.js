import { CircularProgress } from '@mui/material';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ParticipantRole } from '@/backend/models/users/Participant';
import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import GameChooserOrder from '@/frontend/components/game/chooser/GameChooserOrder';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';

export default function MCQBottomPane({ baseQuestion }) {
  const { chooserRepo } = useGameRepositories();
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

  return (
    <div className="flex flex-row h-full divide-x divide-solid">
      {/* Left part: controller */}
      <div className="basis-3/4">
        <MCQController chooser={chooser} baseQuestion={baseQuestion} />
      </div>

      {/* Right part: list of buzzer players who buzzed and/or were canceled */}
      <div className="basis-1/4">
        <GameChooserOrder chooser={chooser} />
      </div>
    </div>
  );
}

function MCQController({ chooser, baseQuestion }) {
  const game = useGame();
  const myRole = useRole();

  const chooserTeamId = chooser.chooserOrder[chooser.chooserIdx];

  const gameQuestionRepo = new GameMCQQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

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
      return <MCQOrganizerController gameQuestion={gameQuestion} />;
    case ParticipantRole.PLAYER:
      return (
        <MCQPlayerController chooserTeamId={chooserTeamId} gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
      );
    default:
      return <MCQSpectatorController chooserTeamId={chooserTeamId} />;
  }
}

function MCQOrganizerController({ gameQuestion }) {
  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      {/* <BuzzerHeadPlayer gameQuestion={gameQuestion} />
       */}
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={gameQuestion.teamId} />
      </span>
      <div className="flex flex-row w-full justify-end">
        <ResetQuestionButton questionType={QuestionType.MCQ} />
        <EndQuestionButton questionType={QuestionType.MCQ} />
      </div>
    </div>
  );
}

function MCQPlayerController({ chooserTeamId }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}

function MCQSpectatorController({ chooserTeamId }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <span className="2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}
